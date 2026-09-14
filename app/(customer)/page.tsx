"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  MapPin,
  Search,
  ShoppingBag,
  ArrowRight,
  Zap,
  ShieldCheck,
  Clock,
  Navigation,
  PackageCheck,
  UtensilsCrossed,
  Pill,
  ShoppingBasket,
  Flame,
  Star,
  ChevronRight,
  Store as StoreIcon,
  PlusCircle,
} from "lucide-react";
import { MobileHomeView } from "@/components/mobile/home/MobileHomeView";
import { MobileSplashOnboarding } from "@/components/mobile/navigation/MobileSplashOnboarding";
import { Product, Store } from "@/types";
import { usePlatform } from "@/store/PlatformContext";
import { NovoLogo } from "@/components/shared/NovoLogo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { ProductCard } from "@/components/cards/ProductCard";
import { Modal } from "@/components/ui/Modal";

export default function CustomerHomePage() {
  const { stores, products, addToCart, isAuthenticated, currentUser, activeOrder } = usePlatform();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState(currentUser?.address || "Set Delivery Location");
  const [isLocating, setIsLocating] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Synchronized Slide & Text State
  const [activeSlide, setActiveSlide] = useState(0);

  // Update delivery location when currentUser address changes
  useEffect(() => {
    if (currentUser?.address) {
      setDeliveryLocation(currentUser.address);
    }
  }, [currentUser?.address]);

  // Dynamically generate Hero Slides from live backend stores or verified categories
  const heroSlides = useMemo(() => {
    if (stores.length > 0) {
      return stores.slice(0, 5).map((s: Store) => ({
        image: s.banner || s.logo || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80",
        text: s.name,
        caption: s.description || `${s.name} - Quality items & fast delivery`,
        category: s.category || "all",
        href: `/shop?store=${s.id}`,
      }));
    }
    return [
      {
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80",
        text: "Fresh & Fast Commerce",
        caption: "Connect with top verified merchants and on-demand courier delivery",
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


  const handleUseMyLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDeliveryLocation(`Lat: ${pos.coords.latitude.toFixed(4)}, Long: ${pos.coords.longitude.toFixed(4)}`);
          setIsLocating(false);
        },
        () => {
          setDeliveryLocation("Current Location");
          setIsLocating(false);
        }
      );
    } else {
      setIsLocating(false);
    }
  };

  // Dynamic Categories derived from backend stores
  const categories = useMemo(() => {
    const defaultCats = [
      { id: "all", label: "All Stores", icon: <ShoppingBag className="w-4 h-4 text-emerald-500" /> },
    ];
    const uniqueCategories = Array.from(new Set(stores.map((s: Store) => s.category).filter(Boolean)));
    const dynamicCats = uniqueCategories.map((cat) => {
      let icon = <ShoppingBag className="w-4 h-4 text-emerald-500" />;
      const c = String(cat).toLowerCase();
      if (c === "restaurant" || c === "food") icon = <UtensilsCrossed className="w-4 h-4 text-amber-500" />;
      else if (c === "supermarket" || c === "groceries") icon = <ShoppingBasket className="w-4 h-4 text-blue-500" />;
      else if (c === "pharmacy" || c === "health") icon = <Pill className="w-4 h-4 text-rose-500" />;
      else if (c === "express" || c === "grills") icon = <Flame className="w-4 h-4 text-orange-500" />;
      return {
        id: cat,
        label: String(cat).charAt(0).toUpperCase() + String(cat).slice(1),
        icon,
      };
    });
    return [...defaultCats, ...dynamicCats];
  }, [stores]);

  // Filter stores & deduplicate by store.id
  const filteredStores = useMemo(() => {
    return stores.filter((store: Store) => {
      const matchesCategory = selectedCategory === "all" || store.category === selectedCategory;
      const matchesSearch =
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (store.cuisineType && store.cuisineType.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (store.city && store.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (store.address && store.address.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [stores, selectedCategory, searchQuery]);

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
      {/* 1. VIBRANT EMERALD GREEN HERO BANNER (#087F5B) */}
      <section className="relative w-full bg-gradient-to-b from-[#099268] via-[#087F5B] to-[#066347] text-white overflow-hidden pb-28 sm:pb-36">
        
        {/* Multi-tone Ambient Lighting */}
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-white/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl pointer-events-none" />

        {/* INTEGRATED FULL HEADER INSIDE HERO BANNER */}
        <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between relative z-30">
          {/* Logo */}
          <NovoLogo variant="white" subtitle="Delivery Express" size="md" />

          {/* Desktop Navigation Links */}
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

          {/* Header Action Controls */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* Account / Login */}
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
          
          {/* Left Column */}
          <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left gap-5">
            
            {/* DYNAMIC SYNCHRONIZED HERO HEADLINE MATCHING BACKEND DATA */}
            <div className="flex flex-col gap-4 items-center lg:items-start">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-tight min-h-[100px] sm:min-h-[130px]">
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

              <Link
                href={currentSlide.href || `/shop?category=${currentSlide.category}`}
                className="w-fit px-8 py-3.5 rounded-2xl bg-white text-[#087F5B] hover:bg-emerald-50 text-sm font-black transition-all shadow-xl active:scale-95 flex items-center gap-2 cursor-pointer mt-2"
              >
                <span>Explore Store &amp; Order</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
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

        {/* ORGANIC SVG WAVE BOTTOM DIVIDER */}
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

      {/* 2. DYNAMIC CATEGORY BADGES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 w-full relative z-20">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat: any) => (
            <button
              key={String(cat.id)}
              onClick={() => setSelectedCategory(String(cat.id))}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === String(cat.id)
                  ? "bg-[#087F5B] text-white shadow-md ring-2 ring-[#087F5B]/50"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 3. TOP FEATURED MERCHANTS (DIRECT FROM BACKEND) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 w-full">
        <div className="p-6 sm:p-8 bg-gradient-to-r from-[#087F5B]/10 via-emerald-500/5 to-[#087F5B]/10 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-950/40 border border-[#087F5B]/20 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Top Featured Merchants
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Verified restaurants, supermarkets &amp; pharmacies near you.
              </p>
            </div>
            <Link
              href="/shop"
              className="text-xs font-black text-[#087F5B] dark:text-emerald-400 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>See All ({stores.length})</span>
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
              {filteredStores.map((store: Store) => (
                <Link
                  key={store.id}
                  href={`/shop?store=${store.id}`}
                  className="group flex flex-col items-center gap-3 shrink-0 cursor-pointer"
                >
                  <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full border-2 border-[#087F5B] p-1 bg-white dark:bg-slate-900 shadow-md group-hover:scale-105 group-hover:border-emerald-400 transition-all duration-300 overflow-hidden">
                    <img
                      src={store.logo}
                      alt={store.name}
                      className="w-full h-full object-cover rounded-full"
                    />
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

      {/* 4. POPULAR DISHES & PRODUCTS (DIRECT FROM BACKEND) */}
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


      {/* 6. PARTNER & CAREER OPPORTUNITIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 sm:mt-28 w-full">
        <div className="flex flex-col gap-14">
          <div className="text-center">
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Let&apos;s do it together
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-lg mx-auto font-medium">
              Join Novo as a rider partner, merchant business, or career professional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-8 pt-10">
            {/* Card 1: Become a rider */}
            <div className="group relative bg-white dark:bg-slate-900 rounded-3xl pt-16 px-8 pb-8 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-2xl transition-all duration-300 flex flex-col justify-between items-center text-center gap-6">
              <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-900 shadow-xl group-hover:scale-105 transition-transform duration-300 bg-amber-100 shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=600&q=80"
                  alt="Become a rider"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col items-center gap-3 mt-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Become a rider
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-xs">
                  Enjoy flexibility, freedom and competitive earnings by delivering through Novo.
                </p>
              </div>

              <Link href="/rider">
                <button className="px-8 py-3 rounded-full bg-[#087F5B] hover:bg-[#065f44] text-white text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md">
                  <span>Register Here</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>

            {/* Card 2: Register your business */}
            <div className="group relative bg-white dark:bg-slate-900 rounded-3xl pt-16 px-8 pb-8 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-2xl transition-all duration-300 flex flex-col justify-between items-center text-center gap-6">
              <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-900 shadow-xl group-hover:scale-105 transition-transform duration-300 bg-emerald-100 shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80"
                  alt="Register your business"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col items-center gap-3 mt-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Register your business
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-xs">
                  Grow with Novo! Our delivery network and user base can help you boost sales and unlock new opportunities!
                </p>
              </div>

              <Link href="/merchant/register">
                <button className="px-8 py-3 rounded-full bg-[#087F5B] hover:bg-[#065f44] text-white text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md">
                  <span>Register Here</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>

            {/* Card 3: Careers */}
            <div className="group relative bg-white dark:bg-slate-900 rounded-3xl pt-16 px-8 pb-8 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-2xl transition-all duration-300 flex flex-col justify-between items-center text-center gap-6">
              <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-900 shadow-xl group-hover:scale-105 transition-transform duration-300 bg-purple-100 shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80"
                  alt="Careers"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col items-center gap-3 mt-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Careers
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-xs">
                  Ready for an exciting new challenge? Join our ambitious, passionate team building the future of commerce!
                </p>
              </div>

              <Link href="/auth">
                <button className="px-8 py-3 rounded-full bg-[#087F5B] hover:bg-[#065f44] text-white text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md">
                  <span>Join Us</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

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
            {selectedProduct.options && selectedProduct.options.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Select Add-ons
                </span>
                {selectedProduct.options.map((opt: any) => (
                  <label
                    key={opt.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <span>{opt.name}</span>
                    <span className="text-[#087F5B] font-bold">+₦{opt.price}</span>
                  </label>
                ))}
              </div>
            )}
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

