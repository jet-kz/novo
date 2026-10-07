"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Clock, ShoppingBag, ChevronRight, User, LogIn } from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";
import { MobileOrderTracker } from "@/components/mobile/tracking/MobileOrderTracker";
import { apiService } from "@/services/api";
import { Order } from "@/types";

export function MobileOrdersView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trackId = searchParams.get("track");
  const { isAuthenticated } = usePlatform();

  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all");
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check client token
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const isLogged = isAuthenticated || !!token;

  useEffect(() => {
    async function loadOrders() {
      if (!isLogged) {
        setUserOrders([]);
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const authToken = token || undefined;
        const res = await apiService.getOrders(undefined, authToken);
        if (Array.isArray(res)) {
          setUserOrders(res);
        } else {
          setUserOrders([]);
        }
      } catch (e) {
        console.warn("Error fetching customer orders:", e);
        setUserOrders([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrders();
  }, [isLogged, token]);

  // UNAUTHENTICATED / LOGGED OUT VIEW (FLAT HERO UI STYLE)
  if (!isLogged) {
    return (
      <div className="md:hidden flex flex-col items-center justify-center min-h-[80vh] px-6 py-12 text-center bg-[#F7FAF8] dark:bg-slate-950 font-sans">
        <div className="w-20 h-20 rounded-full bg-[#E8F7EF] dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800/60 flex items-center justify-center mb-6 text-[#008A4C] dark:text-emerald-400">
          <User className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-black text-[#101714] dark:text-white tracking-tight mb-2">
          Sign In to View Orders
        </h2>
        <p className="text-xs text-[#66736D] dark:text-slate-400 max-w-xs leading-relaxed mb-8 font-medium">
          Log in or create a Novo account to track active deliveries, view order status, and see your order history.
        </p>
        <button
          onClick={() => router.push("/auth")}
          className="w-full max-w-xs py-3.5 rounded-xl bg-[#008A4C] hover:bg-[#00703E] active:scale-95 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <span>Sign In / Register</span>
          <LogIn className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const trackedOrder = userOrders.find((o) => o.id === trackId);
  if (trackedOrder) {
    return <MobileOrderTracker order={trackedOrder} onBack={() => router.push("/orders")} />;
  }

  const filteredOrders = userOrders.filter((o) => {
    if (activeTab === "active") return o.status !== "delivered" && o.status !== "cancelled" && (o.status as string) !== "completed";
    if (activeTab === "completed") return o.status === "delivered" || (o.status as string) === "completed";
    return true;
  });

  return (
    <div className="md:hidden flex flex-col w-full min-h-screen bg-[#F7FAF8] dark:bg-slate-950 text-[#101714] dark:text-slate-100 pb-24">
      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-[#E3EAE6] dark:border-slate-800 px-4 py-3.5 flex items-center justify-between shadow-2xs">
        <h1 className="text-sm font-black text-[#101714] dark:text-white">My Orders</h1>
        <span className="text-[10px] font-bold text-[#66736D] dark:text-slate-400 bg-[#F7FAF8] dark:bg-slate-800 px-2.5 py-1 rounded-full border border-[#E3EAE6] dark:border-slate-700">
          {userOrders.length} {userOrders.length === 1 ? "Order" : "Orders"}
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 border-b border-[#E3EAE6] dark:border-slate-800">
        {(["all", "active", "completed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-xl text-xs font-black capitalize transition-all cursor-pointer ${
              activeTab === tab
                ? "bg-[#008A4C] text-white shadow-2xs"
                : "bg-[#F7FAF8] dark:bg-slate-800 text-[#66736D] dark:text-slate-400 border border-[#E3EAE6] dark:border-slate-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Orders List (Flat Borderless Hero UI Style) */}
      <div className="py-2 flex flex-col">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#66736D] font-bold">
            Loading your orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-[#66736D] dark:text-slate-400 text-xs font-medium flex flex-col items-center gap-2">
            <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-700" />
            <span className="font-bold text-sm text-[#101714] dark:text-white">No Orders Found</span>
            <p className="max-w-xs">You don&apos;t have any orders in this category yet.</p>
            <button
              onClick={() => router.push("/shop")}
              className="mt-2 px-4 py-2 rounded-xl bg-[#008A4C] text-white text-xs font-bold"
            >
              Explore Stores
            </button>
          </div>
        ) : (
          <div className="flex flex-col bg-white dark:bg-slate-900 border-y border-[#E3EAE6]/80 dark:border-slate-800/80">
            {filteredOrders.map((ord, idx) => {
              const isLast = idx === filteredOrders.length - 1;
              return (
                <div
                  key={ord.id}
                  onClick={() => router.push(`/orders?track=${ord.id}`)}
                  className={`flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[#F7FAF8] dark:hover:bg-slate-800/50 transition-colors ${
                    !isLast ? "border-b border-[#E3EAE6]/70 dark:border-slate-800/70" : ""
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#E8F7EF] dark:bg-slate-800 text-[#008A4C] flex items-center justify-center font-black text-sm shrink-0">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <h4 className="text-xs font-black text-[#101714] dark:text-white truncate">
                        {ord.storeName || "Novo Merchant"}
                      </h4>
                      <span className="text-[10px] text-[#66736D] dark:text-slate-400 font-semibold">#{ord.id}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-black text-[#008A4C]">
                          ₦{ord.total.toLocaleString()}
                        </span>
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full capitalize ${
                            ord.status === "delivered" || (ord.status as string) === "completed"
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-[#008A4C]"
                              : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400"
                          }`}
                        >
                          {ord.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
