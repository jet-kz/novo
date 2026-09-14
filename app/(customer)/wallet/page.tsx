"use client";

import React, { Suspense } from "react";
import { MobileWalletView } from "@/components/mobile/wallet/MobileWalletView";
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus } from "lucide-react";

function DesktopWalletContent() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col gap-6">
      <h1 className="text-3xl font-black text-slate-900 dark:text-white">Wallet & Earnings</h1>
      <div className="p-8 rounded-3xl bg-[#008A4C] text-white flex justify-between items-center shadow-lg">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">Available Balance</span>
          <h2 className="text-4xl font-black">₦2,450</h2>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => alert("Top Up feature")} className="px-6 py-3 rounded-xl bg-white text-[#008A4C] font-black text-sm">Top Up</button>
          <button onClick={() => alert("Payout request submitted")} className="px-6 py-3 rounded-xl bg-emerald-900/50 text-white font-black text-sm border border-white/20">Withdraw</button>
        </div>
      </div>
    </div>
  );
}

export default function WalletPage() {
  return (
    <>
      <MobileWalletView />
      <div className="hidden md:block">
        <Suspense fallback={<div className="p-12 text-center">Loading Wallet...</div>}>
          <DesktopWalletContent />
        </Suspense>
      </div>
    </>
  );
}
