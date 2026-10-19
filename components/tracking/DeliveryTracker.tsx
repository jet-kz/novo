"use client";

import React, { useEffect, useState } from "react";
import { KeyRound, Phone, ShieldCheck } from "lucide-react";
import type { Order } from "@/types";
import { LiveOrderMap } from "@/components/map/LiveOrderMap";
import { freshness, useOrderRoute } from "@/components/tracking/useOrderRoute";

/**
  * Everything a customer needs while an order is on its way: live map with the rider's road
    * route, time to arrival, how fresh the rider's GPS is, the rider's contact and the
      * delivery code they hand over at the door.
        */
export function DeliveryTracker({ order, mapClassName = "h-60" }: { order: Order; mapClassName?: string }) {
  const route = useOrderRoute(order);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  if (order.status === "delivered" || order.status === "cancelled") return null;
  const onJob = order.status === "rider_assigned" || order.status === "picked_up";
  const seen = freshness(order.riderLocation?.updatedAt, now);

  let headline = "";
  if (order.status === "picked_up") headline = route.minutes ? `Arriving in about ${route.minutes} min` : "Your rider is on the way";
  else if (order.status === "rider_assigned") headline = route.minutes ? `Rider reaches the store in ~${route.minutes} min` : "Rider is heading to the store";

  return (
    <div className="flex flex-col gap-3">
      {onJob && headline && (
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="min-w-0">
            <p className="text-base font-bold text-slate-900 dark:text-white truncate">{headline}</p>
            {route.km != null && <p className="text-xs text-slate-500">{route.km} km away by road</p>}
          </div>
          {seen && (
            <span
              className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                seen.stale ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" : "bg-emerald-50 text-[#087F5B] dark:bg-emerald-950/50 dark:text-emerald-300"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${seen.stale ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`} />
              {seen.stale ? `Last seen ${seen.text}` : `Live · ${seen.text}`}
            </span>
          )}
        </div>
      )}
      <LiveOrderMap order={order} route={route.path} className={mapClassName} />

      {order.deliveryCode && (
        <div className="rounded-3xl bg-slate-900 dark:bg-slate-800 text-white p-4 flex items-center gap-4">
          <span className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5 text-emerald-300" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-300">Your delivery code</p>
            <p className="text-2xl font-extrabold tracking-[0.35em] font-mono leading-tight" aria-label={`Delivery code ${order.deliveryCode.split("").join(" ")}`}>
              {order.deliveryCode}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Give it to the rider only once your order is in your hands.</p>
          </div>
        </div>
      )}

      {order.riderName && onJob && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 p-3.5 flex items-center gap-3">
          <span className="w-11 h-11 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-[#087F5B] flex items-center justify-center font-bold shrink-0">
            {order.riderName.slice(0, 1).toUpperCase()}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{order.riderName}</p>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#087F5B]" /> Verified Novo rider
            </p>
          </div>
          {order.riderPhone && (
            <a
              href={`tel:${order.riderPhone}`}
              className="h-10 px-4 rounded-2xl bg-[#087F5B] text-white text-sm font-semibold flex items-center gap-1.5"
            >
              <Phone className="w-4 h-4" /> Call
            </a>
          )}
        </div>
      )}
    </div>
  );
}
