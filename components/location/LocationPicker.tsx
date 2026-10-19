"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft, Check, Loader2, LocateFixed, MapPin, Search, X } from "lucide-react";
import { Coordinates, PlaceResult, getCurrentPosition, reverseGeocodePlace, searchPlaces } from "@/utils/locationUtils";

const MapView = dynamic(() => import("@/components/map/MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-100 dark:bg-slate-800 animate-pulse" />,
});

export interface PickedLocation {
  address: string;
  title: string;
  subtitle: string;
  coords: Coordinates;
  /** House/flat number, landmark, directions. */
  details: string;
}

interface LocationPickerProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (location: PickedLocation) => void;
  initialCoords?: Coordinates | null;
  initialDetails?: string;
  title?: string;
  confirmLabel?: string;
  /** Hide the "house number / landmark" field (e.g. for a store's location). */
  hideDetails?: boolean;
}

const WARRI: Coordinates = { lat: 5.5544, lon: 5.7932 };

/** Full-screen map picker: search, use GPS, or drag the map under the pin. */
export function LocationPicker({
  open,
  onClose,
  onConfirm,
  initialCoords,
  initialDetails = "",
  title = "Delivery location",
  confirmLabel = "Deliver here",
  hideDetails = false,
}: LocationPickerProps) {
  const [center, setCenter] = useState<Coordinates>(initialCoords || WARRI);
  const [recenterKey, setRecenterKey] = useState(0);
  const [place, setPlace] = useState<PlaceResult | null>(null);
  const [resolving, setResolving] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState(initialDetails);
  const skipReverse = useRef(false);
  const reverseAbort = useRef<AbortController | null>(null);

  // Reset when opened.
  useEffect(() => {
    if (!open) return;
    const start = initialCoords || WARRI;
    setCenter(start);
    setRecenterKey((k) => k + 1);
    setDetails(initialDetails);
    setQuery("");
    setResults([]);
    setError(null);
    resolve(start);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const resolve = (c: Coordinates) => {
    reverseAbort.current?.abort();
    const ctrl = new AbortController();
    reverseAbort.current = ctrl;
    setResolving(true);
    reverseGeocodePlace(c.lat, c.lon, ctrl.signal)
      .then((p) => !ctrl.signal.aborted && setPlace(p))
      .catch(() => {})
      .finally(() => !ctrl.signal.aborted && setResolving(false));
  };

  // Debounced reverse geocode while the map is dragged.
  const moveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleCenterChange = (c: Coordinates) => {
    setCenter(c);
    if (skipReverse.current) {
      skipReverse.current = false;
      return;
    }
    if (moveTimer.current) clearTimeout(moveTimer.current);
    moveTimer.current = setTimeout(() => resolve(c), 450);
  };

  // Debounced search.
  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setSearching(true);
      searchPlaces(query, center, ctrl.signal)
        .then(setResults)
        .catch(() => {})
        .finally(() => !ctrl.signal.aborted && setSearching(false));
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const pick = (p: PlaceResult) => {
    skipReverse.current = true; // keep the searched name rather than re-geocoding
    setPlace(p);
    setCenter(p.coords);
    setRecenterKey((k) => k + 1);
    setQuery("");
    setResults([]);
  };

  const useMyLocation = async () => {
    setError(null);
    setLocating(true);
    try {
      const c = await getCurrentPosition();
      setCenter(c);
      setRecenterKey((k) => k + 1);
      resolve(c);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLocating(false);
    }
  };

  const confirm = () => {
    if (!place) return;
    onConfirm({ ...place, coords: center, details: details.trim() });
  };

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[80] flex flex-col bg-white dark:bg-slate-950 md:bg-slate-950/60 md:items-center md:justify-center md:p-6">
      <div className="flex flex-col w-full h-full md:max-w-2xl md:h-[85vh] md:rounded-3xl overflow-hidden bg-white dark:bg-slate-950">
        {/* Header + search */}
        <div className="relative z-20 bg-white dark:bg-slate-950 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] flex flex-col gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={onClose} aria-label="Close" className="p-2 -ml-2 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-black text-slate-900 dark:text-white">{title}</h2>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search street, estate or landmark"
              aria-label="Search for an address"
              autoComplete="off"
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            {searching ? (
              <Loader2 className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 animate-spin" />
            ) : query ? (
              <button onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2.5 top-2.5 p-1 text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>
          {results.length > 0 && (
            <ul className="absolute left-0 right-0 top-full bg-white dark:bg-slate-900 shadow-xl max-h-[50vh] overflow-y-auto ">
              {results.map((r, i) => (
                <li key={`${r.coords.lat},${r.coords.lon},${i}`}>
                  <button onClick={() => pick(r)} className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-900 dark:text-white truncate">{r.title}</span>
                      <span className="block text-xs text-slate-500 truncate">{r.subtitle}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Map with a fixed centre pin */}
        <div className="relative flex-1 min-h-0">
          <MapView center={center} zoom={17} onCenterChange={handleCenterChange} recenterKey={recenterKey} />
          <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center">
            <div className="-mt-10 flex flex-col items-center">
              <MapPin className="w-10 h-10 text-[#087F5B] drop-shadow-lg" fill="#087F5B" stroke="white" strokeWidth={1.5} />
              <span className="w-2 h-2 rounded-full bg-black/30 -mt-1" />
            </div>
          </div>
          <button
            onClick={useMyLocation}
            disabled={locating}
            className="absolute z-[500] right-3 bottom-3 px-3.5 py-2.5 rounded-full bg-white dark:bg-slate-900 shadow-lg text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4 text-[#087F5B]" />}
            Use my location
          </button>
        </div>

        {/* Confirm panel */}
        <div className="relative z-20 bg-white dark:bg-slate-950 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex flex-col gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-lg p-2.5">{error}</p>}
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-[#087F5B] mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              {resolving && !place ? (
                <p className="text-sm text-slate-500">Finding address…</p>
              ) : (
                <>
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{place?.title || "Move the map to your spot"}</p>
                  <p className="text-xs text-slate-500 truncate">{resolving ? "Updating…" : place?.subtitle}</p>
                </>
              )}
            </div>
          </div>
          {!hideDetails && (
            <input
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="House / flat number, landmark (helps the rider)"
              aria-label="House number or landmark"
              className="w-full px-3.5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          )}
          <button
            onClick={confirm}
            disabled={!place || resolving}
            className="w-full py-3.5 rounded-xl bg-[#087F5B] text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Check className="w-4 h-4" /> {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
