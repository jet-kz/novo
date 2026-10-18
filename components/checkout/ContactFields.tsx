"use client";

import React from "react";
import Link from "next/link";
import { Phone } from "lucide-react";
import { useCheckout } from "@/components/checkout/useCheckout";

type Checkout = ReturnType<typeof useCheckout>;

const fieldClass =
  "w-full px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/40";

/** Name, phone (for the rider) and optional email (for the receipt). Shared by desktop and mobile checkout. */
export function ContactFields({ checkout }: { checkout: Checkout }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <Phone className="w-5 h-5 text-emerald-500" />
          <h3 className="font-black text-base">Your details</h3>
        </div>
        {!checkout.isAuthenticated && (
          <Link href="/auth?next=/checkout" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
            Have an account? Sign in
          </Link>
        )}
      </div>
      <input
        className={fieldClass}
        value={checkout.contactName}
        onChange={(e) => checkout.setContactName(e.target.value)}
        placeholder="Full name"
        autoComplete="name"
        aria-label="Full name"
      />
      <input
        className={fieldClass}
        value={checkout.contactPhone}
        onChange={(e) => checkout.setContactPhone(e.target.value)}
        placeholder="Phone number (the rider will call this)"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        aria-label="Phone number"
      />
      <input
        className={fieldClass}
        value={checkout.contactEmail}
        onChange={(e) => checkout.setContactEmail(e.target.value)}
        placeholder={checkout.paymentMethod === "card" ? "Email for your receipt" : "Email for your receipt (optional)"}
        type="email"
        inputMode="email"
        autoComplete="email"
        aria-label="Email for receipt"
        readOnly={checkout.isAuthenticated && !!checkout.contactEmail}
      />
      {!checkout.isAuthenticated && (
        <p className="text-[11px] text-slate-400">
          No account needed. We&apos;ll give you a link to track your order{checkout.contactEmail ? " and email you the receipt" : ""}.
        </p>
      )}
    </div>
  );
}
