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
  Navigation,
  Check,
  MessageCircle,
  AlertCircle,
  User,
} from "lucide-react";
import {
  ForkKnife,
  ShoppingCartSimple,
  Pill,
  Coffee,
  Sparkle,
  DeviceMobile,
  SquaresFour,
} from "@phosphor-icons/react";
import { usePlatform } from "@/store/PlatformContext";
import { Store, Product } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { reverseGeocode, getCoordinatesForAddress } from "@/utils/locationUtils";

interface CategoryItem {
  label: string;
  icon: React.ComponentType<{ size?: number; weight?: "duotone" | "fill" | "bold" | "light" | "thin" | "regular"; className?: string }>;
  categoryKey: string;
}

export function MobileHomeView() {
  const router = useRouter();
  const {
    stores,
    products,
    cart,
    addToCart,
    setIsCartOpen,
    userLocationAddress,
    setUserLocation,
    getStoreDeliveryDetails,
  } = usePlatform();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [customAddressInput, setCustomAddressInput] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const categories: CategoryItem[] = [
    { label: "Food", icon: ForkKnife, categoryKey: "restaurant" },
    { label: "Groceries", icon: ShoppingCartSimple, categoryKey: "supermarket" },
    { label: "Pharmacy", icon: Pill, categoryKey: "pharmacy" },
    { label: "Drinks", icon: Coffee, categoryKey: "drinks" },
    { label: "Beauty", icon: Sparkle, categoryKey: "beauty" },
    { label: "Electronics", icon: DeviceMobile, categoryKey: "electronics" },
    { label: "More", icon: SquaresFour, categoryKey: "all" },
  ];

  const popularSearches = ["Banga Soup", "Fisherman Soup", "Jollof Rice", "Groceries", "Pharmacy", "Drinks"];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleUseMyLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const readableAddress = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          setUserLocation(readableAddress, { lat: pos.coords.latitude, lon: pos.coords.longitude });
          setIsLocating(false);
          setIsLocationModalOpen(false);
        },
        () => {
          setUserLocation("Current Location, Warri, Delta State", { lat: 5.5544, lon: 5.7932 });
          setIsLocating(false);
          setIsLocationModalOpen(false);
        }
      );
    } else {
      setIsLocating(false);
    }
  };

  const handleSaveCustomAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (customAddressInput.trim()) {
      setUserLocation(customAddressInput.trim());
      setCustomAddressInput("");
      setIsLocationModalOpen(false);
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

  const targetCities = [
    "Warri, Delta State",
    "Asaba, Delta State",
    "Sapele, Delta State",
    "Effurun, Delta State",
    "Ughelli, Delta State",
  ];

  return (
    <div className="md:hidden flex flex-col w-full min-h-screen bg-white dark:bg-slate-950 text-[#0F172A] dark:text-slate-100 pb-24 font-sans">
      {/* 1. TOP MOBILE HEADER - CLEAN NON-STICKY HEADER */}
      <div className="w-full bg-white dark:bg-slate-950 px-4 pt-4 pb-3 space-y-3">
        {/* Top Header Row: Delivery Location & Right Actions (Cart + Account) */}
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

          <div className="flex items-center gap-2">
            {/* CART BUTTON BESIDE ACCOUNT */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative w-9 h-9 rounded-full bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-100 transition-colors cursor-pointer border border-slate-200/80 dark:border-slate-800 shadow-2xs"
              aria-label="View Cart"
            >
              <ShoppingCartSimple weight="duotone" className="w-4.5 h-4.5 text-slate-800 dark:text-slate-100" />
              {totalCartItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#087F5B] text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950 shadow-2xs animate-pulse">
                  {totalCartItems}
                </span>
              )}
            </button>

            {/* ACCOUNT PROFILE BUTTON */}
            <Link
              href="/profile"
              className="px-3.5 py-1.5 rounded-full bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-100 transition-colors shadow-2xs"
            >
              <User className="w-3.5 h-3.5 text-[#087F5B] dark:text-emerald-400" />
              <span>Account</span>
            </Link>
          </div>
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

        {/* Quick Search Tag Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-0.5 text-[10px] font-bold">
          <span className="text-slate-400 dark:text-slate-500 shrink-0 font-extrabold">Quick search:</span>
          {popularSearches.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setSearchQuery(tag);
                router.push(`/shop?q=${encodeURIComponent(tag)}`);
              }}
              className="px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 whitespace-nowrap transition-colors cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 flex flex-col gap-6">
        {/* OUT-OF-RANGE LOCATION ALERT (GEOFENCING WARNING) */}
        {inRangeStores.length === 0 && stores.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-3 shadow-xs">
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
        <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-[#004D2A] to-slate-950 p-5 text-white shadow-xl flex items-center justify-between gap-4 border border-emerald-800/40">
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
              const IconComp = cat.icon;
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
                    <IconComp size={28} weight="duotone" className="shrink-0" />
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
                  className="flex flex-col w-56 shrink-0 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all group"
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

        {/* 5. POPULAR DISHES & ITEMS */}
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
                  className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all p-2.5"
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

      {/* FLOATING SUPPORT ACTION BUTTON */}
      <Link
        href="/support"
        className="fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-[#008A4C] text-white shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
        aria-label="Support Chat"
      >
        <MessageCircle className="w-6 h-6" />
      </Link>

      {/* LOCATION PICKER MODAL */}
      <Modal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        title="Delivery Address"
        subtitle="Where should we deliver your order?"
      >
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={isLocating}
            className="w-full p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-xs font-extrabold text-[#008A4C] dark:text-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#008A4C] text-white flex items-center justify-center shrink-0">
              <Navigation className={`w-4 h-4 ${isLocating ? "animate-spin" : ""}`} />
            </div>
            <div className="flex flex-col items-start text-left">
              <span>{isLocating ? "Detecting Address..." : "Use Current Geolocation"}</span>
              <span className="text-[10px] font-normal text-emerald-700 dark:text-emerald-400">
                Converts GPS coordinates into a street delivery address
              </span>
            </div>
          </button>

          <div className="relative flex items-center my-1">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
            <span className="flex-shrink mx-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Or type custom address
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
          </div>

          <form onSubmit={handleSaveCustomAddress} className="flex flex-col gap-3">
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={customAddressInput}
                onChange={(e) => setCustomAddressInput(e.target.value)}
                placeholder="e.g. Airport Road, Effurun, Warri"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#008A4C]"
              />
            </div>

            <button
              type="submit"
              disabled={!customAddressInput.trim()}
              className="w-full py-3 rounded-2xl bg-[#008A4C] hover:bg-[#006B3C] text-white text-xs font-black disabled:opacity-50 transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Location</span>
            </button>
          </form>

          {/* Target Delta State Cities & Hubs */}
          <div className="flex flex-col gap-1.5 mt-2">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">
              Target Delivery Cities (Delta State)
            </span>
            {targetCities.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => {
                  setUserLocation(city);
                  setIsLocationModalOpen(false);
                }}
                className="p-2.5 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>{city}</span>
                {userLocationAddress === city && (
                  <Check className="w-3.5 h-3.5 text-[#008A4C]" />
                )}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
