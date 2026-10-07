"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Star,
  Clock,
  Bike,
  ShieldCheck,
  Store as StoreIcon,
  MapPin,
  Sparkles,
  ChevronRight,
  Filter,
} from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";
import { Store } from "@/types";

export function MobileStoresListView() {
  const router = useRouter();
  const { stores, userLocationAddress } = usePlatform();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { key: "all", label: "All Stores" },
    { key: "restaurant", label: "Restaurants" },
    { key: "supermarket", label: "Supermarkets" },
    { key: "pharmacy", label: "Pharmacies" },
    { key: "grocery", label: "Grocery" },
  ];

  const filteredStores = stores.filter((st) => {
    const matchesCategory =
      selectedCategory === "all" ||
      (st.category && st.category.toLowerCase().includes(selectedCategory.toLowerCase()));
    const matchesQuery =
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (st.description && st.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="md:hidden flex flex-col w-full min-h-screen bg-[#F7FAF8] dark:bg-slate-950 text-[#101714] dark:text-slate-100 pb-28 font-sans">
      {/* 1. TOP HEADER BAR */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-[#E3EAE6] dark:border-slate-800 px-4 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="p-1.5 rounded-full bg-[#F7FAF8] dark:bg-slate-800 text-[#101714] dark:text-white cursor-pointer hover:bg-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm font-black text-[#101714] dark:text-white">
              All Verified Stores
            </h1>
            <span className="text-[10px] text-[#66736D] dark:text-slate-400 font-semibold">
              {stores.length} Merchants Delivering Near You
            </span>
          </div>
        </div>
      </div>

      {/* 2. SEARCH & CATEGORY FILTERS */}
      <div className="p-4 flex flex-col gap-3 bg-white dark:bg-slate-900 border-b border-[#E3EAE6] dark:border-slate-800">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stores by name, category, or cuisine..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F7FAF8] dark:bg-slate-800 text-xs font-bold text-[#101714] dark:text-white placeholder:text-slate-400 outline-none border border-[#E3EAE6] dark:border-slate-700 focus:border-[#008A4C]"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#008A4C] text-white shadow-2xs"
                    : "bg-[#F7FAF8] dark:bg-slate-800 text-[#66736D] dark:text-slate-400 border border-[#E3EAE6] dark:border-slate-800"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. STORES LIST (FLAT HERO UI STYLE) */}
      <div className="p-4 flex flex-col gap-4">
        {filteredStores.length === 0 ? (
          <div className="py-16 text-center text-xs font-bold text-[#66736D] dark:text-slate-400 flex flex-col items-center gap-2">
            <StoreIcon className="w-10 h-10 text-slate-300 dark:text-slate-700" />
            <span className="text-sm font-black text-slate-900 dark:text-white">
              No Stores Found
            </span>
            <p className="max-w-xs text-xs">
              No merchant matching &quot;{searchQuery}&quot; was found.
            </p>
          </div>
        ) : (
          <div className="flex flex-col bg-white dark:bg-slate-900 border-y border-[#E3EAE6]/80 dark:border-slate-800/80">
            {filteredStores.map((st, idx) => {
              const isLast = idx === filteredStores.length - 1;
              return (
                <Link
                  key={st.id}
                  href={`/shop?store=${st.id}`}
                  className={`flex flex-col p-4 hover:bg-[#F7FAF8] dark:hover:bg-slate-800/50 transition-colors ${
                    !isLast ? "border-b border-[#E3EAE6]/70 dark:border-slate-800/70" : ""
                  }`}
                >
                  <div className="relative w-full h-32 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-3">
                    <img
                      src={
                        st.banner ||
                        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80"
                      }
                      alt={st.name}
                      className="w-full h-full object-cover"
                    />
                    {st.isVerified && (
                      <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-[#008A4C] text-white text-[9px] font-black flex items-center gap-1 shadow-xs">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <img
                        src={
                          st.logo ||
                          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=150&q=80"
                        }
                        alt={st.name}
                        className="w-12 h-12 rounded-xl object-cover border border-[#E3EAE6] dark:border-slate-800 shrink-0"
                      />
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <h3 className="text-sm font-black text-[#101714] dark:text-white truncate">
                          {st.name}
                        </h3>
                        <p className="text-xs text-[#66736D] dark:text-slate-400 font-medium truncate">
                          {st.description || `${st.category} • Fast Delivery`}
                        </p>

                        <div className="flex items-center gap-3 text-xs font-bold mt-1">
                          <span className="flex items-center gap-1 text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            {st.rating || "4.8"}
                          </span>
                          <span className="text-[#66736D] dark:text-slate-400">
                            {st.deliveryTime || "20-30 min"}
                          </span>
                          <span className="text-[#008A4C] font-black">
                            ₦{st.deliveryFee || 300} delivery
                          </span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-400 shrink-0 self-center" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
