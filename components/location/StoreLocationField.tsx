"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { LocationPicker } from "@/components/location/LocationPicker";
import { Coordinates } from "@/utils/locationUtils";

const MapView = dynamic(() => import("@/components/map/MapView").then((m) => m.MapView), { ssr: false });

interface Props {
  coords: Coordinates | null;
  onChange: (value: { address: string; coords: Coordinates }) => void;
}

/** Pin a store on the map. Riders navigate here and delivery fees are measured from it. */
export function StoreLocationField({ coords, onChange }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-black text-slate-700 dark:text-slate-300">Store location on the map</label>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 cursor-pointer"
      >
        {coords && (
          <div className="h-32 pointer-events-none">
            <MapView center={coords} zoom={16} interactive={false} markers={[{ id: "store", kind: "store", lat: coords.lat, lon: coords.lon }]} />
          </div>
        )}
        <div className="flex items-center gap-2 p-3 text-xs font-bold">
          <MapPin className="w-4 h-4 text-[#087F5B] shrink-0" />
          <span className={coords ? "text-slate-700 dark:text-slate-200" : "text-amber-700 dark:text-amber-400"}>
            {coords ? "Pinned. Tap to adjust." : "Pin your store so riders can find it and delivery fees are right"}
          </span>
        </div>
      </button>
      <LocationPicker
        open={open}
        onClose={() => setOpen(false)}
        initialCoords={coords}
        title="Store location"
        confirmLabel="Use this location"
        hideDetails
        onConfirm={(loc) => {
          onChange({ address: loc.address, coords: loc.coords });
          setOpen(false);
        }}
      />
    </div>
  );
}
