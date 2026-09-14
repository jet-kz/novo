"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Clock,
  CheckCircle2,
  Bike,
  Store,
  MapPin,
  Phone,
  Star,
} from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";
import { OrderCard } from "@/components/cards/OrderCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { MobileOrdersView } from "@/components/mobile/orders/MobileOrdersView";

function OrderTrackerContent() {
  const searchParams = useSearchParams();
  const highlightOrderId = searchParams.get("orderId");
  const { orders, rateOrder, updateOrderStatus } = usePlatform();

  const currentOrder = orders.find((o) => o.id === highlightOrderId) || orders[0];

  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [storeRating, setStoreRating] = useState(5);
  const [riderRating, setRiderRating] = useState(5);
  const [comment, setComment] = useState("");

  const getStepIndex = (status: string) => {
    switch (status) {
      case "pending_merchant":
        return 1;
      case "preparing":
        return 2;
      case "ready_for_pickup":
      case "rider_assigned":
        return 3;
      case "picked_up":
        return 4;
      case "delivered":
        return 5;
      default:
        return 1;
    }
  };

  const handleSubmitRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentOrder) {
      rateOrder(currentOrder.id, storeRating, riderRating, comment);
      setRatingModalOpen(false);
    }
  };

  const currentStep = currentOrder ? getStepIndex(currentOrder.status) : 1;

  if (orders.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-4">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">No Active or Past Orders</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6 max-w-sm">
          Your order tracking and order history will appear here once you place your first order.
        </p>
        <Button variant="primary" onClick={() => window.location.href = "/shop"}>
          Explore Stores
        </Button>
      </div>
    );
  }

  return (
    <>
      <MobileOrdersView />
      <div className="hidden md:block max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Order Tracking & History
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Follow your delivery status in real-time or review past orders.
          </p>
        </div>
      </div>

      {currentOrder && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Active Tracker Main Panel */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    Order Reference
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                    {currentOrder.id}
                  </h3>
                </div>
                <StatusBadge status={currentOrder.status} />
              </div>

              {/* TIMELINE PROGRESS BAR */}
              <div className="flex items-center justify-between relative px-2 py-4">
                <div className="absolute top-1/2 left-6 right-6 h-1 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
                <div
                  className="absolute top-1/2 left-6 h-1 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-500"
                  style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
                />

                {[
                  { step: 1, label: "Placed", icon: <Clock className="w-4 h-4" /> },
                  { step: 2, label: "Preparing", icon: <Store className="w-4 h-4" /> },
                  { step: 3, label: "Rider Assigned", icon: <Bike className="w-4 h-4" /> },
                  { step: 4, label: "On The Way", icon: <MapPin className="w-4 h-4" /> },
                  { step: 5, label: "Delivered", icon: <CheckCircle2 className="w-4 h-4" /> },
                ].map((s) => (
                  <div key={s.step} className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        currentStep >= s.step
                          ? "bg-emerald-500 text-white shadow-md scale-110"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {s.icon}
                    </div>
                    <span
                      className={`text-[10px] font-bold tracking-wide ${
                        currentStep >= s.step
                          ? "text-slate-900 dark:text-slate-100"
                          : "text-slate-400"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* MOCK LIVE MAP ROUTE VISUALIZER */}
              <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />

                <div className="relative z-10 flex items-center justify-around w-full px-12">
                  <div className="flex flex-col items-center gap-1 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black shadow-lg">
                      <Store className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-white mt-1">{currentOrder.storeName}</span>
                  </div>

                  <div className="flex-1 flex flex-col items-center px-4">
                    <div className="w-full border-t-2 border-dashed border-emerald-500/60 relative flex items-center justify-center">
                      <div className="absolute -top-3 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg animate-bounce">
                        <Bike className="w-4 h-4" />
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold mt-3">
                      ETA ~{currentOrder.estimatedDeliveryMinutes} min
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-1 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black shadow-lg">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-white mt-1">Delivery Address</span>
                  </div>
                </div>
              </div>

              {/* RIDER ASSIGNED CARD */}
              {currentOrder.riderName && (
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentOrder.riderPhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"}
                      alt={currentOrder.riderName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500"
                    />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Assigned Courier
                      </span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                        {currentOrder.riderName}
                      </h4>
                      <p className="text-xs text-slate-500">{currentOrder.riderPhone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${currentOrder.riderPhone}`}
                      className="p-2.5 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}



              {currentOrder.status === "delivered" && (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setRatingModalOpen(true)}
                  leftIcon={<Star className="w-5 h-5 fill-amber-400 text-amber-400" />}
                >
                  Rate Delivery & Food Experience
                </Button>
              )}
            </div>
          </div>

          {/* Past Orders List */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
              Order History ({orders.length})
            </h3>
            {orders.map((ord) => (
              <OrderCard key={ord.id} order={ord} userRole="customer" />
            ))}
          </div>
        </div>
      )}

      {/* RATING MODAL */}
      <Modal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        title="Rate Your Experience"
      >
        <form onSubmit={handleSubmitRating} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Food & Restaurant Quality
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setStoreRating(star)}
                  className="p-1 cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= storeRating
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300 dark:text-slate-700"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Courier Delivery Speed & Courtesy
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRiderRating(star)}
                  className="p-1 cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= riderRating
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300 dark:text-slate-700"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Review Comment
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what you loved about your order!"
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-3 text-xs outline-none focus:border-emerald-500"
              rows={3}
            />
          </div>

          <Button variant="primary" type="submit" className="w-full">
            Submit Rating & Review
          </Button>
        </form>
      </Modal>
    </div>
    </>
  );
}

export default function OrderTrackerPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading Order Tracker...</div>}>
      <OrderTrackerContent />
    </Suspense>
  );
}
