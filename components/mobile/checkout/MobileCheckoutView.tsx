"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Banknote,
  CheckCircle2,
  Plus,
  ShieldCheck,
  Building,
} from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";
import { apiService } from "@/services/api";

export function MobileCheckoutView() {
  const router = useRouter();
  const { cart, cartSubtotal, cartDeliveryFee, cartTotal, currentUser, placeOrder } = usePlatform();

  const [deliveryAddress, setDeliveryAddress] = useState(
    currentUser?.address || "12 Adeola street, Victoria Island, Lagos"
  );
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash" | "transfer">("card");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddressText, setNewAddressText] = useState("");

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    try {
      // 1. Local platform context place order
      const newOrder = placeOrder(deliveryAddress, paymentMethod, 0);

      // 2. Call backend order API if needed
      try {
        await apiService.createOrder({
          store_id: newOrder.storeId,
          delivery_address: deliveryAddress,
          payment_method: paymentMethod,
          items: cart.map((c) => ({ product_id: c.product.id, quantity: c.quantity })),
          total_amount: cartTotal,
        });
      } catch (e) {
        console.warn("Backend order notification:", e);
      }

      // Redirect to Order Tracking page (Screen 10)
      router.push(`/orders?track=${newOrder.id}`);
    } catch (e) {
      console.error("Order placement failed:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNewAddress = () => {
    if (newAddressText.trim()) {
      setDeliveryAddress(newAddressText);
      setShowAddressModal(false);
      setNewAddressText("");
    }
  };

  return (
    <div className="md:hidden flex flex-col w-full min-h-screen bg-[#F7FAF8] dark:bg-slate-950 text-[#101714] dark:text-slate-100 pb-28">
      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-[#E3EAE6] dark:border-slate-800 px-4 py-3 flex items-center gap-3 shadow-xs">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-full bg-[#F7FAF8] dark:bg-slate-800 text-[#101714] dark:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-sm font-black text-[#101714] dark:text-white">Checkout</h1>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* 1. DELIVERY ADDRESS SECTION */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#E3EAE6] dark:border-slate-800 flex flex-col gap-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#101714] dark:text-white uppercase tracking-wider">
              Delivery Address
            </span>
            <button
              onClick={() => setShowAddressModal(true)}
              className="text-[11px] font-bold text-[#008A4C] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add New Address</span>
            </button>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F7FAF8] dark:bg-slate-800/60 border border-[#E3EAE6]">
            <div className="w-8 h-8 rounded-full bg-[#E8F7EF] dark:bg-slate-700 flex items-center justify-center text-[#008A4C] shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-[#101714] dark:text-white">Home</span>
              <span className="text-[11px] text-[#66736D] dark:text-slate-400 leading-snug">
                {deliveryAddress}
              </span>
            </div>
          </div>
        </div>

        {/* 2. PAYMENT METHOD SECTION */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#E3EAE6] dark:border-slate-800 flex flex-col gap-2.5 shadow-xs">
          <span className="text-xs font-black text-[#101714] dark:text-white uppercase tracking-wider">
            Payment Method
          </span>

          <div className="flex flex-col gap-2">
            {[
              { id: "card", label: "Card (**** 4242)", icon: CreditCard },
              { id: "cash", label: "Pay with Cash", icon: Banknote },
              { id: "transfer", label: "Bank Transfer / Apple Pay", icon: Building },
            ].map((pm) => {
              const Icon = pm.icon;
              const isSelected = paymentMethod === pm.id;
              return (
                <label
                  key={pm.id}
                  onClick={() => setPaymentMethod(pm.id as any)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#E8F7EF] border-[#008A4C] text-[#008A4C] dark:bg-slate-800"
                      : "bg-[#F7FAF8] dark:bg-slate-800/40 border-[#E3EAE6] text-[#101714]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-bold">{pm.label}</span>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-[#008A4C]" />}
                </label>
              );
            })}
          </div>
        </div>

        {/* 3. ORDER SUMMARY */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#E3EAE6] dark:border-slate-800 flex flex-col gap-2.5 shadow-xs text-xs font-semibold">
          <span className="text-xs font-black text-[#101714] dark:text-white uppercase tracking-wider">
            Order Summary
          </span>

          <div className="flex items-center justify-between text-[#66736D]">
            <span>Items ({cart.length})</span>
            <span className="font-bold text-[#101714] dark:text-white">₦{cartSubtotal.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between text-[#66736D]">
            <span>Delivery Fee</span>
            <span className="font-bold text-[#101714] dark:text-white">₦{cartDeliveryFee.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#E3EAE6] dark:border-slate-800 text-sm font-black text-[#101714] dark:text-white">
            <span>Total</span>
            <span className="text-[#008A4C]">₦{cartTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Sticky Place Order CTA */}
      <div className="fixed bottom-14 left-0 right-0 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-[#E3EAE6] dark:border-slate-800 z-30">
        <button
          onClick={handlePlaceOrder}
          disabled={isSubmitting || cart.length === 0}
          className="w-full py-3.5 rounded-2xl bg-[#008A4C] hover:bg-[#006B3C] disabled:opacity-50 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-colors"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{isSubmitting ? "Placing Order..." : "Place Order"}</span>
        </button>
      </div>

      {/* Add New Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 flex flex-col gap-4 shadow-2xl">
            <h3 className="text-sm font-black text-[#101714] dark:text-white">Add Delivery Address</h3>
            <textarea
              value={newAddressText}
              onChange={(e) => setNewAddressText(e.target.value)}
              placeholder="Enter street name, house number, area..."
              className="w-full h-24 p-3 rounded-xl bg-[#F7FAF8] dark:bg-slate-800 text-xs font-semibold border border-[#E3EAE6] outline-none"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddressModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#E3EAE6] text-xs font-bold text-[#66736D]"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNewAddress}
                className="flex-1 py-2.5 rounded-xl bg-[#008A4C] text-white text-xs font-bold"
              >
                Save Address
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
