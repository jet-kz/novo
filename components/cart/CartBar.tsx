"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { ShoppingBag, ChevronUp } from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";

const HIDDEN_ON = ["/checkout", "/cart", "/auth"];

/** Whether the floating basket bar is on screen (other floating UI moves out of its way). */
export function useCartBarVisible() {
  const pathname = usePathname();
  const { cart, isCartOpen } = usePlatform();
  const isPortal = ["/merchant", "/rider", "/admin"].some((p) => pathname.startsWith(p));
  const hiddenHere = HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  return cart.length > 0 && !isCartOpen && !isPortal && !hiddenHere;
}

/** Appears once something is in the basket; tapping it opens the cart sheet with checkout. */
export function CartBar() {
  const visible = useCartBarVisible();
  const { cart, cartSubtotal, setIsCartOpen, stores } = usePlatform();
  if (!visible) return null;

  const count = cart.reduce((acc, item) => acc + item.quantity, 0);
  const storeId = cart[0]?.product?.storeId || (cart[0]?.product as any)?.store_id;
  const storeName = stores.find((s) => s.id === storeId)?.name;

  return (
    <div className="fixed z-40 left-0 right-0 px-3 bottom-[calc(68px+env(safe-area-inset-bottom,0px))] md:bottom-6 md:left-auto md:right-6 md:px-0 md:w-96 pointer-events-none">
      <button
        type="button"
        onClick={() => setIsCartOpen(true)}
        className="pointer-events-auto w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#087F5B] hover:bg-[#066a4c] text-white shadow-xl shadow-emerald-900/25 active:scale-[0.98] transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-300"
        aria-label={`View basket, ${count} items`}
      >
        <span className="relative w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <ShoppingBag className="w-4.5 h-4.5" />
          <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-white text-[#087F5B] text-[10px] font-black flex items-center justify-center">
            {count}
          </span>
        </span>
        <span className="flex flex-col items-start min-w-0 flex-1 text-left">
          <span className="text-xs font-black">View basket</span>
          <span className="text-[11px] text-white/75 font-medium truncate max-w-full">
            {storeName || `${count} ${count === 1 ? "item" : "items"}`}
          </span>
        </span>
        <span className="text-sm font-black shrink-0">₦{cartSubtotal.toLocaleString()}</span>
        <ChevronUp className="w-4 h-4 shrink-0 opacity-80" />
      </button>
    </div>
  );
}
