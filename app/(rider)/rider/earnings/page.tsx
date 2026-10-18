"use client";

import React from "react";
import { usePlatform } from "@/store/PlatformContext";
import { PayoutsPanel } from "@/components/payouts/PayoutsPanel";

export default function RiderEarningsPage() {
  const { riderProfile } = usePlatform();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex flex-col gap-6">
      <h1 className="text-2xl font-black text-white">Earnings &amp; payouts</h1>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Today", value: riderProfile.earningsToday },
          { label: "This week", value: riderProfile.earningsThisWeek },
          { label: "Tips today", value: riderProfile.tipsToday },
        ].map((s) => (
          <div key={s.label} className="p-4 bg-slate-900 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase">{s.label}</span>
            <p className="text-xl font-black text-white mt-1">₦{(s.value ?? 0).toLocaleString()}</p>
          </div>
        ))}
      </div>

      <PayoutsPanel tone="dark" />
    </div>
  );
}
