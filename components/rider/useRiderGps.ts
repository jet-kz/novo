"use client";

import { useEffect, useRef, useState } from "react";
import { apiService } from "@/services/api";
import { calculateHaversineDistance, Coordinates } from "@/utils/locationUtils";

const SEND_EVERY_MS = 15000;
const SEND_IF_MOVED_KM = 0.03; // 30 m

/**
 * While the rider is online, watch GPS and report it to the backend (throttled), so customers
 * and merchants can see the rider moving. Returns the latest position and any GPS problem.
 */
export function useRiderGps(active: boolean) {
  const [position, setPosition] = useState<Coordinates | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const lastSent = useRef<{ at: number; pos: Coordinates } | null>(null);

  useEffect(() => {
    if (!active) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setProblem("This browser can't share location, so customers won't see you on the map.");
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const here = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setPosition(here);
        setProblem(null);
        const prev = lastSent.current;
        const moved = prev ? calculateHaversineDistance(prev.pos.lat, prev.pos.lon, here.lat, here.lon) : Infinity;
        if (!prev || Date.now() - prev.at > SEND_EVERY_MS || moved > SEND_IF_MOVED_KM) {
          lastSent.current = { at: Date.now(), pos: here };
          apiService.postRiderGpsLocation({ latitude: here.lat, longitude: here.lon }).catch(() => {});
        }
      },
      (err) => {
        setProblem(
          err.code === err.PERMISSION_DENIED
            ? "Location is blocked. Allow location for Novo so customers can track you and you get nearby jobs."
            : "Waiting for a GPS signal…"
        );
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [active]);

  return { position, problem };
}
