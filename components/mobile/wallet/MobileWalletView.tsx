"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wallet, ArrowUpRight, ArrowDownLeft, Plus, History } from "lucide-react";
import { apiService } from "@/services/api";

export function MobileWalletView() {
  const router = useRouter();
  const [balance, setBalance] = useState(2450);
  const [transactions, setTransactions] = useState([
    { id: "tx-1", title: "Order Payment", store: "Chicken Republic", date: "Today 10:24 AM", amount: -6000, type: "debit" },
    { id: "tx-2", title: "Top Up", store: "Bank Transfer", date: "Yesterday 4:12 PM", amount: +5000, type: "credit" },
    { id: "tx-3", title: "Order Refund", store: "Domino's Pizza", date: "2 days ago", amount: +3500, type: "credit" },
  ]);

  useEffect(() => {
    async function loadWallet() {
      try {
        const balRes = await apiService.getWalletBalance("NGN");
        if (balRes && typeof balRes.balance === "number") {
          setBalance(balRes.balance);
        }
        const txRes = await apiService.getWalletTransactions("NGN");
        if (Array.isArray(txRes) && txRes.length > 0) {
          setTransactions(txRes);
        }
      } catch (e) {
        console.warn("Wallet load warning:", e);
      }
    }
    loadWallet();
  }, []);

  return (
    <div className="md:hidden flex flex-col w-full min-h-screen bg-[#F7FAF8] dark:bg-slate-950 text-[#101714] dark:text-slate-100 pb-28">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-[#E3EAE6] dark:border-slate-800 px-4 py-3 flex items-center gap-3 shadow-xs">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-full bg-[#F7FAF8] dark:bg-slate-800 text-[#101714] dark:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-sm font-black text-[#101714] dark:text-white">Wallet & Payments</h1>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* 1. BALANCE CARD (Screen 14 reference) */}
        <div className="p-5 rounded-3xl bg-[#008A4C] text-white flex flex-col gap-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
              Available Balance
            </span>
            <Wallet className="w-5 h-5 text-emerald-200" />
          </div>

          <h2 className="text-3xl font-black text-white">₦{balance.toLocaleString()}</h2>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => alert("Top Up feature: Enter amount to credit wallet via Paystack/Flutterwave.")}
              className="flex-1 py-2.5 rounded-xl bg-white text-[#008A4C] font-black text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer hover:bg-emerald-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Top Up</span>
            </button>
            <button
              onClick={() => alert("Payout request submitted to your saved bank account.")}
              className="flex-1 py-2.5 rounded-xl bg-emerald-900/50 backdrop-blur-md border border-white/20 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer hover:bg-emerald-900/80 transition-colors"
            >
              <span>Withdraw</span>
            </button>
          </div>
        </div>

        {/* 2. RECENT TRANSACTIONS */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-[#66736D] tracking-wider">
              Recent Transactions
            </h3>
            <History className="w-4 h-4 text-slate-400" />
          </div>

          <div className="flex flex-col gap-2.5">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#E3EAE6] dark:border-slate-800 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      tx.type === "credit"
                        ? "bg-emerald-100 text-[#008A4C]"
                        : "bg-rose-100 text-rose-600"
                    }`}
                  >
                    {tx.type === "credit" ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h4 className="text-xs font-black text-[#101714] dark:text-white truncate">
                      {tx.title}
                    </h4>
                    <span className="text-[10px] text-[#66736D] font-semibold">{tx.date}</span>
                  </div>
                </div>

                <span
                  className={`text-xs font-black ${
                    tx.type === "credit" ? "text-[#008A4C]" : "text-rose-600"
                  }`}
                >
                  {tx.type === "credit" ? "+" : ""}₦{Math.abs(tx.amount).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
