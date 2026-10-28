"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BellRing, X } from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";
import { Order } from "@/types";
import { startRing, stopRing } from "@/utils/alertSound";

/**
  * While the merchant dashboard is open: chime, show a banner and badge the tab title when a new
    * order arrives (orders refresh every few seconds in the background).
      */
export function NewOrderAlert() {
  const { orders, merchantStore } = usePlatform();
  const seen = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<Order[]>([]);

  useEffect(() => {
    if (!merchantStore) return;
    const waiting = orders.filter((o) => o.storeId === merchantStore.id && o.status === "pending_merchant");
    if (seen.current === null) {
      seen.current = new Set(waiting.map((o) => o.id)); // first load: don't alert for old orders
      return;
    }
    const arrived = waiting.filter((o) => !seen.current!.has(o.id));
    arrived.forEach((o) => seen.current!.add(o.id));
    if (arrived.length) {
      setFresh((prev) => [...arrived, ...prev].slice(0, 3));
      // Rings (like a kitchen tablet) until someone taps View or dismisses it.
      arrived.forEach((o) => {
        const count = o.items.reduce((n, it) => n + (it.quantity || 0), 0);
        const first = (o.customerName || "").trim().split(" ")[0];
        const words = `New order! ₦${Math.round(o.total).toLocaleString()}, ${count} item${count === 1 ? "" : "s"}${first ? `, from ${first}` : ""}.`;
        startRing(`order-${o.id}`, 120_000, false, words);
      });
    }
    // Stop ringing for orders someone already handled (accepted here or on another device).
    const waitingIds = new Set(waiting.map((o) => o.id));
    setFresh((prev) => {
      const still = prev.filter((o) => waitingIds.has(o.id));
      prev.filter((o) => !waitingIds.has(o.id)).forEach((o) => stopRing(`order-${o.id}`));
      return still.length === prev.length ? prev : still;
    });
  }, [orders, merchantStore]);

  // Badge the browser tab while there are unseen orders.
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\) /, "");
    document.title = fresh.length ? `(${fresh.length}) ${base}` : base;
  }, [fresh.length]);

  if (!fresh.length) return null;
  return (
    <div role="alert" className="fixed z-[90] top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md flex flex-col gap-2">
      {fresh.map((o) => (
        <div key={o.id} className="rounded-2xl bg-[#087F5B] text-white shadow-2xl p-4 flex items-center gap-3 animate-in slide-in-from-top-4">
          <BellRing className="w-6 h-6 shrink-0 animate-pulse" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black">New order · ₦{Math.round(o.total).toLocaleString()}</p>
            <p className="text-xs text-white/80 truncate">
              {o.customerName} · {o.items.length} item{o.items.length === 1 ? "" : "s"}
            </p>
          </div>
          <Link
            href="/merchant/orders"
            onClick={() => {
              fresh.forEach((x) => stopRing(`order-${x.id}`));
              setFresh([]);
            }}
            className="px-3 py-2 rounded-xl bg-white text-[#087F5B] text-xs font-black shrink-0"
          >
            View
          </Link>
          <button
            onClick={() => {
              stopRing(`order-${o.id}`);
              setFresh((prev) => prev.filter((x) => x.id !== o.id));
            }}
            aria-label="Dismiss" className="p-1 text-white/70 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
