"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Search,
  ChevronDown,
  Star,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import {
  SquaresFour,
} from "@phosphor-icons/react";
import { usePlatform } from "@/store/PlatformContext";
import { LocationPicker } from "@/components/location/LocationPicker";
import { CategoryIcon, useCatalog } from "@/components/shared/useCatalog";
import { HomeCollections } from "@/components/shared/HomeCollections";
import { Store, Product } from "@/types";


export function MobileHomeView() {
  const router = useRouter();
  const {
    stores,
    products,
    addToCart,
    userLocationAddress,
    userLocationCoords,
    userLocationDetails,
    setUserLocation,
    getStoreDeliveryDetails,
  } = usePlatform();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);


  const { categories: platformCategories } = useCatalog();
  const categories = [
    ...platformCategories.map((c) => ({ label: c.name, categoryKey: c.slug, category: c })),
    { label: "More", categoryKey: "all", category: { slug: "all", name: "More", icon: null } },
  ];


  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Annotate stores with geofencing details (distance, dynamic fee, ETA)
  const annotatedStores = stores.map((st) => {
    const details = getStoreDeliveryDetails(st);
    return {
      ...st,
      inRange: details.inRange,
      distanceKm: details.distanceKm,
      calculatedDeliveryFee: details.deliveryFee,
      calculatedDeliveryTime: details.deliveryTime,
    };
  });

  // Filter in-range stores
  const inRangeStores = annotatedStores.filter((st) => st.inRange);

  const featuredStores = (inRangeStores.length > 0 ? inRangeStores : annotatedStores).slice(0, 6);
  const featuredProducts = products.slice(0, 6);

  return (
    <div className="md:hidden flex flex-col w-full min-h-screen bg-white dark:bg-slate-950 text-[#0F172A] dark:text-slate-100 pb-24 font-sans">
      {/* 1. TOP MOBILE HEADER - CLEAN NON-STICKY HEADER */}
      <div className="w-full bg-white dark:bg-slate-950 px-4 pt-4 pb-3 space-y-3">
        {/* Top Header Row: Delivery Location */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center gap-2 text-left cursor-pointer group active:scale-95 transition-transform"
          >
            <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center shrink-0 shadow-2xs">
              <MapPin className="w-4.5 h-4.5 text-[#087F5B] dark:text-emerald-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                DELIVERING TO
              </span>
              <div className="flex items-center gap-1 text-xs font-black text-slate-900 dark:text-white">
                <span className="truncate max-w-[145px] sm:max-w-[200px]">
                  {userLocationAddress}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:translate-y-0.5 transition-transform shrink-0" />
              </div>
            </div>
          </button>
        </div>

        {/* Search Input Bar with Filter Icon */}
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="w-4.5 h-4.5 text-slate-400 absolute left-4 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search restaurants, stores, products..."
            className="w-full pl-11 pr-11 py-2.5 rounded-full bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none border border-slate-200 dark:border-slate-800 focus:border-[#087F5B] focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-2xs"
          />
          <button
            type="submit"
            className="absolute right-3.5 top-2.5 text-[#087F5B] dark:text-emerald-400 hover:text-emerald-700 transition-colors p-0.5 cursor-pointer"
            aria-label="Filter or search"
          >
            <SquaresFour weight="duotone" className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>

      <div className="px-4 mt-4 flex flex-col gap-6">
        {/* OUT-OF-RANGE LOCATION ALERT (GEOFENCING WARNING) */}
        {inRangeStores.length === 0 && stores.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-semibold">
                No stores near <strong>{userLocationAddress.split(",")[0]}</strong> yet. Showing all available hubs.
              </span>
            </div>
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="px-3 py-1 rounded-xl bg-amber-600 text-white font-extrabold text-[10px] shrink-0 hover:bg-amber-700 cursor-pointer"
            >
              Switch City
            </button>
          </div>
        )}

        {/* 2. REFINED SENIOR PRODUCT PROMO BANNER */}
        <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-[#004D2A] to-slate-950 p-5 text-white shadow-xl flex items-center justify-between gap-4">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-[#008A4C]/30 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col gap-1.5 z-10 max-w-[62%]">
            <h2 className="text-lg font-black leading-tight text-white tracking-tight">
              Good Food Great Vibes
            </h2>
            <p className="text-xs font-medium text-emerald-100/90 leading-relaxed">
              Fresh meals &amp; essentials across Warri, Asaba &amp; Sapele.
            </p>
            <button
              onClick={() => router.push("/shop")}
              className="mt-2.5 px-4 py-2 rounded-xl bg-white text-[#008A4C] text-xs font-black w-fit hover:bg-emerald-50 active:scale-95 transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <span>Order Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 relative z-10">
            <img
              src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80"
              alt="Promo Food Showcase"
              className="w-full h-full object-cover rounded-2xl shadow-2xl border-2 border-white/20 ring-4 ring-emerald-500/20"
            />
          </div>
        </div>

        {/* 3. CATEGORIES SECTION */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#0F172A] dark:text-white tracking-tight">
              Categories
            </h3>
            <Link href="/shop" className="text-xs font-extrabold text-[#008A4C] dark:text-emerald-400 hover:underline">
              See All
            </Link>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto scrollbar-none py-1 -mx-4 px-4">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.categoryKey;
              return (
                <button
                  key={cat.label}
                  onClick={() => {
                    setSelectedCategory(cat.categoryKey);
                    router.push(
                      cat.categoryKey === "all"
                        ? "/shop"
                        : `/shop?category=${cat.categoryKey}`
                    );
                  }}
                  className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                      isSelected
                        ? "bg-[#008A4C] text-white shadow-md ring-2 ring-[#008A4C]/30 scale-105"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 shadow-xs group-hover:border-[#008A4C] group-hover:text-[#008A4C]"
                    }`}
                  >
                    <CategoryIcon category={cat.category} size={28} />
                  </div>
                  <span
                    className={`text-[11px] font-bold transition-colors ${
                      isSelected
                        ? "text-[#008A4C] dark:text-emerald-400 font-black"
                        : "text-[#475569] dark:text-slate-300"
                    }`}
                  >
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. FEATURED STORES SECTION WITH DYNAMIC GEOFENCED PRICING */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#0F172A] dark:text-white tracking-tight">
              Featured Stores ({inRangeStores.length > 0 ? "Delivering Near You" : "All Cities"})
            </h3>
            <Link
              href="/shop"
              className="text-xs font-black text-[#008A4C] dark:text-emerald-400 flex items-center gap-0.5 hover:underline"
            >
              <span>See All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {featuredStores.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              No stores available right now.
            </div>
          ) : (
            <div className="flex items-center gap-4 overflow-x-auto scrollbar-none py-1 -mx-4 px-4">
              {featuredStores.map((st) => (
                <Link
                  key={st.id}
                  href={`/shop?store=${st.id}`}
                  className="flex flex-col w-56 shrink-0 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all group"
                >
                  <div className="relative w-full h-28 bg-slate-100 dark:bg-slate-800">
                    <img
                      src={st.banner || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80"}
                      alt={st.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-bold">
                      {st.distanceKm} km
                    </div>
                    {st.isVerified && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#008A4C] text-white text-[9px] font-bold flex items-center gap-1 shadow-xs">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 flex items-start gap-2.5">
                    <img
                      src={st.logo || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=150&q=80"}
                      alt={st.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <h4 className="text-xs font-black text-[#0F172A] dark:text-white truncate">
                        {st.name}
                      </h4>
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 capitalize">
                        {st.category} • {st.calculatedDeliveryTime}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-bold mt-1">
                        <span className="flex items-center gap-0.5 text-amber-500">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {st.rating || "4.8"}
                        </span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-black">
                          ₦{st.calculatedDeliveryFee} delivery
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 5. ADMIN-CURATED COLLECTIONS */}
        <HomeCollections stores={stores} />

        {/* 6. POPULAR DISHES & ITEMS */}
        {featuredProducts.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[#0F172A] dark:text-white tracking-tight">
                Popular Items Near You
              </h3>
              <Link href="/shop" className="text-xs font-extrabold text-[#008A4C] dark:text-emerald-400 hover:underline">
                View All
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {featuredProducts.map((prod: Product) => (
                <div
                  key={prod.id}
                  className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-xs hover:shadow-sm transition-all p-2.5"
                >
                  <div className="relative w-full h-24 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden mb-2">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h4 className="text-xs font-black text-[#0F172A] dark:text-white truncate">
                    {prod.name}
                  </h4>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {prod.description}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-black text-[#008A4C] dark:text-emerald-400">
                      ₦{prod.price.toLocaleString()}
                    </span>
                    <button
                      onClick={() => addToCart(prod)}
                      className="px-2.5 py-1 rounded-lg bg-[#008A4C] text-white text-[10px] font-black hover:bg-[#006B3C] active:scale-95 transition-all shadow-xs cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* LOCATION PICKER MODAL */}
      <LocationPicker
        open={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        initialCoords={userLocationCoords}
        initialDetails={userLocationDetails}
        onConfirm={(loc) => {
          setUserLocation(loc.address, loc.coords, loc.details);
          setIsLocationModalOpen(false);
        }}
      />
    </div>
  );
}
