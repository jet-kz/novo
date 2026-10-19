"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  MapPin,
  Clock,
  ShieldCheck,
  Store as StoreIcon,
} from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";
import { CartTotals, useCartPricing } from "@/components/cart/CartTotals";
import { cartLineKey, optionsLabel, optionsUnitPrice } from "@/utils/options";

export function CartDrawer() {
  const router = useRouter();
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    userLocationAddress,
    stores,
  } = usePlatform();

  const pricing = useCartPricing(isCartOpen);

  if (!isCartOpen) return null;

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Get current store info from first cart item
  const currentStoreId = cart[0]?.product?.storeId || (cart[0]?.product as any)?.store_id;
  const currentStore = stores.find((s) => s.id === currentStoreId);

  const handleCheckout = () => {
    setIsCartOpen(false);
    router.push("/checkout");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed inset-x-0 bottom-0 md:inset-x-auto md:inset-y-0 md:right-0 max-w-full flex md:pl-10">
        {/* Bottom sheet on mobile, slide-over panel on desktop */}
        <div className="w-screen md:max-w-md max-h-[88vh] md:max-h-none bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden rounded-t-3xl md:rounded-none transform transition-transform animate-in slide-in-from-bottom md:slide-in-from-right duration-300 md:border-l border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom,0px)]">
          {/* Grab handle (mobile) */}
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close basket"
            className="md:hidden w-full pt-2.5 pb-1 flex justify-center cursor-pointer bg-slate-50/80 dark:bg-slate-950/80"
          >
            <span className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
          </button>
          
          {/* 1. DRAWER HEADER */}
          <div className="p-4 border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#087F5B]/10 flex items-center justify-center text-[#087F5B] dark:text-emerald-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Your Delivery Basket</span>
                  {totalItems > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-[#087F5B] text-white">
                      {totalItems} {totalItems === 1 ? "item" : "items"}
                    </span>
                  )}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {currentStore ? currentStore.name : "Novo Order Express"}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 2. DELIVERY LOCATION BANNER */}
          <div className="px-4 py-2.5 bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-[#087F5B] dark:text-emerald-400 shrink-0" />
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                {userLocationAddress || "Warri, Delta State"}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-extrabold text-[#087F5B] dark:text-emerald-400 shrink-0">
              <Clock className="w-3 h-3" />
              <span>15 - 30 MINS</span>
            </div>
          </div>

          {/* 3. CART CONTENT ITEMS */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <ShoppingBag className="w-8 h-8 stroke-1" />
                </div>
                <h3 className="text-base font-black text-slate-800 dark:text-slate-200">
                  Your basket is empty
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[240px]">
                  Explore nearby restaurants, supermarkets &amp; pharmacies to add items to your cart.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-2 px-5 py-2.5 bg-[#087F5B] text-white text-xs font-black rounded-lg hover:bg-[#066749] transition-colors shadow-xs"
                >
                  Browse Stores Near You
                </button>
              </div>
            ) : (
              <>
                {/* Store Header Card */}
                {currentStore && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-[#087F5B] dark:text-emerald-400">
                        <StoreIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 dark:text-white">
                          {currentStore.name}
                        </p>
                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          {((currentStore as any).storeType || (currentStore as any).store_type || "RESTAURANT").toUpperCase()} • {currentStore.city || "Delta State"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={clearCart}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                )}

                {/* Items List */}
                <div className="space-y-3">
                  {cart.map((item) => {
                    const optionsTotal = optionsUnitPrice(item.selectedOptions);
                    const itemPrice = (item.product.price + optionsTotal) * item.quantity;

                    return (
                      <div
                        key={cartLineKey(item)}
                        className="p-3 bg-white dark:bg-slate-800/90 rounded-xl flex gap-3 shadow-2xs"
                      >
                        {/* Image */}
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0">
                          <Image
                            src={
                              item.product.image ||
                              (item.product as any).imageUrl ||
                              (item.product as any).image_url ||
                              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80"
                            }
                            alt={item.product.name}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>

                        {/* Item Info */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                                {item.product.name}
                              </h4>
                              <button
                                onClick={() => removeFromCart(cartLineKey(item))}
                                className="text-slate-400 hover:text-rose-500 transition-colors p-0.5 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {item.selectedOptions && item.selectedOptions.length > 0 && (
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                {optionsLabel(item.selectedOptions)}
                              </p>
                            )}
                          </div>

                          {/* Price & Stepper */}
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs font-black text-[#087F5B] dark:text-emerald-400">
                              ₦{itemPrice.toLocaleString()}
                            </span>

                            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
                              <button
                                onClick={() => updateCartQuantity(cartLineKey(item), item.quantity - 1)}
                                className="w-5 h-5 rounded flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-black px-1 text-slate-900 dark:text-white">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateCartQuantity(cartLineKey(item), item.quantity + 1)}
                                className="w-5 h-5 rounded flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* 4. DRAWER FOOTER / BILL SUMMARY */}
          {cart.length > 0 && (
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 space-y-3">
              <CartTotals pricing={pricing} />

              <button
                onClick={handleCheckout}
                className="w-full py-3.5 bg-[#087F5B] hover:bg-[#066749] text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-98 shadow-md cursor-pointer"
              >
                <span>Proceed to Checkout • ₦{Math.round(pricing.total).toLocaleString()}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Protected by Novo Secure Payment Escrow</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
