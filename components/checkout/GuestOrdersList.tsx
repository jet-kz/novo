"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";
import { GuestOrderRef, guestTrackingPath, listGuestOrders } from "@/utils/guestOrders";

/** Orders placed without an account on this device, plus a nudge to sign in. */
export function GuestOrdersList() {
  const [orders, setOrders] = useState<GuestOrderRef[] | null>(null);
  useEffect(() => setOrders(listGuestOrders()), []);

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 md:py-12 flex flex-col gap-4">
      <h1 className="text-2xl font-black text-slate-900 dark:text-white">Your orders</h1>

      {orders && orders.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={guestTrackingPath(o.id, o.token)}
                className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{o.storeName || "Order"}</p>
                  <p className="text-xs text-slate-500">
                    {o.id}
                    {o.total ? ` · ₦${Math.round(o.total).toLocaleString()}` : ""}
                    {o.createdAt ? ` · ${new Date(o.createdAt).toLocaleDateString()}` : ""}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 text-center">
          <Clock className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm text-slate-500 mt-2">No orders on this device yet.</p>
          <Link href="/shop" className="inline-block mt-4 text-sm font-bold text-[#087F5B]">Start ordering</Link>
        </div>
      )}

      <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 p-4 text-sm text-emerald-900 dark:text-emerald-200">
        Ordered with an account?{" "}
        <Link href="/auth?next=/orders" className="font-bold underline">Sign in</Link> to see all your orders.
      </div>
    </div>
  );
}
