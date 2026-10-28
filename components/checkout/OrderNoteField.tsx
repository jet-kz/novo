"use client";

import React from "react";
import type { useCheckout } from "@/components/checkout/useCheckout";

/** Optional note for the store and rider ("no cutlery", "call at the gate"). */
export function OrderNoteField({ checkout }: { checkout: ReturnType<typeof useCheckout> }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-black text-[#101714] dark:text-white uppercase tracking-wider">
        Note for the store <span className="normal-case font-medium text-slate-400 tracking-normal">(optional)</span>
      </span>
      <textarea
        value={checkout.orderNote}
        onChange={(e) => checkout.setOrderNote(e.target.value.slice(0, 500))}
        rows={2}
        placeholder="e.g. No cutlery, call me at the gate"
        className="w-full resize-none rounded-2xl bg-slate-100 dark:bg-slate-800 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#087F5B]/30 text-slate-900 dark:text-white placeholder:text-slate-400"
      />
    </label>
  );
}
