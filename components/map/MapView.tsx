"use client";

import React, { useEffect, useRef } from "react";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";

export interface LatLon {
  lat: number;
  lon: number;
}

export interface MapMarker extends LatLon {
  id: string;
  kind: "store" | "home" | "rider" | "you";
  label?: string;
}

interface MapViewProps {
  center: LatLon;
  zoom?: number;
  markers?: MapMarker[];
  /** Zoom/pan so every marker is visible whenever the set of markers changes. */
  fitMarkers?: boolean;
  /** Called after the user pans/zooms (location picker uses the map centre as the pin). */
  onCenterChange?: (center: LatLon) => void;
  /** Change this to move the map to `center` programmatically (e.g. after a search). */
  recenterKey?: string | number;
  className?: string;
  interactive?: boolean;
}

// OpenStreetMap tiles by default. For heavy production traffic set NEXT_PUBLIC_MAP_TILE_URL to a
// provider with a key (e.g. MapTiler/Stadia) — OSM's own servers ask for light use only.
const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION =
  process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const MARKER_STYLE: Record<MapMarker["kind"], { bg: string; glyph: string }> = {
  store: { bg: "#087F5B", glyph: "🏪" },
  home: { bg: "#0F172A", glyph: "🏠" },
  rider: { bg: "#F59E0B", glyph: "🛵" },
  you: { bg: "#2563EB", glyph: "" },
};

function markerIcon(L: typeof Leaflet, kind: MapMarker["kind"]) {
  const { bg, glyph } = MARKER_STYLE[kind];
  const html =
    kind === "you"
      ? `<span style="display:block;width:18px;height:18px;border-radius:50%;background:${bg};border:3px solid #fff;box-shadow:0 0 0 6px rgba(37,99,235,.2)"></span>`
      : `<span style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:${bg};border:3px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.25);font-size:17px">${glyph}</span>`;
  const size = kind === "you" ? 18 : 36;
  return L.divIcon({ html, className: "", iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}

/** Leaflet map, created in the browser only. */
export function MapView({
  center,
  zoom = 15,
  markers = [],
  fitMarkers = false,
  onCenterChange,
  recenterKey,
  className = "",
  interactive = true,
}: MapViewProps) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const LRef = useRef<typeof Leaflet | null>(null);
  const layerRef = useRef<Leaflet.LayerGroup | null>(null);
  const markerRefs = useRef<Map<string, Leaflet.Marker>>(new Map());
  const onCenterRef = useRef(onCenterChange);
  onCenterRef.current = onCenterChange;

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((mod) => {
      const L = (mod as any).default ?? mod;
      if (cancelled || !el.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(el.current, {
        center: [center.lat, center.lon],
        zoom,
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: interactive,
        touchZoom: interactive,
        doubleClickZoom: interactive,
        attributionControl: true,
      });
      L.tileLayer(TILE_URL, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      map.on("moveend", () => {
        const c = map.getCenter();
        onCenterRef.current?.({ lat: c.lat, lon: c.lng });
      });
      mapRef.current = map;
      // Containers inside sheets/modals size late; fix tiles once laid out.
      setTimeout(() => map.invalidateSize(), 150);
      syncMarkers(true);
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRefs.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncMarkers = (refit: boolean) => {
    const L = LRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!L || !map || !layer) return;
    const seen = new Set<string>();
    for (const m of markers) {
      seen.add(m.id);
      const existing = markerRefs.current.get(m.id);
      if (existing) {
        existing.setLatLng([m.lat, m.lon]); // moves smoothly for the live rider pin
      } else {
        const marker = L.marker([m.lat, m.lon], { icon: markerIcon(L, m.kind), keyboard: false });
        if (m.label) marker.bindTooltip(m.label, { direction: "top", offset: [0, -16] });
        marker.addTo(layer);
        markerRefs.current.set(m.id, marker);
      }
    }
    for (const [id, marker] of markerRefs.current) {
      if (!seen.has(id)) {
        layer.removeLayer(marker);
        markerRefs.current.delete(id);
      }
    }
    if (refit && fitMarkers && markers.length > 1) {
      map.fitBounds(L.latLngBounds(markers.map((m) => [m.lat, m.lon] as [number, number])), { padding: [48, 48], maxZoom: 16 });
    } else if (refit && fitMarkers && markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lon], zoom);
    }
  };

  const markerKey = markers.map((m) => `${m.id}:${m.lat.toFixed(5)},${m.lon.toFixed(5)}`).join("|");
  const markerIds = markers.map((m) => m.id).join("|");
  useEffect(() => {
    syncMarkers(false);
    // Refit only when markers are added/removed, not on every rider GPS tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markerKey]);
  useEffect(() => {
    if (fitMarkers) syncMarkers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markerIds]);

  useEffect(() => {
    if (recenterKey === undefined || !mapRef.current) return;
    mapRef.current.setView([center.lat, center.lon], Math.max(mapRef.current.getZoom(), 16));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recenterKey]);

  return <div ref={el} className={`relative z-0 w-full h-full bg-slate-100 dark:bg-slate-800 ${className}`} />;
}
