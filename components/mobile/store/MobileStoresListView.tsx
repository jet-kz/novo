"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BadgeCheck, Bike, Clock, Search, Store as StoreIcon, X } from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";
import { CategoryIcon, useCatalog } from "@/components/shared/useCatalog";
import { PromoCarousel } from "@/components/home/PromoCarousel";

export function MobileStoresListView() {
  const router = useRouter();
  const params = useSearchParams();
  const { stores, getStoreDeliveryDetails } = usePlatform();
  const { categories } = useCatalog();
  const [searchQuery, setSearchQuery] = useState(params.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(params.get("category") || "all");

  const chips = [{ slug: "all", name: "All", icon: null as string | null | undefined }, ...categories];

  const filteredStores = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return stores
      .filter((st) => selectedCategory === "all" || st.category === selectedCategory)
      .filter(
        (st) =>
          !q ||
          st.name.toLowerCase().includes(q) ||
          (st.description || "").toLowerCase().includes(q) ||
          (st.cuisineType || "").toLowerCase().includes(q)
      )
      .map((st) => ({ store: st, delivery: getStoreDeliveryDetails(st) }))
      .sort((a, b) => Number(b.delivery.inRange) - Number(a.delivery.inRange));
  }, [stores, selectedCategory, searchQuery, getStoreDeliveryDetails]);

  return (
    <div className="md:hidden flex flex-col w-full min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-28">
      {/* Header: back, title, search and categories stay pinned while scrolling */}
      <div className="sticky top-0 z-40 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            aria-label="Back"
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-bold leading-tight">Stores</h1>
            <p className="text-xs text-slate-500">{filteredStores.length} open on Novo</p>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4.5 h-4.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stores or dishes"
            className="w-full h-11 pl-11 pr-10 rounded-full bg-slate-100 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#087F5B]/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-300/70 dark:bg-slate-700 text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-4 px-4">
          {chips.map((cat) => {
            const on = selectedCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                aria-pressed={on}
                className={`h-9 pl-2.5 pr-3.5 rounded-full text-[13px] font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                  on ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {cat.slug !== "all" && <CategoryIcon category={cat as any} size={18} />}
                <span className={cat.slug === "all" ? "pl-1" : ""}>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pt-2 flex flex-col gap-4">
        <PromoCarousel placement="shop" fallback={false} />
        {filteredStores.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-2">
            <span className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center">
              <StoreIcon className="w-6 h-6 text-slate-400" />
            </span>
            <p className="text-sm font-semibold">No stores found</p>
            <p className="text-xs text-slate-500 max-w-xs">
              {searchQuery ? `Nothing matches “${searchQuery}”.` : "No stores in this category yet."}
            </p>
          </div>
        ) : (
          filteredStores.map(({ store: st, delivery }) => (
            <Link
              key={st.id}
              href={`/shop?store=${st.id}`}
              className={`group bg-white dark:bg-slate-900 rounded-[24px] overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)] active:scale-[0.99] transition-transform ${
                delivery.inRange ? "" : "opacity-70"
              }`}
            >
              <div className="relative w-full aspect-[16/7] bg-slate-100 dark:bg-slate-800">
                {st.banner && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={st.banner} alt="" className="w-full h-full object-cover" />
                )}
                {st.isOpening === false && (
                  <span className="absolute inset-0 bg-slate-950/55 flex items-center justify-center text-white text-sm font-semibold">Closed now</span>
                )}
              </div>
              <div className="p-3.5 flex items-center gap-3">
                {st.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={st.logo} alt="" className="w-11 h-11 rounded-2xl object-cover shrink-0 bg-slate-100" />
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-bold truncate flex items-center gap-1">
                    {st.name}
                    {st.isVerified && <BadgeCheck className="w-4 h-4 text-[#087F5B] shrink-0" aria-label="Verified" />}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    {delivery.inRange ? (
                      <>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {delivery.deliveryTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bike className="w-3.5 h-3.5" /> ₦{Number(delivery.deliveryFee).toLocaleString()}
                        </span>
                        <span>{delivery.distanceKm} km</span>
                      </>
                    ) : (
                      <span>Outside your delivery area</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
