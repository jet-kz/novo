"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BellRing, X } from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";
import { Order } from "@/types";

/** Two-tone chime made in the browser (no audio file to load). */
function chime() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      const start = ctx.currentTime + i * 0.22;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.55);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch {}
}

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
      chime();
      if ("vibrate" in navigator) navigator.vibrate?.([200, 100, 200]);
    }
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
            onClick={() => setFresh([])}
            className="px-3 py-2 rounded-xl bg-white text-[#087F5B] text-xs font-black shrink-0"
          >
            View
          </Link>
          <button onClick={() => setFresh((prev) => prev.filter((x) => x.id !== o.id))} aria-label="Dismiss" className="p-1 text-white/70 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
