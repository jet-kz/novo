"use client";

import React, { useState, useEffect } from "react";
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
import { apiService } from "@/services/api";
import { getUniqueStoreBanner } from "@/utils/storeImageUtils";

export default function MerchantDashboardPage() {
  const { stores, activeStore, toggleStoreStatus, updateOrderStatus } = usePlatform();

  const [merchantData, setMerchantData] = useState<any>(null);
  const [currentStore, setCurrentStore] = useState<any>(null);
  const [realOrders, setRealOrders] = useState<any[]>([]);
  const [realProducts, setRealProducts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomersCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const [orderTab, setOrderTab] = useState<"all" | "new" | "preparing" | "ready" | "completed">("new");
  const [menuTab, setMenuTab] = useState<"all" | "available" | "out">("all");
  const [storeOpen, setStoreOpen] = useState(true);

  useEffect(() => {
    async function loadMerchantDashboard() {
      if (typeof window === "undefined") return;
      const token = localStorage.getItem("access_token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch current authenticated merchant & stores
        const merchRes = await apiService.getMerchantMe(token);
        if (merchRes) {
          setMerchantData(merchRes.merchant || merchRes);
          if (merchRes.stores && merchRes.stores.length > 0) {
            setCurrentStore(merchRes.stores[0]);
            setStoreOpen(merchRes.stores[0].is_open ?? true);
          }
        }

        // Selected store ID
        const targetStoreId = merchRes?.stores?.[0]?.id || (merchRes ? undefined : activeStore?.id || stores[0]?.id);

        // Fetch real analytics
        const stats = await apiService.getAnalytics(token);
        if (stats) {
          setAnalytics(stats);
        }

        // Fetch real orders
        if (targetStoreId) {
          const fetchedOrders = await apiService.getOrders(targetStoreId, token);
          if (Array.isArray(fetchedOrders)) {
            setRealOrders(fetchedOrders);
          }

          // Fetch real products
          const fetchedProducts = await apiService.getProducts(targetStoreId, token);
          if (Array.isArray(fetchedProducts)) {
            setRealProducts(fetchedProducts);
          }
        }
      } catch (err) {
        console.error("Failed to load merchant dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadMerchantDashboard();
  }, [activeStore]);

  // Sync store open status
  const handleToggleStore = async () => {
    const nextState = !storeOpen;
    setStoreOpen(nextState);
    if (currentStore?.id) {
      try {
        const token = localStorage.getItem("access_token");
        await apiService.toggleStoreOpenStatus(currentStore.id, token || undefined);
      } catch (e) {
        await toggleStoreStatus(currentStore.id);
      }
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem("access_token");
      await apiService.updateOrderStatus(orderId, "CONFIRMED", token || undefined);
      setRealOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "CONFIRMED" } : o))
      );
      updateOrderStatus(orderId, "preparing");
    } catch (e) {
      console.error("Failed to accept order:", e);
      updateOrderStatus(orderId, "preparing");
    }
  };

  const handleDeclineOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem("access_token");
      await apiService.updateOrderStatus(orderId, "CANCELLED", token || undefined);
      setRealOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "CANCELLED" } : o))
      );
      updateOrderStatus(orderId, "cancelled");
    } catch (e) {
      console.error("Failed to decline order:", e);
      updateOrderStatus(orderId, "cancelled");
    }
  };

  const filteredOrders = realOrders.filter((o) => {
    const st = (o.status || "").toLowerCase();
    if (orderTab === "new") return st === "pending" || st === "cart";
    if (orderTab === "preparing") return st === "confirmed" || st === "preparing";
    if (orderTab === "ready") return st === "ready";
    if (orderTab === "completed") return st === "delivered" || st === "completed";
    return true;
  });

  const filteredProducts = realProducts.filter((p) => {
    if (menuTab === "available") return p.in_stock !== false;
    if (menuTab === "out") return p.in_stock === false;
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

  const activeStoreName = savedProfileName || activeStore?.name || currentStore?.name || merchantData?.name || "My Store";
  const activeStoreCategory = savedProfileCategory || activeStore?.cuisineType || activeStore?.category || currentStore?.store_type || "Restaurant";
  const activeStoreAddress = savedProfileAddress || activeStore?.address || currentStore?.address || "Store Location";

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* 1. TOP SUMMARY METRICS (4 CARDS GRID) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Today's Orders */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
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
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
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
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
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
                {currentStore?.review_count || currentStore?.reviewCount ? `${currentStore.review_count || currentStore.reviewCount} reviews` : "New Store"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Active Customers */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-4">
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
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 overflow-x-auto">
              {(
                [
                  { id: "new", label: "New", count: realOrders.filter((o) => (o.status || "").toLowerCase() === "pending").length },
                  { id: "preparing", label: "Preparing", count: realOrders.filter((o) => ["confirmed", "preparing"].includes((o.status || "").toLowerCase())).length },
                  { id: "ready", label: "Ready", count: realOrders.filter((o) => (o.status || "").toLowerCase() === "ready").length },
                  { id: "completed", label: "Completed", count: realOrders.filter((o) => ["delivered", "completed"].includes((o.status || "").toLowerCase())).length },
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

            {/* ORDERS TABLE ROWS */}
            <div className="flex flex-col gap-2.5 mt-1">
              {filteredOrders.length === 0 ? (
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
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100/80 transition-all border border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            #{ord.id.slice(-6).toUpperCase()}
                          </span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              (ord.status || "").toLowerCase() === "pending" ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                          />
                          <span
                            className={`text-[11px] font-extrabold capitalize ${
                              (ord.status || "").toLowerCase() === "pending" ? "text-emerald-600" : "text-amber-600"
                            }`}
                          >
                            {ord.status || "Pending"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col ml-4">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {ord.customer_name || "Customer"}
                        </span>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                          ₦{(ord.total || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-[11px] font-semibold text-[#66736E] dark:text-slate-400 hidden sm:inline">
                        {ord.created_at ? new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                      </span>

                      {(ord.status || "").toLowerCase() === "pending" ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAcceptOrder(ord.id)}
                            className="px-4 py-1.5 rounded-xl bg-[#087F5B] text-white text-xs font-black hover:bg-[#065A43] transition-all shadow-sm cursor-pointer"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDeclineOrder(ord.id)}
                            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-extrabold hover:bg-slate-300 transition-all cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <span className="px-4 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-xs font-black">
                          {ord.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* MENU ITEMS CARD */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-4">
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
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              {(
                [
                  { id: "all", label: "All Items", count: realProducts.length },
                  { id: "available", label: "Available", count: realProducts.filter((p) => p.in_stock !== false).length },
                  { id: "out", label: "Out of Stock", count: realProducts.filter((p) => p.in_stock === false).length },
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
                    className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-800 flex flex-col group hover:shadow-md transition-all"
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
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span className={`text-[10px] font-extrabold flex items-center gap-1 ${p.in_stock !== false ? "text-emerald-600" : "text-rose-500"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${p.in_stock !== false ? "bg-emerald-500" : "bg-rose-500"}`} />
                          {p.in_stock !== false ? "Available" : "Out of Stock"}
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <div className="h-36 w-full rounded-2xl overflow-hidden relative border border-slate-200/60 dark:border-slate-800">
              <img
                src={currentStore?.banner || (activeStore ? getUniqueStoreBanner(activeStore) : getUniqueStoreBanner({ id: "store-merchant", name: activeStoreName }))}
                alt="Store Banner"
                className="w-full h-full object-cover"
              />
              <button
                onClick={handleToggleStore}
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-4">
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-500" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Tips for Growth</h3>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href="/merchant/menu"
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-slate-100 dark:border-slate-800"
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
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-slate-100 dark:border-slate-800"
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
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-slate-100 dark:border-slate-800"
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
