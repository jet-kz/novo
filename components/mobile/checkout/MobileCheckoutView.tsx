"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Banknote,
  CheckCircle2,
  ShieldCheck,
  Building,
} from "lucide-react";
import type { useCheckout, PaymentMethod } from "@/components/checkout/useCheckout";
import { ContactFields } from "@/components/checkout/ContactFields";
import { DeliveryLocationField } from "@/components/checkout/DeliveryLocationField";

const naira = (n: number) => `₦${Math.round(n).toLocaleString()}`;

export function MobileCheckoutView({ checkout }: { checkout: ReturnType<typeof useCheckout> }) {
  const router = useRouter();
  const { cart, summary, isQuote } = checkout;
  const isSubmitting = checkout.isSubmitting;

  return (
    <div className="md:hidden flex flex-col w-full min-h-screen bg-[#F7FAF8] dark:bg-slate-950 text-[#101714] dark:text-slate-100 pb-44">
      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-[#E3EAE6] dark:border-slate-800 px-4 py-3 flex items-center gap-3 shadow-xs">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-full bg-[#F7FAF8] dark:bg-slate-800 text-[#101714] dark:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-sm font-black text-[#101714] dark:text-white">Checkout</h1>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* 1. CONTACT */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 shadow-xs">
          <ContactFields checkout={checkout} />
        </div>

        {/* 2. DELIVERY LOCATION */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 shadow-xs">
          <DeliveryLocationField checkout={checkout} />
        </div>

        {/* 3. PAYMENT METHOD SECTION */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 flex flex-col gap-2.5 shadow-xs">
          <span className="text-xs font-black text-[#101714] dark:text-white uppercase tracking-wider">
            Payment Method
          </span>

          <div className="flex flex-col gap-2">
            {[
              { id: "card", label: "Pay online now", icon: CreditCard },
              { id: "cash", label: "Cash on Delivery", icon: Banknote },
              { id: "transfer", label: "Transfer on Delivery", icon: Building },
            ].map((pm) => {
              const Icon = pm.icon;
              const isSelected = checkout.paymentMethod === pm.id;
              return (
                <label
                  key={pm.id}
                  onClick={() => checkout.setPaymentMethod(pm.id as PaymentMethod)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#E8F7EF] border-[#008A4C] text-[#008A4C] dark:bg-slate-800"
                      : "bg-[#F7FAF8] dark:bg-slate-800/40 border-[#E3EAE6] text-[#101714] dark:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-bold">{pm.label}</span>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-[#008A4C]" />}
                </label>
              );
            })}
          </div>
        </div>

        {/* 4. ORDER SUMMARY */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 flex flex-col gap-2.5 shadow-xs text-xs font-semibold">
          <span className="text-xs font-black text-[#101714] dark:text-white uppercase tracking-wider">
            Order Summary
          </span>

          <div className="flex items-center justify-between text-[#66736D]">
            <span>Items ({cart.length})</span>
            <span className="font-bold text-[#101714] dark:text-white">{naira(summary.subtotal)}</span>
          </div>

          <div className="flex items-center justify-between text-[#66736D]">
            <span>Delivery Fee</span>
            <span className="font-bold text-[#101714] dark:text-white">{naira(summary.delivery_fee)}</span>
          </div>

          {isQuote && (
            <div className="flex items-center justify-between text-[#66736D]">
              <span>Service Fee</span>
              <span className="font-bold text-[#101714] dark:text-white">{naira(summary.service_fee)}</span>
            </div>
          )}

          {summary.discount > 0 && (
            <div className="flex items-center justify-between text-[#008A4C]">
              <span>Promo Discount</span>
              <span className="font-bold">-{naira(summary.discount)}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-[#E3EAE6] dark:border-slate-800 text-sm font-black text-[#101714] dark:text-white">
            <span>{isQuote ? "Total" : "Estimated total"}</span>
            <span className="text-[#008A4C]">{checkout.quoteLoading ? "Calculating…" : naira(summary.total)}</span>
          </div>
        </div>

        {checkout.notice && (
          <p className="text-[11px] font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/40 rounded-xl p-3">{checkout.notice}</p>
        )}
        {checkout.error && (
          <p role="alert" className="text-[11px] font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-xl p-3">
            {checkout.error}
          </p>
        )}
      </div>

      {/* Sticky Place Order CTA */}
      <div className="fixed bottom-14 left-0 right-0 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-[#E3EAE6] dark:border-slate-800 z-30">
        <button
          onClick={checkout.submit}
          disabled={isSubmitting || checkout.quoteLoading || cart.length === 0}
          className="w-full py-3.5 rounded-2xl bg-[#008A4C] hover:bg-[#006B3C] disabled:opacity-50 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-colors"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>
            {isSubmitting
              ? checkout.paymentMethod === "card" ? "Opening payment..." : "Placing order..."
              : `${checkout.paymentMethod === "card" ? "Continue to payment" : "Place order"} • ${naira(summary.total)}`}
          </span>
        </button>
      </div>

    </div>
  );
}
