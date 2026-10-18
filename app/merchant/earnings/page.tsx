"use client";

import React from "react";
import { PayoutsPanel } from "@/components/payouts/PayoutsPanel";

export default function MerchantEarningsPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Earnings &amp; payouts</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          What your store has earned from delivered orders, what Novo has settled to you, and withdrawals to your bank.
        </p>
      </div>
      <PayoutsPanel />
    </div>
  );
}
