"use client";

import { useEffect, useRef, useState } from "react";
import type { GeoPoint, Order } from "@/types";

// Public OSRM demo server by default; point NEXT_PUBLIC_ROUTING_URL at your own for heavy traffic.
const ROUTING_URL = process.env.NEXT_PUBLIC_ROUTING_URL || "https://router.project-osrm.org";
// OSRM times are for cars on empty roads; bikes in city traffic run a little slower.
const TRAFFIC_FACTOR = 1.2;
const REFETCH_AFTER_M = 150;
const REFETCH_AFTER_MS = 60_000;

export interface OrderRoute {
  /** Road path from the rider to their next stop. */
  path: GeoPoint[];
  minutes: number | null;
  km: number | null;
  /** Where the rider is heading now. */
  heading: "store" | "customer" | null;
}

function metersBetween(a: GeoPoint, b: GeoPoint) {
  const r = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
}

/**
 * Road route + ETA from the rider to where they're going next (the store before pickup,
 * the customer after). Re-routes when the rider has moved ~150 m or after a minute.
 * Falls back to the server's straight-line ETA if routing is unavailable.
 */
export function useOrderRoute(order: Order | null | undefined, riderPosition?: GeoPoint | null): OrderRoute {
  const rider = riderPosition || order?.riderLocation || null;
  const onJob = order?.status === "rider_assigned" || order?.status === "picked_up";
  const heading: OrderRoute["heading"] = !onJob ? null : order?.status === "picked_up" ? "customer" : "store";
  const target = heading === "customer" ? order?.dropoffLocation : heading === "store" ? order?.storeLocation : null;

  const [route, setRoute] = useState<{ to: string; path: GeoPoint[]; minutes: number; km: number } | null>(null);
  const last = useRef<{ from: GeoPoint; to: string; at: number } | null>(null);

  const targetKey = target ? `${target.lat.toFixed(5)},${target.lon.toFixed(5)}` : "";
  const riderLat = rider?.lat;
  const riderLon = rider?.lon;

  useEffect(() => {
    if (riderLat == null || riderLon == null || !target) {
      last.current = null;
      return;
    }
    const from = { lat: riderLat, lon: riderLon };
    const prev = last.current;
    if (prev && prev.to === targetKey && metersBetween(prev.from, from) < REFETCH_AFTER_M && Date.now() - prev.at < REFETCH_AFTER_MS) {
      return;
    }
    last.current = { from, to: targetKey, at: Date.now() };
    const ctrl = new AbortController();
    fetch(
      `${ROUTING_URL}/route/v1/driving/${from.lon},${from.lat};${target.lon},${target.lat}?overview=simplified&geometries=geojson`,
      { signal: ctrl.signal }
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const best = data?.routes?.[0];
        if (!best) return;
        setRoute({
          to: targetKey,
          path: (best.geometry?.coordinates || []).map(([lon, lat]: [number, number]) => ({ lat, lon })),
          minutes: Math.max(1, Math.round((best.duration / 60) * TRAFFIC_FACTOR)),
          km: Math.round((best.distance / 1000) * 10) / 10,
        });
      })
      .catch(() => {});
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riderLat, riderLon, targetKey]);

  if (!onJob || !rider || !target) return { path: [], minutes: order?.etaMinutes ?? null, km: null, heading };
  // A route computed for the previous stop (store) is ignored once the rider is heading to the customer.
  const current = route && route.to === targetKey ? route : null;
  return {
    path: current?.path || [],
    minutes: current?.minutes ?? order?.etaMinutes ?? null,
    km: current?.km ?? null,
    heading,
  };
}

/** "just now", "40s ago", "3 min ago" for the rider's last GPS fix. */
export function freshness(iso?: string | null, now = Date.now()): { text: string; stale: boolean } | null {
  if (!iso) return null;
  const secs = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (Number.isNaN(secs)) return null;
  const text = secs < 10 ? "just now" : secs < 60 ? `${secs}s ago` : `${Math.round(secs / 60)} min ago`;
  return { text, stale: secs > 120 };
}
