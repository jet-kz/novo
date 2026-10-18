"use client";

import React from "react";
import { usePlatform } from "@/store/PlatformContext";
import { useOrderQuote } from "@/components/checkout/useOrderQuote";

const naira = (n: number) => `₦${Math.round(n).toLocaleString()}`;

/** Cart pricing from the same server quote checkout uses, so the numbers always match. */
export function useCartPricing(enabled = true) {
  const { cartSubtotal } = usePlatform();
  const { quote, loading, error } = useOrderQuote({ enabled });
  return {
    subtotal: quote?.subtotal ?? cartSubtotal,
    deliveryFee: quote?.delivery_fee ?? null,
    serviceFee: quote?.service_fee ?? null,
    discount: quote?.discount ?? 0,
    /** Before the quote arrives this is just the items, labelled as such. */
    total: quote?.total ?? cartSubtotal,
    ready: !!quote,
    loading,
    error,
  };
}

type Pricing = ReturnType<typeof useCartPricing>;

export function CartTotals({ pricing, className = "" }: { pricing: Pricing; className?: string }) {
  const { hasPickedLocation } = usePlatform();
  const fee = (v: number | null) => (v == null ? (pricing.loading ? "…" : "—") : naira(v));
  return (
    <div className={`flex flex-col gap-1.5 text-xs text-slate-600 dark:text-slate-400 ${className}`} aria-live="polite">
      <Row label="Items" value={naira(pricing.subtotal)} />
      <Row label="Delivery fee" value={fee(pricing.deliveryFee)} />
      <Row label="Service fee" value={fee(pricing.serviceFee)} />
      {pricing.discount > 0 && <Row label="Discount" value={`−${naira(pricing.discount)}`} accent />}
      <div className="pt-2 mt-1 border-t border-slate-200 dark:border-slate-800 flex justify-between text-sm font-black text-slate-900 dark:text-white">
        <span>{pricing.ready ? "Total" : "Items total"}</span>
        <span className="text-[#087F5B] dark:text-emerald-400 text-base">{naira(pricing.total)}</span>
      </div>
      {!hasPickedLocation && pricing.ready && (
        <p className="text-[11px] text-slate-400">Delivery fee is estimated until you set your delivery location.</p>
      )}
      {pricing.error && !pricing.ready && <p className="text-[11px] text-amber-600">Fees will be shown at checkout.</p>}
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className={`font-bold ${accent ? "text-emerald-600" : "text-slate-900 dark:text-white"}`}>{value}</span>
    </div>
  );
}
