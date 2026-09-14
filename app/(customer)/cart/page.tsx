"use client";

import React, { Suspense } from "react";
import { MobileCartView } from "@/components/mobile/cart/MobileCartView";
import { usePlatform } from "@/store/PlatformContext";
import Link from "next/link";
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";

function DesktopCartContent() {
  const { cart, updateCartQuantity, removeFromCart, clearCart, cartSubtotal, cartDeliveryFee, cartTotal } = usePlatform();

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center flex flex-col items-center gap-4">
        <ShoppingBag className="w-16 h-16 text-slate-400" />
        <h2 className="text-2xl font-bold">Your Cart is Empty</h2>
        <Link href="/shop" className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold">
          Explore Stores
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">Your Cart ({cart.length})</h1>
        <button onClick={clearCart} className="text-sm text-rose-600 font-bold hover:underline">
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {cart.map((item) => (
            <div key={item.product.id} className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <img src={item.product.image} alt={item.product.name} className="w-16 h-16 rounded-xl object-cover" />
                <div className="flex flex-col">
                  <h3 className="font-bold text-sm">{item.product.name}</h3>
                  <span className="text-emerald-600 font-bold text-sm">₦{item.product.price.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold">-</button>
                <span className="font-bold text-sm">{item.quantity}</span>
                <button onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold">+</button>
                <button onClick={() => removeFromCart(item.product.id)} className="p-2 text-rose-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col gap-4 h-fit">
          <h2 className="text-lg font-bold">Summary</h2>
          <div className="flex justify-between text-sm"><span>Subtotal</span><span>₦{cartSubtotal.toLocaleString()}</span></div>
          <div className="flex justify-between text-sm"><span>Delivery Fee</span><span>₦{cartDeliveryFee.toLocaleString()}</span></div>
          <div className="flex justify-between text-base font-black pt-3 border-t"><span>Total</span><span className="text-emerald-600">₦{cartTotal.toLocaleString()}</span></div>
          <Link href="/checkout" className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl text-center">Proceed to Checkout</Link>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <>
      <MobileCartView />
      <div className="hidden md:block">
        <Suspense fallback={<div className="p-12 text-center">Loading Cart...</div>}>
          <DesktopCartContent />
        </Suspense>
      </div>
    </>
  );
}
