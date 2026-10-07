"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Search,
  ArrowRight,
  Navigation,
  ChevronRight,
  ChevronDown,
  Store as StoreIcon,
  PlusCircle,
  Check,
  ShoppingBasket,
  AlertCircle,
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
import { MobileHomeView } from "@/components/mobile/home/MobileHomeView";
import { MobileSplashOnboarding } from "@/components/mobile/navigation/MobileSplashOnboarding";
import { Product, Store } from "@/types";
import { usePlatform } from "@/store/PlatformContext";
import { NovoLogo } from "@/components/shared/NovoLogo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { ProductCard } from "@/components/cards/ProductCard";
import { Modal } from "@/components/ui/Modal";
import { reverseGeocode } from "@/utils/locationUtils";

interface CategoryItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; weight?: "duotone" | "fill" | "bold" | "light" | "thin" | "regular"; className?: string }>;
}

export default function CustomerHomePage() {
  const router = useRouter();
  const {
    stores,
    products,
    addToCart,
    isAuthenticated,
    currentUser,
    userLocationAddress,
    setUserLocation,
    getStoreDeliveryDetails,
  } = usePlatform();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [customAddressInput, setCustomAddressInput] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Synchronized Slide & Text State
  const [activeSlide, setActiveSlide] = useState(0);

  // Dynamically generate Hero Slides from live backend stores or verified categories
  const heroSlides = useMemo(() => {
    if (stores.length > 0) {
      return stores.slice(0, 5).map((s: Store) => ({
        image: s.banner || s.logo || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80",
        text: s.name,
        caption: s.description || `${s.name} - Quality items & fast delivery in Delta State`,
        category: s.category || "all",
        href: `/shop?store=${s.id}`,
      }));
    }
    return [
      {
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80",
        text: "Fresh & Fast Commerce",
        caption: "Connect with top verified merchants and on-demand courier delivery in Warri, Asaba & Sapele",
        category: "all",
        href: "/shop",
      },
    ];
  }, [stores]);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const slideInterval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 3500);
    return () => clearInterval(slideInterval);
  }, [heroSlides.length]);

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

  // Categories with Phosphor Duotone Icons
  const categories: CategoryItem[] = [
    { id: "all", label: "All Categories", icon: SquaresFour },
    { id: "restaurant", label: "Food", icon: ForkKnife },
    { id: "supermarket", label: "Groceries", icon: ShoppingCartSimple },
    { id: "pharmacy", label: "Pharmacy", icon: Pill },
    { id: "drinks", label: "Drinks", icon: Coffee },
    { id: "beauty", label: "Beauty", icon: Sparkle },
    { id: "electronics", label: "Electronics", icon: DeviceMobile },
  ];

  const targetCities = [
    "Warri, Delta State",
    "Asaba, Delta State",
    "Sapele, Delta State",
    "Effurun, Delta State",
    "Ughelli, Delta State",
  ];

  // Annotate stores with geofencing details (distance, dynamic fee, ETA)
  const annotatedStores = useMemo(() => {
    return stores.map((st) => {
      const details = getStoreDeliveryDetails(st);
      return {
        ...st,
        inRange: details.inRange,
        distanceKm: details.distanceKm,
        calculatedDeliveryFee: details.deliveryFee,
        calculatedDeliveryTime: details.deliveryTime,
      };
    });
  }, [stores, getStoreDeliveryDetails]);

  // Filter in-range stores matching category & search
  const filteredStores = useMemo(() => {
    return annotatedStores.filter((store) => {
      const matchesCategory = selectedCategory === "all" || store.category === selectedCategory;
      const matchesSearch =
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (store.cuisineType && store.cuisineType.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (store.city && store.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (store.address && store.address.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [annotatedStores, selectedCategory, searchQuery]);

  // Filter products by search query
  const featuredProducts = useMemo(() => {
    return products.filter(
      (p: Product) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const currentSlide = heroSlides[activeSlide] || heroSlides[0];

  return (
    <>
      <MobileSplashOnboarding />
      <MobileHomeView />
      <div className="hidden md:flex flex-col w-full min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16 font-sans">
        {/* 1. CHOWDECK-STYLE EMERALD GREEN HERO BANNER (#087F5B) */}
        <section className="relative w-full bg-gradient-to-b from-[#099268] via-[#087F5B] to-[#066347] text-white overflow-hidden pb-28 sm:pb-36">
          {/* Multi-tone Ambient Lighting */}
          <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-white/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl pointer-events-none" />

          {/* INTEGRATED HEADER */}
          <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between relative z-30">
            <NovoLogo variant="white" subtitle="Delivery Express" size="md" />

            <nav className="hidden md:flex items-center gap-1 bg-white/15 backdrop-blur-lg px-4 py-1.5 rounded-2xl border border-white/20 shadow-inner">
              {[
                { label: "Home", href: "/" },
                { label: "Shop", href: "/shop" },
                { label: "Orders", href: "/orders" },
                { label: "Profile", href: "/profile" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    item.href === "/"
                      ? "bg-white text-[#087F5B] shadow-lg font-black"
                      : "text-white hover:bg-white/20"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <ThemeToggle />

              {!isAuthenticated ? (
                <Link
                  href="/auth"
                  className="px-4 py-2 rounded-xl text-xs font-black bg-white text-[#087F5B] hover:bg-emerald-50 transition-all active:scale-95 cursor-pointer shadow-md"
                >
                  Sign In
                </Link>
              ) : (
                <Link
                  href="/profile"
                  className="px-4 py-2 rounded-xl text-xs font-black bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-all active:scale-95 cursor-pointer shadow-md"
                >
                  {currentUser?.name || "Account"}
                </Link>
              )}
            </div>
          </header>

          {/* HERO CONTENT GRID */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mt-4 sm:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column - Chowdeck Central Location & Search Widget */}
            <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left gap-6">
              <div className="flex flex-col gap-3 items-center lg:items-start">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight min-h-[90px]">
                  <span
                    key={activeSlide}
                    className="inline-block animate-in fade-in slide-in-from-bottom-3 duration-500 text-white"
                  >
                    {currentSlide.text}
                  </span>
                </h1>
                <p className="text-sm sm:text-base text-emerald-100 font-medium max-w-md">
                  {currentSlide.caption}
                </p>
              </div>

              {/* CHOWDECK LOCATION & SEARCH WIDGET */}
              <div className="w-full max-w-lg bg-white text-slate-900 rounded-3xl p-3 sm:p-4 shadow-2xl border border-white/30 flex flex-col gap-3">
                {/* Delivery Location Bar */}
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200/80 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#087F5B] text-white flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-extrabold text-[#087F5B] uppercase tracking-wider">
                        DELIVERING TO
                      </span>
                      <span className="text-xs font-black text-slate-800 truncate">
                        {userLocationAddress}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-black text-[#087F5B] group-hover:translate-x-0.5 transition-transform shrink-0">
                    <span>Change</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </button>

                {/* Search Bar Input */}
                <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search restaurants, dishes, groceries..."
                    className="w-full pl-10 pr-24 py-3 rounded-2xl bg-slate-50 text-xs font-bold text-slate-900 placeholder-slate-400 border border-slate-200 outline-none focus:ring-2 focus:ring-[#087F5B]"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 px-4 py-2 rounded-xl bg-[#087F5B] hover:bg-[#066347] text-white text-xs font-black transition-colors shadow-sm"
                  >
                    Search
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Hero Media Showcase */}
            <div className="lg:col-span-6 flex flex-col items-center">
              <div className="relative w-full max-w-xl lg:max-w-2xl h-80 sm:h-[420px] lg:h-[450px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 group">
                <img
                  src={currentSlide.image}
                  alt={currentSlide.caption}
                  className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#043324]/90 via-transparent to-transparent" />
                
                {/* Slide Caption Card */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-[#087F5B]/85 backdrop-blur-md border border-white/20 flex items-center justify-between shadow-lg">
                  <div>
                    <h4 className="text-sm font-black text-white">{currentSlide.text}</h4>
                    <span className="text-[11px] font-semibold text-emerald-200">{currentSlide.caption}</span>
                  </div>
                  <Link
                    href={currentSlide.href || "/shop"}
                    className="p-2 rounded-xl bg-white text-[#087F5B] hover:bg-emerald-50 transition-colors shadow-sm cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ORGANIC SVG WAVE DIVIDER */}
          <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none pointer-events-none z-10">
            <svg
              className="relative block w-full h-12 sm:h-20 lg:h-24 text-slate-50 dark:text-slate-950"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
              fill="currentColor"
            >
              <path d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,50 L1200,120 L0,120 Z"></path>
            </svg>
          </div>
        </section>

        {/* 2. DYNAMIC CATEGORY BADGES WITH PHOSPHOR DUOTONE ICONS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 w-full relative z-20">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => {
              const IconComp = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? "bg-[#087F5B] text-white shadow-md ring-2 ring-[#087F5B]/50"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <IconComp size={24} weight="duotone" className="shrink-0" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. TOP FEATURED MERCHANTS WITH GEOFENCING PRICING & ETA */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 w-full">
          <div className="p-6 sm:p-8 bg-gradient-to-r from-[#087F5B]/10 via-emerald-500/5 to-[#087F5B]/10 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-950/40 border border-[#087F5B]/20 rounded-3xl shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Top Featured Merchants Near You
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  Delivering to <strong>{userLocationAddress}</strong> with dynamic fees &amp; ETA.
                </p>
              </div>
              <Link
                href="/shop"
                className="text-xs font-black text-[#087F5B] dark:text-emerald-400 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>See All ({filteredStores.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {filteredStores.length === 0 ? (
              <div className="p-10 flex flex-col items-center justify-center text-center gap-3 bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                <StoreIcon className="w-10 h-10 text-slate-400 dark:text-slate-600" />
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Stores Available Yet</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                    Stores created by merchants will automatically appear here live from the backend.
                  </p>
                </div>
                <Link
                  href="/merchant/register"
                  className="mt-2 px-5 py-2 rounded-xl bg-[#087F5B] text-white text-xs font-bold hover:bg-[#065f44] transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Register Store</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-8 sm:gap-10 lg:gap-12 overflow-x-auto pb-4 pt-2 scrollbar-none">
                {filteredStores.map((store) => (
                  <Link
                    key={store.id}
                    href={`/shop?store=${store.id}`}
                    className="group flex flex-col items-center gap-3 shrink-0 cursor-pointer"
                  >
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full border-2 border-[#087F5B] p-1 bg-white dark:bg-slate-900 shadow-md group-hover:scale-105 group-hover:border-emerald-400 transition-all duration-300 overflow-hidden">
                      <img
                        src={store.logo}
                        alt={store.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-black rounded-full">
                        ₦{store.calculatedDeliveryFee}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-[#087F5B] dark:group-hover:text-emerald-400 transition-colors text-center line-clamp-1 max-w-[110px] sm:max-w-[125px]">
                      {store.name}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 4. POPULAR DISHES & PRODUCTS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 w-full">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Popular Dishes &amp; Products
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Directly add items to your cart for instant checkout.
                </p>
              </div>
              {products.length > 0 && (
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                  {featuredProducts.length} Items Live
                </span>
              )}
            </div>

            {featuredProducts.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center gap-3 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 shadow-xs">
                <ShoppingBasket className="w-12 h-12 text-slate-400 dark:text-slate-600" />
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Catalog Empty</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  Products added by store merchants will show up here in real time.
                </p>
                <Link
                  href="/shop"
                  className="mt-2 px-6 py-2.5 rounded-xl bg-[#087F5B] text-white text-xs font-bold hover:bg-[#065f44] transition-all shadow-sm"
                >
                  Browse All Stores
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {featuredProducts.map((prod: Product) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onAddToCart={addToCart}
                    onSelectProduct={setSelectedProduct}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* LOCATION MODAL FOR DESKTOP */}
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
              className="w-full p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-xs font-extrabold text-[#087F5B] dark:text-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#087F5B] text-white flex items-center justify-center shrink-0">
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
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#087F5B]"
                />
              </div>

              <button
                type="submit"
                disabled={!customAddressInput.trim()}
                className="w-full py-3 rounded-2xl bg-[#087F5B] hover:bg-[#066347] text-white text-xs font-black disabled:opacity-50 transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Location</span>
              </button>
            </form>

            {/* Target Delivery Cities */}
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
                    <Check className="w-3.5 h-3.5 text-[#087F5B]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </Modal>

        {/* PRODUCT DETAILS MODAL */}
        <Modal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          title={selectedProduct?.name}
        >
          {selectedProduct && (
            <div className="flex flex-col gap-4">
              <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedProduct.description}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
                <span className="text-lg font-black text-slate-900 dark:text-slate-100">
                  ₦{selectedProduct.price.toLocaleString()}
                </span>
                <button
                  onClick={() => {
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-[#087F5B] hover:bg-[#065f44] text-white text-xs font-black transition-colors cursor-pointer"
                >
                  Add to Order
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  );
}
