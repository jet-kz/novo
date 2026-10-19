"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Navigation } from "lucide-react";
import { GeoPoint, Order } from "@/types";
import type { MapMarker } from "@/components/map/MapView";

const MapView = dynamic(() => import("@/components/map/MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-100 dark:bg-slate-800 animate-pulse" />,
});

interface Props {
  order: Order;
  /** The rider's own live position (rider app) — overrides the order's last reported fix. */
  riderPosition?: GeoPoint | null;
  /** Show the "Navigate" button to the next stop (rider app). */
  forRider?: boolean;
  className?: string;
  /** Road path from useOrderRoute, drawn under the markers. */
  route?: GeoPoint[];
}

const directionsUrl = (to: GeoPoint, from?: GeoPoint | null) =>
  `https://www.google.com/maps/dir/?api=1&destination=${to.lat},${to.lon}&travelmode=driving${from ? `&origin=${from.lat},${from.lon}` : ""}`;

/** Store, customer and live rider on one map. */
export function LiveOrderMap({ order, riderPosition, forRider = false, className = "h-64", route }: Props) {
  const rider = riderPosition || order.riderLocation || null;
  const markers: MapMarker[] = [];
  if (order.storeLocation) markers.push({ id: "store", kind: "store", ...order.storeLocation, label: order.storeName || "Store" });
  if (order.dropoffLocation) markers.push({ id: "home", kind: "home", ...order.dropoffLocation, label: "Delivery" });
  if (rider) markers.push({ id: "rider", kind: forRider ? "you" : "rider", lat: rider.lat, lon: rider.lon, label: forRider ? "You" : order.riderName || "Rider" });

  const center = rider || order.dropoffLocation || order.storeLocation;
  if (!center) return null;

  // Before pickup the rider heads to the store; after, to the customer.
  const headingToStore = order.status === "rider_assigned" || order.status === "ready_for_pickup";
  const nextStop = headingToStore ? order.storeLocation : order.dropoffLocation;

  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`}>
      <MapView center={center} zoom={14} markers={markers} fitMarkers route={route} />
      {forRider && nextStop && (
        <a
          href={directionsUrl(nextStop, rider)}
          target="_blank"
          rel="noreferrer"
          className="absolute z-[500] right-3 bottom-3 px-4 py-2.5 rounded-full bg-[#087F5B] text-white text-sm font-bold shadow-lg flex items-center gap-2"
        >
          <Navigation className="w-4 h-4" /> Navigate to {headingToStore ? "store" : "customer"}
        </a>
      )}
      {!forRider && !rider && (order.status === "rider_assigned" || order.status === "picked_up") && (
        <span className="absolute z-[500] left-3 bottom-3 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 text-xs font-semibold text-slate-600 dark:text-slate-300">
          Waiting for the rider&apos;s location…
        </span>
      )}
    </div>
  );
}
