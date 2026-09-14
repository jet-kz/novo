"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Star, Clock, Bike, ShieldCheck, Search, ArrowLeft, Store as StoreIcon } from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";
import { RestaurantCard } from "@/components/cards/RestaurantCard";
import { ProductCard } from "@/components/cards/ProductCard";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Product } from "@/types";

import { MobileStoreView } from "@/components/mobile/store/MobileStoreView";

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const storeParam = searchParams.get("store") || "";
  const { stores, products, addToCart } = usePlatform();

  const selectedStore = storeParam
    ? stores.find(
        (s) =>
          s.id === storeParam ||
          s.slug === storeParam ||
          (s.name && s.name.toLowerCase() === storeParam.toLowerCase())
      )
    : null;

  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // If a specific store is selected
  if (selectedStore) {
    const storeProducts = products.filter((p) => p.storeId === selectedStore.id);
    const categories = ["All", ...Array.from(new Set(storeProducts.map((p) => p.category)))];

    const filteredProducts = storeProducts.filter((p) => {
      const matchesCat = activeCategory === "All" || p.category === activeCategory;
      const matchesQuery =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesQuery;
    });

    return (
      <>
        <MobileStoreView />
        <div className="hidden md:flex flex-col w-full min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
        {/* Store Cover Header */}
        <div className="relative w-full h-56 sm:h-72 bg-slate-800 overflow-hidden">
          <img src={selectedStore.banner} alt={selectedStore.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

          {/* Back Button */}
          <button
            onClick={() => router.push("/shop")}
            className="absolute top-4 left-4 sm:left-8 px-3.5 py-2 rounded-2xl bg-slate-950/60 hover:bg-slate-950/80 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Merchants ({stores.length})</span>
          </button>

          <div className="absolute bottom-6 left-4 sm:left-8 right-4 sm:right-8 flex items-end gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border-4 border-white dark:border-slate-900 overflow-hidden bg-white shadow-xl shrink-0">
              <img src={selectedStore.logo} alt={selectedStore.name} className="w-full h-full object-cover" />
            </div>

            <div className="flex flex-col text-white gap-1 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight">{selectedStore.name}</h1>
                {selectedStore.isVerified && <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 line-clamp-1">{selectedStore.description}</p>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-300 mt-1">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{selectedStore.rating} ({selectedStore.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>{selectedStore.deliveryTime}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Bike className="w-4 h-4 text-indigo-400" />
                  <span>₦{selectedStore.deliveryFee} delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Navigation & Search */}
        <div className="sticky top-16 z-30 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                    activeCategory === cat
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search within Menu */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search store menu..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium outline-none text-slate-900 dark:text-slate-100 border border-transparent focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Product Catalog Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 w-full">
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500 font-medium">
              {storeProducts.length === 0
                ? `No menu items have been added to ${selectedStore.name} yet. Check back soon!`
                : `No products found matching "${searchQuery}".`}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map((prod) => (
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
                      <span className="text-emerald-600 font-bold">+₦{opt.price}</span>
                    </label>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
                <span className="text-lg font-black text-slate-900 dark:text-slate-100">
                  ₦{selectedProduct.price.toLocaleString()}
                </span>
                <Button
                  variant="primary"
                  onClick={() => {
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                >
                  Add to Cart
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  );
  }

  // DEFAULT VIEW: All Stores & Merchants ({stores.length})
  const filteredStores = stores.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <MobileStoreView />
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full min-h-screen">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              All Verified Merchants ({stores.length})
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Explore all registered restaurants, supermarkets, and pharmacies on Novo.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all merchants..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 text-xs font-medium outline-none text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 shadow-xs"
            />
          </div>
        </div>

        {/* Stores Grid */}
        {filteredStores.length === 0 ? (
          <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col items-center gap-3">
            <StoreIcon className="w-12 h-12 text-slate-400" />
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">No Merchants Found</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              {stores.length === 0
                ? "No merchants have registered on the backend yet."
                : `No store matching "${searchQuery}".`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStores.map((st) => (
              <RestaurantCard key={st.id} store={st} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading Stores...</div>}>
      <ShopContent />
    </Suspense>
  );
}
