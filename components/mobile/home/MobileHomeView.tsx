"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Search,
  ChevronDown,
  Utensils,
  ShoppingBag,
  Pill,
  Wine,
  Sparkles,
  Smartphone,
  Grid,
  Star,
  Clock,
  Bike,
  ShieldCheck,
  ArrowRight,
  Plus,
} from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";
import { Store, Product } from "@/types";

export function MobileHomeView() {
  const router = useRouter();
  const { stores, products, currentUser, addToCart } = usePlatform();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = [
    { label: "Food", icon: Utensils, bg: "bg-emerald-50 dark:bg-emerald-950/60 text-[#008A4C]", categoryKey: "restaurant" },
    { label: "Groceries", icon: ShoppingBag, bg: "bg-amber-50 dark:bg-amber-950/60 text-amber-600", categoryKey: "supermarket" },
    { label: "Pharmacy", icon: Pill, bg: "bg-rose-50 dark:bg-rose-950/60 text-rose-600", categoryKey: "pharmacy" },
    { label: "Drinks", icon: Wine, bg: "bg-purple-50 dark:bg-purple-950/60 text-purple-600", categoryKey: "drinks" },
    { label: "Beauty", icon: Sparkles, bg: "bg-pink-50 dark:bg-pink-950/60 text-pink-600", categoryKey: "beauty" },
    { label: "Electronics", icon: Smartphone, bg: "bg-blue-50 dark:bg-blue-950/60 text-blue-600", categoryKey: "electronics" },
    { label: "More", icon: Grid, bg: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300", categoryKey: "all" },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const featuredStores = stores.slice(0, 5);

  return (
    <div className="md:hidden flex flex-col w-full min-h-screen bg-[#F7FAF8] dark:bg-slate-950 text-[#101714] dark:text-slate-100 pb-24">
      {/* 1. TOP MOBILE HEADER (Screen 4 reference: Location & Search) */}
      <div className="sticky top-0 z-40 bg-[#008A4C] text-white px-4 pt-3 pb-4 shadow-md rounded-b-3xl">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
              <MapPin className="w-4 h-4 text-emerald-200" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-emerald-100/90 uppercase tracking-wider">
                Delivering to
              </span>
              <div className="flex items-center gap-1 text-xs font-black text-white">
                <span className="truncate max-w-[180px]">
                  {currentUser?.address || "Lagos, Nigeria"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-200" />
              </div>
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-xs font-extrabold text-white">
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "N"}
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search restaurants, stores, products..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white text-xs font-semibold text-[#101714] placeholder-slate-400 outline-none shadow-xs border border-[#E3EAE6]"
          />
        </form>
      </div>

      <div className="px-4 mt-4 flex flex-col gap-6">
        {/* 2. PROMOTIONAL BANNER */}
        <div className="relative w-full h-36 rounded-3xl overflow-hidden bg-gradient-to-r from-[#006B3C] to-[#008A4C] p-4 text-white shadow-md flex items-center justify-between">
          <div className="flex flex-col gap-1 z-10 max-w-[60%]">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-extrabold uppercase tracking-wider w-fit">
              Special Offer
            </span>
            <h2 className="text-base font-black leading-tight text-white">
              Good Food Great Vibes
            </h2>
            <p className="text-[11px] text-emerald-100 line-clamp-1">
              Fresh meals from your favorite restaurants
            </p>
            <button
              onClick={() => router.push("/shop")}
              className="mt-1 px-3 py-1.5 rounded-xl bg-white text-[#008A4C] text-xs font-black w-fit hover:bg-emerald-50 transition-colors shadow-xs"
            >
              Order Now
            </button>
          </div>
          <div className="w-28 h-28 shrink-0 relative">
            <img
              src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80"
              alt="Promo Banner"
              className="w-full h-full object-cover rounded-2xl shadow-lg border-2 border-white/20"
            />
          </div>
        </div>

        {/* 3. CATEGORIES CAROUSEL (Horizontal Scroll) */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#101714] dark:text-white">Categories</h3>
            <Link href="/shop" className="text-xs font-bold text-[#008A4C] hover:underline">
              See All
            </Link>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto scrollbar-none py-1 -mx-4 px-4">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.label}
                  onClick={() => {
                    setSelectedCategory(cat.categoryKey);
                    router.push(`/shop?category=${cat.categoryKey}`);
                  }}
                  className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl ${cat.bg} flex items-center justify-center shadow-xs border border-[#E3EAE6] dark:border-slate-800 group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold text-[#101714] dark:text-slate-300">
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. FEATURED STORES (Horizontal scroll cards) */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#101714] dark:text-white">Featured Stores</h3>
            <Link href="/shop" className="text-xs font-bold text-[#008A4C] flex items-center gap-0.5">
              <span>See All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex items-center gap-4 overflow-x-auto scrollbar-none py-1 -mx-4 px-4">
            {featuredStores.map((st) => (
              <Link
                key={st.id}
                href={`/shop?store=${st.id}`}
                className="flex flex-col w-56 shrink-0 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-[#E3EAE6] dark:border-slate-800 shadow-xs hover:shadow-md transition-all"
              >
                <div className="relative w-full h-28 bg-slate-100 dark:bg-slate-800">
                  <img src={st.banner} alt={st.name} className="w-full h-full object-cover" />
                  {st.isVerified && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#008A4C] text-white text-[9px] font-bold flex items-center gap-1 shadow-xs">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verified</span>
                    </div>
                  )}
                </div>

                <div className="p-3 flex items-start gap-2.5">
                  <img
                    src={st.logo}
                    alt={st.name}
                    className="w-10 h-10 rounded-xl object-cover border border-[#E3EAE6] shrink-0"
                  />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <h4 className="text-xs font-black text-[#101714] dark:text-white truncate">
                      {st.name}
                    </h4>
                    <p className="text-[10px] font-semibold text-[#66736D] dark:text-slate-400 capitalize">
                      {st.category} • {st.deliveryTime}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-bold mt-1">
                      <span className="flex items-center gap-0.5 text-amber-500">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {st.rating}
                      </span>
                      <span className="text-[#66736D]">₦{st.deliveryFee} delivery</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
