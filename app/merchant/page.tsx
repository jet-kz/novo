"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Wallet,
  Star,
  Users,
  TrendingUp,
  Pencil,
  Plus,
  ChevronRight,
  Clock,
  MapPin,
  Lightbulb,
} from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";
import { getUniqueStoreBanner } from "@/utils/storeImageUtils";
import { isDone, isInKitchen, isNewOrder, isOnTheWay, isReady, statusLabel } from "@/utils/orderStatus";
import type { OrderStatus } from "@/types";

export default function MerchantDashboardPage() {
  const {
    activeStore,
    merchantStore,
    merchantStoreLoading,
    toggleStoreStatus,
    updateOrderStatus,
    orders,
    ordersError,
    products,
    analytics,
  } = usePlatform();

  const currentStore: any = merchantStore;
  const isLoading = merchantStoreLoading && !merchantStore;
  const realOrders = merchantStore ? orders.filter((o) => o.storeId === merchantStore.id) : [];
  const realProducts = merchantStore ? products.filter((p) => p.storeId === merchantStore.id) : [];
  const storeOpen = merchantStore?.isOpening ?? true;

  const [orderTab, setOrderTab] = useState<"all" | "new" | "preparing" | "ready" | "completed">("new");
  const [menuTab, setMenuTab] = useState<"all" | "available" | "out">("all");
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const run = async (id: string, fn: () => Promise<unknown>) => {
    setBusyOrderId(id);
    setActionError(null);
    try {
      await fn();
    } catch (e: any) {
      setActionError(e?.message || "That action failed. Please try again.");
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleToggleStore = () => {
    if (merchantStore) run("store", () => toggleStoreStatus(merchantStore.id));
  };

  const handleAcceptOrder = (orderId: string) => run(orderId, () => updateOrderStatus(orderId, "preparing"));
  const handleDeclineOrder = (orderId: string) => {
    if (!window.confirm("Reject this order? The customer will be notified.")) return;
    run(orderId, () => updateOrderStatus(orderId, "cancelled", { reason: "Rejected by store" }));
  };

  const inTab = (status: OrderStatus, tab: typeof orderTab) => {
    if (tab === "new") return isNewOrder(status);
    if (tab === "preparing") return isInKitchen(status);
    if (tab === "ready") return isReady(status) || isOnTheWay(status);
    if (tab === "completed") return isDone(status);
    return true;
  };
  const filteredOrders = realOrders.filter((o) => inTab(o.status, orderTab));

  const filteredProducts = realProducts.filter((p) => {
    if (menuTab === "available") return p.inStock !== false;
    if (menuTab === "out") return p.inStock === false;
    return true;
  });

  let savedProfileName = "";
  let savedProfileAddress = "";
  let savedProfileCategory = "";
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("merchant_profile");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.businessName) savedProfileName = parsed.businessName;
        if (parsed.address) savedProfileAddress = parsed.address;
        if (parsed.businessType) savedProfileCategory = parsed.businessType;
      }
    } catch (e) {}
  }

  const activeStoreName = savedProfileName || activeStore?.name || currentStore?.name || "My Store";
  const activeStoreCategory = savedProfileCategory || activeStore?.cuisineType || activeStore?.category || currentStore?.cuisineType || "Restaurant";
  const activeStoreAddress = savedProfileAddress || activeStore?.address || currentStore?.address || "Store Location";

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* 1. TOP SUMMARY METRICS (4 CARDS GRID) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Today's Orders */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#087F5B] flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6 text-[#087F5B]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[#66736E] dark:text-slate-400">Today's Orders</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {analytics.totalOrders || realOrders.length || 0}
              </span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                ↑ 0% <span className="text-slate-400 font-medium ml-1">vs yesterday</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Today's Earnings */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6 text-sky-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[#66736E] dark:text-slate-400">Today's Earnings</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                ₦{(analytics.totalRevenue || 0).toLocaleString()}
              </span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                ↑ 0% <span className="text-slate-400 font-medium ml-1">vs yesterday</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Reviews */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shrink-0">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[#66736E] dark:text-slate-400">Total Reviews</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {currentStore?.rating && currentStore.rating > 0 ? `${Number(currentStore.rating).toFixed(1)}/5` : "0.0/5"}
              </span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                {currentStore?.reviewCount ? `${currentStore.reviewCount} reviews` : "New Store"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Active Customers */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[#66736E] dark:text-slate-400">Active Customers</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {analytics.totalCustomersCount || 0}
              </span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                ↑ 0% <span className="text-slate-400 font-medium ml-1">vs last week</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT TWO-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (WIDE - 8/12) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* RECENT ORDERS CARD */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Recent Orders</h3>
              <Link
                href="/merchant/orders"
                className="text-xs font-extrabold text-[#087F5B] hover:text-[#065A43] transition-colors"
              >
                View All
              </Link>
            </div>

            {/* STATUS TABS */}
            <div className="flex items-center gap-2 border-slate-100 dark:border-slate-800 pb-3 overflow-x-auto">
              {(
                [
                  { id: "new", label: "New", count: realOrders.filter((o) => inTab(o.status, "new")).length },
                  { id: "preparing", label: "Preparing", count: realOrders.filter((o) => inTab(o.status, "preparing")).length },
                  { id: "ready", label: "Ready", count: realOrders.filter((o) => inTab(o.status, "ready")).length },
                  { id: "completed", label: "Completed", count: realOrders.filter((o) => inTab(o.status, "completed")).length },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setOrderTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                    orderTab === tab.id
                      ? "text-[#087F5B] border-b-2 border-[#087F5B] font-black"
                      : "text-[#66736E] dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {(actionError || ordersError) && (
              <p role="alert" className="text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-xl p-3">
                {actionError || ordersError}
              </p>
            )}

            {/* ORDERS TABLE ROWS */}
            <div className="flex flex-col gap-2.5 mt-1">
              {isLoading ? (
                <div className="py-12 text-center text-xs font-bold text-slate-500">Loading your store…</div>
              ) : !merchantStore ? (
                <div className="py-12 text-center text-xs font-bold text-slate-500">
                  No store is linked to this account yet. Complete merchant registration to start receiving orders.
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                  <ShoppingBag className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    No {orderTab} orders right now.
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Your store is online and active. New incoming orders will appear here in real-time.
                  </span>
                </div>
              ) : (
                filteredOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100/80 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            #{ord.id.slice(-6).toUpperCase()}
                          </span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isNewOrder(ord.status) ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                          />
                          <span
                            className={`text-[11px] font-extrabold capitalize ${
                              isNewOrder(ord.status) ? "text-emerald-600" : "text-amber-600"
                            }`}
                          >
                            {statusLabel(ord.status)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col ml-4">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {ord.customerName || "Customer"}
                        </span>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                          ₦{(ord.total || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-[11px] font-semibold text-[#66736E] dark:text-slate-400 hidden sm:inline">
                        {ord.createdAt ? new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                      </span>

                      {isNewOrder(ord.status) ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAcceptOrder(ord.id)}
                            disabled={busyOrderId === ord.id}
                            className="disabled:opacity-50 px-4 py-1.5 rounded-xl bg-[#087F5B] text-white text-xs font-black hover:bg-[#065A43] transition-all shadow-sm cursor-pointer"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDeclineOrder(ord.id)}
                            disabled={busyOrderId === ord.id}
                            className="disabled:opacity-50 px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-extrabold hover:bg-slate-300 transition-all cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <span className="px-4 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-xs font-black">
                          {statusLabel(ord.status)}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* MENU ITEMS CARD */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="text-base font-black text-slate-900 dark:text-white">Menu Items</h3>
                <Link
                  href="/merchant/menu"
                  className="text-xs font-extrabold text-[#087F5B] hover:text-[#065A43] transition-colors"
                >
                  View All
                </Link>
              </div>

              <Link
                href="/merchant/menu?action=add"
                className="px-4 py-2 rounded-xl bg-[#087F5B] text-white text-xs font-black hover:bg-[#065A43] transition-all shadow-md shadow-[#087F5B]/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </Link>
            </div>

            {/* MENU TABS */}
            <div className="flex items-center gap-2 border-slate-100 dark:border-slate-800 pb-3">
              {(
                [
                  { id: "all", label: "All Items", count: realProducts.length },
                  { id: "available", label: "Available", count: realProducts.filter((p) => p.inStock !== false).length },
                  { id: "out", label: "Out of Stock", count: realProducts.filter((p) => p.inStock === false).length },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setMenuTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    menuTab === tab.id
                      ? "text-[#087F5B] border-b-2 border-[#087F5B] font-black"
                      : "text-[#66736E] dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* PRODUCTS 4-CARD GRID */}
            {filteredProducts.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#087F5B] flex items-center justify-center">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No menu items added yet.
                </span>
                <Link
                  href="/merchant/menu?action=add"
                  className="px-4 py-2 rounded-xl bg-[#087F5B] text-white text-xs font-black hover:bg-[#065A43] transition-all"
                >
                  Create Your First Menu Item
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-1">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl overflow-hidden flex flex-col group hover:shadow-md transition-all"
                  >
                    <div className="h-32 w-full overflow-hidden relative">
                      <img
                        src={p.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80"}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-3 flex flex-col gap-1">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">{p.name}</h4>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                        ₦{(p.price || 0).toLocaleString()}
                      </span>
                      <div className="flex items-center justify-between mt-2 pt-2 border-slate-200/60 dark:border-slate-700/60">
                        <span className={`text-[10px] font-extrabold flex items-center gap-1 ${p.inStock !== false ? "text-emerald-600" : "text-rose-500"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${p.inStock !== false ? "bg-emerald-500" : "bg-rose-500"}`} />
                          {p.inStock !== false ? "Available" : "Out of Stock"}
                        </span>
                        <Link href="/merchant/menu" className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (NARROW - 4/12) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* STORE OVERVIEW WIDGET (MATCHING MOCKUP) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
            <div className="h-36 w-full rounded-2xl overflow-hidden relative">
              <img
                src={currentStore?.banner || (activeStore ? getUniqueStoreBanner(activeStore) : getUniqueStoreBanner({ id: "store-merchant", name: activeStoreName }))}
                alt="Store Banner"
                className="w-full h-full object-cover"
              />
              <button
                onClick={handleToggleStore}
                disabled={busyOrderId === "store"}
                className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-black shadow-md cursor-pointer transition-all ${
                  storeOpen ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                }`}
              >
                {storeOpen ? "Open" : "Closed"}
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {activeStoreName}
                </h3>
                <Link href="/merchant/profile" className="text-slate-400 hover:text-slate-600">
                  <Pencil className="w-4 h-4" />
                </Link>
              </div>

              <span className="text-xs font-medium text-[#66736E] dark:text-slate-400 capitalize">
                {activeStoreCategory}
              </span>

              <div className="flex flex-col gap-1.5 mt-2 text-xs font-medium text-[#66736E] dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#087F5B]" />
                  <span>{activeStoreAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#087F5B]" />
                  <span>Mon – Sun: 8AM – 10PM</span>
                </div>
              </div>

              <Link
                href="/merchant/profile"
                className="w-full mt-4 py-3 rounded-2xl bg-[#087F5B] text-white text-xs font-black hover:bg-[#065A43] transition-all shadow-md shadow-[#087F5B]/20 text-center cursor-pointer"
              >
                Edit Store
              </Link>
            </div>
          </div>

          {/* QUICK STATS WIDGET */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#087F5B]" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Quick Stats</h3>
              </div>
              <select className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl outline-none text-slate-700 dark:text-slate-300">
                <option>Today</option>
                <option>This Week</option>
                <option>This Month</option>
              </select>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#087F5B] flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#66736E] font-semibold">Total Orders</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {analytics.totalOrders || realOrders.length || 0}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-emerald-600">↑ 0%</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#087F5B] flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#66736E] font-semibold">Total Earnings</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      ₦{(analytics.totalRevenue || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-emerald-600">↑ 0%</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#087F5B] flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#66736E] font-semibold">Average Order Value</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      ₦{analytics.totalOrders ? Math.round(analytics.totalRevenue / analytics.totalOrders).toLocaleString() : 0}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-emerald-600">↑ 0%</span>
              </div>
            </div>
          </div>

          {/* TIPS FOR GROWTH WIDGET */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-500" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Tips for Growth</h3>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href="/merchant/menu"
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#087F5B] flex items-center justify-center">
                    <Pencil className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-900 dark:text-white">Add new menu items</span>
                    <span className="text-[10px] text-[#66736E] font-medium">Keep your menu fresh and exciting</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/merchant/menu?action=add"
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#087F5B] flex items-center justify-center">
                    <Star className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-900 dark:text-white">Use promotions</span>
                    <span className="text-[10px] text-[#66736E] font-medium">Attract more customers</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/merchant/profile"
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#087F5B] flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-900 dark:text-white">Respond to reviews</span>
                    <span className="text-[10px] text-[#66736E] font-medium">Build trust and grow faster</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
