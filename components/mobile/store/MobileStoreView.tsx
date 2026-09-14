"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  Share2,
  Star,
  Clock,
  Bike,
  ShieldCheck,
  Search,
  Plus,
  Minus,
  Check,
  X,
  ShoppingBag,
} from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";
import { Product, Store } from "@/types";

export function MobileStoreView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeIdParam = searchParams.get("store") || "";
  const { stores, products, addToCart, favorites, toggleFavorite } = usePlatform();

  const [activeTab, setActiveTab] = useState<"menu" | "info" | "reviews">("menu");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Selected Options & Add-ons state for Product Sheet
  const [selectedOptions, setSelectedOptions] = useState<{ id: string; name: string; price: number }[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState("");

  const store: Store =
    stores.find(
      (s) =>
        s.id === storeIdParam ||
        s.slug === storeIdParam ||
        (s.name && s.name.toLowerCase() === storeIdParam.toLowerCase())
    ) || stores[0];

  if (!store) {
    return (
      <div className="md:hidden flex flex-col items-center justify-center min-h-[60vh] gap-3 p-6 text-center">
        <h2 className="text-lg font-black text-[#101714]">Store Not Found</h2>
        <p className="text-xs text-[#66736D]">The merchant you requested could not be loaded.</p>
        <button
          onClick={() => router.push("/shop")}
          className="px-4 py-2 rounded-xl bg-[#008A4C] text-white text-xs font-bold"
        >
          View All Stores
        </button>
      </div>
    );
  }

  const isFav = favorites.includes(store.id);
  const storeProducts = products.filter((p) => p.storeId === store.id || (p as any).store_id === store.id);
  const categories = ["All", ...Array.from(new Set(storeProducts.map((p) => p.category)))];

  const filteredProducts = storeProducts.filter((p) => {
    const matchesCat = activeCategory === "All" || p.category === activeCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleOpenProductSheet = (prod: Product) => {
    setSelectedProduct(prod);
    setQuantity(1);
    setSelectedOptions([]);
    setSpecialInstructions("");
  };

  const handleAddToCartFromSheet = () => {
    if (selectedProduct) {
      addToCart(selectedProduct, quantity, selectedOptions, specialInstructions);
      setSelectedProduct(null);
    }
  };

  const toggleOption = (opt: { id: string; name: string; price: number }) => {
    setSelectedOptions((prev) =>
      prev.some((o) => o.id === opt.id)
        ? prev.filter((o) => o.id !== opt.id)
        : [...prev, opt]
    );
  };

  const addOnsTotal = selectedOptions.reduce((sum, o) => sum + o.price, 0);
  const itemTotal = selectedProduct ? (selectedProduct.price + addOnsTotal) * quantity : 0;

  return (
    <div className="md:hidden flex flex-col w-full min-h-screen bg-[#F7FAF8] dark:bg-slate-950 text-[#101714] dark:text-slate-100 pb-24">
      {/* 1. STORE COVER BANNER (Screen 6 reference) */}
      <div className="relative w-full h-52 bg-slate-900 overflow-hidden">
        <img src={store.banner} alt={store.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Top Floating Actions */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <button
            onClick={() => router.push("/shop")}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white flex items-center justify-center transition-colors cursor-pointer shadow-md"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFavorite(store.id)}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white flex items-center justify-center transition-colors cursor-pointer shadow-md"
            >
              <Heart className={`w-5 h-5 ${isFav ? "fill-rose-500 text-rose-500" : "text-white"}`} />
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: store.name, url: window.location.href });
                }
              }}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white flex items-center justify-center transition-colors cursor-pointer shadow-md"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Store Logo & Details */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3 z-10">
          <img
            src={store.logo}
            alt={store.name}
            className="w-16 h-16 rounded-2xl border-2 border-white object-cover bg-white shadow-lg shrink-0"
          />
          <div className="flex flex-col text-white gap-0.5 min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-black truncate">{store.name}</h1>
              {store.isVerified && <ShieldCheck className="w-4 h-4 text-[#008A4C] shrink-0" />}
            </div>
            <p className="text-[11px] text-slate-200 truncate font-medium">{store.description}</p>
            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-200 mt-1">
              <span className="flex items-center gap-0.5 text-amber-400">
                <Star className="w-3 h-3 fill-amber-400" />
                {store.rating} ({store.reviewCount} reviews)
              </span>
              <span className="flex items-center gap-0.5 text-emerald-300">
                <Clock className="w-3 h-3" />
                {store.deliveryTime}
              </span>
              <span className="flex items-center gap-0.5 text-indigo-300">
                <Bike className="w-3 h-3" />
                ₦{store.deliveryFee} delivery
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TABS & CATEGORIES */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-[#E3EAE6] dark:border-slate-800 shadow-xs">
        {/* Main Tabs (Menu, Info, Reviews) */}
        <div className="flex items-center border-b border-[#E3EAE6] dark:border-slate-800 px-4">
          {(["menu", "info", "reviews"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-xs font-black capitalize transition-colors text-center cursor-pointer border-b-2 ${
                activeTab === tab
                  ? "border-[#008A4C] text-[#008A4C]"
                  : "border-transparent text-[#66736D] dark:text-slate-400"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Category Pills & Search (When Menu tab active) */}
        {activeTab === "menu" && (
          <div className="p-3 flex flex-col gap-2.5">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in store menu..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F7FAF8] dark:bg-slate-800 text-xs font-semibold text-[#101714] dark:text-white outline-none border border-[#E3EAE6] dark:border-slate-700"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    activeCategory === cat
                      ? "bg-[#008A4C] text-white shadow-xs"
                      : "bg-[#E8F7EF] text-[#008A4C] dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. MENU CONTENT */}
      {activeTab === "menu" && (
        <div className="p-4 flex flex-col gap-3">
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-[#E3EAE6] text-[#66736D] text-xs font-medium">
              No products found matching your search.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => handleOpenProductSheet(prod)}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-[#E3EAE6] dark:border-slate-800 shadow-xs cursor-pointer hover:border-[#008A4C] transition-all"
                >
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <h4 className="text-xs font-black text-[#101714] dark:text-white truncate">
                      {prod.name}
                    </h4>
                    <p className="text-[10px] text-[#66736D] dark:text-slate-400 line-clamp-2 font-medium">
                      {prod.description}
                    </p>
                    <span className="text-xs font-black text-[#008A4C] mt-1">
                      ₦{prod.price.toLocaleString()}
                    </span>
                  </div>

                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(prod);
                      }}
                      className="absolute bottom-1 right-1 w-6 h-6 rounded-lg bg-[#008A4C] text-white flex items-center justify-center shadow-md cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. INFO TAB */}
      {activeTab === "info" && (
        <div className="p-4 flex flex-col gap-4 text-xs font-medium text-[#101714] dark:text-slate-200">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#E3EAE6] flex flex-col gap-2">
            <h3 className="font-black text-sm">About {store.name}</h3>
            <p className="text-[#66736D] leading-relaxed">{store.description}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#E3EAE6] flex flex-col gap-2">
            <h3 className="font-black text-sm">Merchant Address</h3>
            <p className="text-[#66736D]">{store.address}</p>
          </div>
        </div>
      )}

      {/* 5. REVIEWS TAB */}
      {activeTab === "reviews" && (
        <div className="p-4 flex flex-col gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#E3EAE6] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-2xl font-black text-[#101714] dark:text-white">{store.rating}</span>
              <span className="text-[10px] text-[#66736D]">Based on {store.reviewCount} reviews</span>
            </div>
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. PRODUCT DETAILS MODAL / BOTTOM SHEET (Screen 7 reference) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            {/* Header Close */}
            <div className="flex items-center justify-between pb-2 border-b border-[#E3EAE6]">
              <h3 className="text-sm font-black text-[#101714] dark:text-white">Product Details</h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 rounded-full bg-[#F7FAF8] dark:bg-slate-800 text-[#66736D] hover:text-[#101714]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product Image */}
            <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-slate-100">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-[#101714] dark:text-white">
                  {selectedProduct.name}
                </h2>
                <span className="text-sm font-black text-[#008A4C]">
                  ₦{selectedProduct.price.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-[#66736D] dark:text-slate-400 font-medium">
                {selectedProduct.description}
              </p>
            </div>

            {/* Add-ons List */}
            {selectedProduct.options && selectedProduct.options.length > 0 && (
              <div className="flex flex-col gap-2 pt-2 border-t border-[#E3EAE6]">
                <span className="text-xs font-black text-[#101714] dark:text-white uppercase tracking-wider">
                  Add-ons
                </span>
                {selectedProduct.options.map((opt: any) => {
                  const isChecked = selectedOptions.some((o) => o.id === opt.id);
                  return (
                    <label
                      key={opt.id}
                      onClick={() => toggleOption(opt)}
                      className="flex items-center justify-between p-3 rounded-xl border border-[#E3EAE6] dark:border-slate-800 cursor-pointer text-xs font-semibold bg-[#F7FAF8] dark:bg-slate-800/50"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                            isChecked ? "bg-[#008A4C] border-[#008A4C] text-white" : "border-slate-300"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-[#101714] dark:text-slate-200">{opt.name}</span>
                      </div>
                      <span className="text-[#008A4C] font-bold">+₦{opt.price}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center justify-between pt-2 border-t border-[#E3EAE6]">
              <span className="text-xs font-bold text-[#66736D]">Quantity</span>
              <div className="flex items-center gap-3 bg-[#F7FAF8] dark:bg-slate-800 p-1.5 rounded-xl border border-[#E3EAE6]">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-[#101714] font-bold shadow-xs cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-black w-4 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-[#101714] font-bold shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleAddToCartFromSheet}
              className="w-full py-3.5 rounded-2xl bg-[#008A4C] hover:bg-[#006B3C] text-white font-extrabold text-xs flex items-center justify-between px-5 shadow-md cursor-pointer transition-colors mt-2"
            >
              <span>Add to Cart</span>
              <span>₦{itemTotal.toLocaleString()}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
