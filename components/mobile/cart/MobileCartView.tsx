"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";

export function MobileCartView() {
  const router = useRouter();
  const { cart, updateCartQuantity, removeFromCart, clearCart, cartSubtotal, cartDeliveryFee, cartTotal } =
    usePlatform();

  if (cart.length === 0) {
    return (
      <div className="md:hidden flex flex-col items-center justify-center min-h-[70vh] p-6 text-center gap-4 bg-[#F7FAF8] dark:bg-slate-950">
        <div className="w-20 h-20 rounded-full bg-[#E8F7EF] dark:bg-slate-800 flex items-center justify-center text-[#008A4C]">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-lg font-black text-[#101714] dark:text-white">Your Cart is Empty</h2>
        <p className="text-xs text-[#66736D] dark:text-slate-400 max-w-xs leading-relaxed font-medium">
          Looks like you haven&apos;t added any food or products to your cart yet.
        </p>
        <button
          onClick={() => router.push("/shop")}
          className="px-6 py-3 rounded-2xl bg-[#008A4C] hover:bg-[#006B3C] text-white text-xs font-black shadow-md transition-colors"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="md:hidden flex flex-col w-full min-h-screen bg-[#F7FAF8] dark:bg-slate-950 text-[#101714] dark:text-slate-100 pb-28">
      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-[#E3EAE6] dark:border-slate-800 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-full bg-[#F7FAF8] dark:bg-slate-800 text-[#101714] dark:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-black text-[#101714] dark:text-white">Your Cart ({cart.length})</h1>
        </div>

        <button
          onClick={clearCart}
          className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
        >
          Clear All
        </button>
      </div>

      {/* Cart Items List */}
      <div className="p-4 flex flex-col gap-3">
        {cart.map((item) => (
          <div
            key={item.product.id}
            className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-[#E3EAE6] dark:border-slate-800 shadow-xs"
          >
            <img
              src={item.product.image}
              alt={item.product.name}
              className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0"
            />

            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <h4 className="text-xs font-black text-[#101714] dark:text-white truncate">
                {item.product.name}
              </h4>
              <span className="text-xs font-bold text-[#008A4C]">
                ₦{item.product.price.toLocaleString()}
              </span>
              {item.selectedOptions && item.selectedOptions.length > 0 && (
                <span className="text-[10px] text-[#66736D] line-clamp-1">
                  + {item.selectedOptions.map((o) => o.name).join(", ")}
                </span>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-[#F7FAF8] dark:bg-slate-800 p-1 rounded-xl border border-[#E3EAE6]">
                <button
                  onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                  className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-[#101714] font-bold shadow-xs cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                  className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-[#101714] font-bold shadow-xs cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <button
                onClick={() => removeFromCart(item.product.id)}
                className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bill Breakdown */}
      <div className="px-4 mt-2">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#E3EAE6] dark:border-slate-800 flex flex-col gap-2.5 text-xs font-semibold text-[#101714] dark:text-slate-200">
          <div className="flex items-center justify-between text-[#66736D]">
            <span>Subtotal</span>
            <span className="font-bold text-[#101714] dark:text-white">₦{cartSubtotal.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-[#66736D]">
            <span>Delivery Fee</span>
            <span className="font-bold text-[#101714] dark:text-white">₦{cartDeliveryFee.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[#E3EAE6] dark:border-slate-800 text-sm font-black">
            <span>Total</span>
            <span className="text-[#008A4C]">₦{cartTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Checkout CTA */}
      <div className="fixed bottom-14 left-0 right-0 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-[#E3EAE6] dark:border-slate-800 z-30">
        <button
          onClick={() => router.push("/checkout")}
          className="w-full py-3.5 rounded-2xl bg-[#008A4C] hover:bg-[#006B3C] text-white font-extrabold text-xs flex items-center justify-between px-5 shadow-lg cursor-pointer transition-colors"
        >
          <span>Proceed to Checkout</span>
          <div className="flex items-center gap-1">
            <span>₦{cartTotal.toLocaleString()}</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      </div>
    </div>
  );
}
