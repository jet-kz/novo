"use client";

import React from "react";
import { usePlatform } from "@/store/PlatformContext";
import { PayoutsPanel } from "@/components/payouts/PayoutsPanel";

export default function RiderEarningsPage() {
  const { riderProfile } = usePlatform();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 w-full flex flex-col gap-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Earnings</h1>
        <p className="text-sm text-slate-500 mt-1">What you&apos;ve earned, what Novo has paid you, and withdrawals to your bank.</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {[
          { label: "Today", value: riderProfile.earningsToday },
          { label: "This week", value: riderProfile.earningsThisWeek },
          { label: "Tips today", value: riderProfile.tipsToday },
        ].map((s) => (
          <div key={s.label} className="min-w-0">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="text-xl sm:text-3xl font-bold tracking-tight mt-1 truncate">₦{(s.value ?? 0).toLocaleString()}</p>
          </div>
        ))}
      </div>

      <PayoutsPanel />
    </div>
  );
}
