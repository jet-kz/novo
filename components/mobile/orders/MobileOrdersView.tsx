"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Clock, ShoppingBag, ChevronRight, CheckCircle2 } from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";
import { MobileOrderTracker } from "@/components/mobile/tracking/MobileOrderTracker";
import { Order } from "@/types";

export function MobileOrdersView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trackId = searchParams.get("track");
  const { orders } = usePlatform();

  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all");

  const trackedOrder = orders.find((o) => o.id === trackId);
  if (trackedOrder) {
    return <MobileOrderTracker order={trackedOrder} onBack={() => router.push("/orders")} />;
  }

  const filteredOrders = orders.filter((o) => {
    if (activeTab === "active") return o.status !== "delivered" && o.status !== "cancelled";
    if (activeTab === "completed") return o.status === "delivered";
    return true;
  });

  return (
    <div className="md:hidden flex flex-col w-full min-h-screen bg-[#F7FAF8] dark:bg-slate-950 text-[#101714] dark:text-slate-100 pb-24">
      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-[#E3EAE6] dark:border-slate-800 px-4 py-3 flex items-center justify-between shadow-xs">
        <h1 className="text-sm font-black text-[#101714] dark:text-white">My Orders</h1>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 border-b border-[#E3EAE6]">
        {(["all", "active", "completed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-xl text-xs font-black capitalize transition-all cursor-pointer ${
              activeTab === tab
                ? "bg-[#008A4C] text-white shadow-xs"
                : "bg-[#F7FAF8] text-[#66736D] dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="p-4 flex flex-col gap-3">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-[#E3EAE6] text-[#66736D] text-xs font-medium flex flex-col items-center gap-2">
            <ShoppingBag className="w-10 h-10 text-slate-400" />
            <span className="font-bold text-sm text-[#101714]">No Orders Found</span>
            <p className="max-w-xs">You don&apos;t have any orders in this category yet.</p>
          </div>
        ) : (
          filteredOrders.map((ord) => (
            <div
              key={ord.id}
              onClick={() => router.push(`/orders?track=${ord.id}`)}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#E3EAE6] dark:border-slate-800 shadow-xs cursor-pointer hover:border-[#008A4C] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#E8F7EF] text-[#008A4C] flex items-center justify-center font-black text-sm shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <h4 className="text-xs font-black text-[#101714] dark:text-white truncate">
                    {ord.storeName || "Novo Merchant"}
                  </h4>
                  <span className="text-[10px] text-[#66736D] font-medium">#{ord.id}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-black text-[#008A4C]">
                      ₦{ord.total.toLocaleString()}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        ord.status === "delivered"
                          ? "bg-emerald-100 text-[#008A4C]"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {ord.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
