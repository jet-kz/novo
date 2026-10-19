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
import { usePlatform } from "@/store/PlatformContext";
import { LocationPicker } from "@/components/location/LocationPicker";
import { CategoryIcon, useCatalog } from "@/components/shared/useCatalog";
import { HomeCollections } from "@/components/shared/HomeCollections";
import { PromoCarousel } from "@/components/home/PromoCarousel";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Store, Product } from "@/types";


export function MobileHomeView() {
  const router = useRouter();
  const {
    stores,
    products,
    addToCart,
    openProduct,
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
            <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center shrink-0">
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
          <ThemeToggle />
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="w-4.5 h-4.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search food, groceries, stores…"
            className="w-full h-12 pl-11 pr-4 rounded-full bg-slate-100 dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#087F5B]/30 transition-all"
          />
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

        {/* 2. PROMO BANNERS (managed in Admin → Ad banners) */}
        <PromoCarousel placement="home" />

        {/* 3. CATEGORIES SECTION */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
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
                    className={`w-16 h-16 rounded-[22px] flex items-center justify-center transition-all duration-200 group-active:scale-95 ${
                      isSelected
                        ? "bg-[#087F5B] text-white shadow-md"
                        : "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    <CategoryIcon category={cat.category} size={28} />
                  </div>
                  <span
                    className={`text-xs font-semibold transition-colors ${
                      isSelected ? "text-[#087F5B] dark:text-emerald-400" : "text-slate-600 dark:text-slate-300"
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
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
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
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-900 rounded-2xl">
              No stores available right now.
            </div>
          ) : (
            <div className="flex items-center gap-4 overflow-x-auto scrollbar-none py-1 -mx-4 px-4">
              {featuredStores.map((st) => (
                <Link
                  key={st.id}
                  href={`/shop?store=${st.id}`}
                  className="flex flex-col w-60 shrink-0 bg-white dark:bg-slate-900 rounded-[22px] overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.14)] active:scale-[0.99] transition-transform group"
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
                      className="w-10 h-10 rounded-xl object-cover bg-slate-100 shrink-0"
                    />
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <h4 className="text-xs font-black text-[#0F172A] dark:text-white truncate">
                        {st.name}
                      </h4>
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 capitalize">
                        {st.category} • {st.calculatedDeliveryTime}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-bold mt-1">
                        {Number(st.rating) > 0 && (
                          <span className="flex items-center gap-0.5 text-amber-500">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {Number(st.rating).toFixed(1)}
                          </span>
                        )}
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
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
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
                  onClick={() => openProduct(prod)}
                  className="flex flex-col bg-white dark:bg-slate-900 rounded-[22px] overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)] p-2.5 cursor-pointer active:scale-[0.99] transition-transform"
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
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-black text-[#008A4C] dark:text-emerald-400">
                      ₦{prod.price.toLocaleString()}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(prod);
                      }}
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
