"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, Banknote, Building, Plus, CheckCircle2, ShieldCheck } from "lucide-react";

export default function CustomerPaymentsPage() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState("card");

  return (
    <div className="w-full min-h-screen bg-[#F7FAF8] dark:bg-slate-950 text-[#101714] dark:text-slate-100 pb-24 font-sans">
      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-[#E3EAE6] dark:border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-full bg-[#F7FAF8] dark:bg-slate-800 text-[#101714] dark:text-white cursor-pointer hover:bg-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-black text-[#101714] dark:text-white">Payment Methods</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-black text-slate-900 dark:text-white">Saved Payment Channels</h2>
          <p className="text-xs text-[#66736D] dark:text-slate-400">Choose your default checkout payment method.</p>
        </div>

        {/* FLAT BORDERLESS HERO UI LIST */}
        <div className="flex flex-col bg-white dark:bg-slate-900 border-b border-[#E3EAE6] dark:border-slate-800">
          {[
            { id: "card", title: "Credit / Debit Card", desc: "Paystack Instant Checkout (Visa, Mastercard, Verve)", icon: CreditCard },
            { id: "cash", title: "Pay on Delivery", desc: "Cash or POS upon order arrival", icon: Banknote },
            { id: "transfer", title: "Bank Transfer", desc: "Direct Bank Transfer & USSD payment", icon: Building },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = selectedMethod === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedMethod(item.id)}
                className="py-4 px-3 flex items-center justify-between border-b border-[#E3EAE6]/70 dark:border-slate-800/70 last:border-b-0 cursor-pointer hover:bg-[#F7FAF8] dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-[#E8F7EF] dark:bg-slate-800 text-[#008A4C] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-black text-[#101714] dark:text-white">{item.title}</span>
                    <span className="text-xs text-[#66736D] dark:text-slate-400 font-medium">{item.desc}</span>
                  </div>
                </div>

                {isSelected ? (
                  <CheckCircle2 className="w-5 h-5 text-[#008A4C]" />
                ) : (
                  <span className="text-[11px] font-bold text-slate-400">Select</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 rounded-2xl bg-[#E8F7EF] dark:bg-slate-900 border border-[#008A4C]/20 flex items-center gap-3 text-xs font-bold text-[#008A4C]">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <span>All payment transactions are encrypted using 256-bit SSL Paystack infrastructure.</span>
        </div>
      </div>
    </div>
  );
}
