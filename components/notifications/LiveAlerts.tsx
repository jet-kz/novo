"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellRing, X } from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";
import { chime, installAudioUnlock, startRing, stopRing } from "@/utils/alertSound";
import type { OrderStatus } from "@/types";

type Toast = { id: string; title: string; body: string; url?: string; ringKey?: string; urgent?: boolean };

const CUSTOMER_STATUS_TEXT: Partial<Record<OrderStatus, string>> = {
  accepted: "The store accepted your order",
  confirmed: "The store accepted your order",
  preparing: "Your order is being prepared",
  ready_for_pickup: "Your order is packed and waiting for a rider",
  rider_assigned: "A rider is on the way to the store",
  picked_up: "Your rider has your order and is heading to you",
  delivered: "Your order was delivered. Enjoy!",
  cancelled: "Your order was cancelled",
};

/**
 * In-app alerts with sound, everywhere:
 *  - push messages forwarded by the service worker while Novo is open (orders, jobs, admin alerts)
 *  - customers' own order updates, picked up from the regular order refresh
 * New orders and new jobs ring until someone acts; everything else plays a short chime.
 */
export function LiveAlerts() {
  const pathname = usePathname() || "";
  const { orders, currentUser, refreshOrders } = usePlatform();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seenStatus = useRef<Map<string, OrderStatus> | null>(null);

  useEffect(() => {
    installAudioUnlock();
  }, []);

  const push = useCallback((t: Toast) => {
    setToasts((prev) => [t, ...prev.filter((x) => x.id !== t.id)].slice(0, 3));
    if (!t.urgent) setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 8000);
  }, []);

  const dismiss = (t: Toast) => {
    if (t.ringKey) stopRing(t.ringKey);
    setToasts((prev) => prev.filter((x) => x.id !== t.id));
  };

  // Messages from the service worker (a push arrived while a Novo tab is open).
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      const d = event.data;
      if (!d || d.type !== "novo-push") return;
      refreshOrders().catch(() => {});
      const id = d.tag || `${d.title}-${Date.now()}`;
      if (d.kind === "new_order") {
        // The merchant dashboard shows its own ringing banner for new orders.
        startRing(id);
        if (!pathname.startsWith("/merchant")) push({ id, title: d.title, body: d.body, url: d.url, ringKey: id, urgent: true });
        return;
      }
      if (d.kind === "job") {
        // The rider app opens the job offer and rings from there.
        startRing("new-job", 30_000);
        if (!pathname.startsWith("/rider")) push({ id, title: d.title, body: d.body, url: d.url, ringKey: "new-job", urgent: true });
        return;
      }
      // Customers' own order updates are announced by the order watcher below.
      const orderId = typeof d.tag === "string" && d.tag.startsWith("order-") ? d.tag.slice(6) : null;
      if (orderId && orders.some((o) => o.id === orderId && o.customerId === currentUser.id)) return;
      chime();
      push({ id, title: d.title, body: d.body, url: d.url });
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [pathname, push, refreshOrders, orders, currentUser.id]);

  // Customer: chime when one of my orders changes status (works even without push turned on).
  useEffect(() => {
    if (!currentUser.id) return;
    const mine = orders.filter((o) => o.customerId === currentUser.id);
    if (seenStatus.current === null) {
      seenStatus.current = new Map(mine.map((o) => [o.id, o.status]));
      return;
    }
    for (const o of mine) {
      const before = seenStatus.current.get(o.id);
      seenStatus.current.set(o.id, o.status);
      if (!before || before === o.status) continue;
      const text = CUSTOMER_STATUS_TEXT[o.status];
      if (!text) continue;
      chime();
      push({
        id: `order-${o.id}`,
        title: o.storeName || "Your order",
        body: o.status === "picked_up" && o.deliveryCode ? `${text}. Delivery code: ${o.deliveryCode}` : text,
        url: `/orders?orderId=${encodeURIComponent(o.id)}`,
      });
    }
  }, [orders, currentUser.id, push]);

  if (!toasts.length) return null;
  return (
    <div className="fixed z-[95] top-[max(0.75rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-md flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={`pointer-events-auto rounded-2xl shadow-2xl p-3.5 flex items-center gap-3 animate-in slide-in-from-top-4 ${
            t.urgent ? "bg-[#087F5B] text-white" : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          }`}
        >
          <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${t.urgent ? "bg-white/15" : "bg-emerald-50 dark:bg-emerald-950/50 text-[#087F5B]"}`}>
            <BellRing className={`w-5 h-5 ${t.urgent ? "animate-pulse" : ""}`} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{t.title}</p>
            <p className={`text-xs truncate ${t.urgent ? "text-white/80" : "text-slate-500 dark:text-slate-400"}`}>{t.body}</p>
          </div>
          {t.url && (
            <Link
              href={t.url}
              onClick={() => dismiss(t)}
              className={`h-8 px-3 rounded-full text-xs font-semibold flex items-center shrink-0 ${t.urgent ? "bg-white text-[#087F5B]" : "bg-[#087F5B] text-white"}`}
            >
              View
            </Link>
          )}
          <button onClick={() => dismiss(t)} aria-label="Dismiss" className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 opacity-70 hover:opacity-100 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
