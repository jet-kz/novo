"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { ChevronRight, MapPin } from "lucide-react";
import { useCheckout } from "@/components/checkout/useCheckout";
import { LocationPicker } from "@/components/location/LocationPicker";

const MapView = dynamic(() => import("@/components/map/MapView").then((m) => m.MapView), { ssr: false });

type Checkout = ReturnType<typeof useCheckout>;

/** Delivery spot for checkout: a small map preview of the picked pin, tap to change it. */
export function DeliveryLocationField({ checkout }: { checkout: Checkout }) {
  const [open, setOpen] = useState(false);
  const coords = checkout.locationCoords;
  const picked = checkout.hasPickedLocation && coords;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
        <MapPin className="w-5 h-5 text-emerald-500" />
        <h3 className="font-black text-base">Delivery location</h3>
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 cursor-pointer group"
      >
        {picked && (
          <div className="h-28 pointer-events-none">
            <MapView center={coords} zoom={16} interactive={false} markers={[{ id: "home", kind: "home", lat: coords.lat, lon: coords.lon }]} />
          </div>
        )}
        <div className="flex items-center gap-3 p-3.5">
          <div className="min-w-0 flex-1">
            {picked ? (
              <>
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{checkout.locationTitle}</p>
                <p className="text-xs text-slate-500 truncate">{checkout.locationDetails || "Add house number or landmark"}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Set your delivery location</p>
                <p className="text-xs text-slate-500">Search or drop a pin so the rider finds you</p>
              </>
            )}
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 shrink-0">
            {picked ? "Change" : "Choose"} <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </button>

      <LocationPicker
        open={open}
        onClose={() => setOpen(false)}
        initialCoords={coords}
        initialDetails={checkout.locationDetails}
        onConfirm={(loc) => {
          checkout.setLocation(loc.address, loc.coords, loc.details);
          setOpen(false);
        }}
      />
    </div>
  );
}
