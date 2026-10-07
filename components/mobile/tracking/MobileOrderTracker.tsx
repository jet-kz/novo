"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Phone,
  MessageSquare,
  Bike,
  ShieldCheck,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { Order } from "@/types";

interface MobileOrderTrackerProps {
  order: Order;
  onBack?: () => void;
}

export function MobileOrderTracker({ order, onBack }: MobileOrderTrackerProps) {
  const router = useRouter();
  const [etaMinutes, setEtaMinutes] = useState(order.estimatedDeliveryMinutes || 25);

  const formattedTime = order.createdAt
    ? new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Just now";

  // Dynamic status progression mapped to real order status
  const isPending = order.status === "pending_merchant" || order.status === "pending";
  const isPreparing = order.status === "preparing" || order.status === "confirmed";
  const isReadyOrRiderAssigned = order.status === "ready_for_pickup" || order.status === "rider_assigned";
  const isOutForDelivery = order.status === "out_for_delivery" || order.status === "picked_up";
  const isDelivered = order.status === "delivered";

  const getSubtext = () => {
    if (isPending) return "Waiting for store to confirm your order...";
    if (isPreparing) return "Store is preparing your order!";
    if (isReadyOrRiderAssigned) return "Courier assigned & heading to store!";
    if (isOutForDelivery) return "Courier is on the way to your delivery address!";
    if (isDelivered) return "Order delivered successfully!";
    return "Processing order...";
  };

  const statuses = [
    { key: "placed", label: "Order Placed", time: formattedTime, done: true },
    {
      key: "preparing",
      label: "Store Confirmed & Preparing",
      time: isPreparing || isReadyOrRiderAssigned || isOutForDelivery || isDelivered ? "Done" : "Pending",
      done: !isPending,
    },
    {
      key: "delivery",
      label: "Out For Delivery",
      time: isOutForDelivery || isDelivered ? "En route" : "Pending",
      done: isOutForDelivery || isDelivered,
    },
    {
      key: "arriving",
      label: "Delivered",
      time: isDelivered ? "Completed" : "Pending",
      done: isDelivered,
    },
  ];

  return (
    <div className="md:hidden flex flex-col w-full min-h-screen bg-[#F7FAF8] dark:bg-slate-950 text-[#101714] dark:text-slate-100 pb-24">
      {/* 1. TOP GREEN HEADER WITH MAP ROUTE ILLUSTRATION */}
      <div className="bg-[#008A4C] text-white p-5 rounded-b-3xl shadow-md flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => (onBack ? onBack() : router.push("/orders"))}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-black text-white">Tracking Order #{order.id}</h1>
          <div className="w-8" />
        </div>

        <div className="flex flex-col items-center text-center gap-1 my-2">
          <span className="text-xs font-bold text-emerald-100">{getSubtext()}</span>
          <h2 className="text-2xl font-black text-white">
            {isDelivered ? "Delivered" : `Estimated ETA ~${etaMinutes} min`}
          </h2>
        </div>

        {/* Visual Map Graphic Path */}
        <div className="relative w-full h-24 rounded-2xl bg-emerald-900/40 backdrop-blur-md border border-white/20 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white text-[#008A4C] flex items-center justify-center shadow-md animate-bounce">
              <Bike className="w-5 h-5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-white">{order.storeName || "Merchant Store"}</span>
              <span className="text-[10px] text-emerald-200 uppercase tracking-wider font-extrabold">
                {order.status.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Dotted Route Line */}
          <div className="flex-1 mx-3 border-b-2 border-dashed border-emerald-300/60" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-400 text-[#004D2C] flex items-center justify-center font-black text-xs shadow-md">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. TIMELINE STEPS PROGRESSION */}
      <div className="p-5 flex flex-col gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#E3EAE6] dark:border-slate-800 shadow-xs flex flex-col gap-4">
          <h3 className="text-xs font-black text-[#101714] dark:text-white uppercase tracking-wider">
            Live Order Status Timeline
          </h3>

          <div className="flex flex-col gap-4">
            {statuses.map((st, idx) => (
              <div key={st.key} className="flex items-start gap-3 relative">
                {/* Vertical Line Connector */}
                {idx < statuses.length - 1 && (
                  <div
                    className={`absolute left-2.5 top-6 bottom-0 w-0.5 ${
                      st.done ? "bg-[#008A4C]" : "bg-[#E3EAE6] dark:bg-slate-800"
                    }`}
                  />
                )}

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center z-10 shrink-0 ${
                    st.done
                      ? "bg-[#008A4C] text-white"
                      : "bg-[#E3EAE6] dark:bg-slate-800 text-slate-400"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>

                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span
                    className={`text-xs ${
                      st.done
                        ? "font-black text-[#101714] dark:text-white"
                        : "font-semibold text-[#66736D]"
                    }`}
                  >
                    {st.label}
                  </span>
                  <span className="text-[10px] font-bold text-[#66736D]">{st.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. REAL RIDER / COURIER CONTACT CARD */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#E3EAE6] dark:border-slate-800 shadow-xs flex items-center justify-between">
          {order.riderName ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-[#E3EAE6]">
                  <img
                    src={order.riderPhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"}
                    alt={order.riderName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-[#101714] dark:text-white">
                    {order.riderName}
                  </span>
                  <span className="text-[10px] font-semibold text-[#66736D]">Assigned Courier</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {order.riderPhone && (
                  <a
                    href={`tel:${order.riderPhone}`}
                    className="w-9 h-9 rounded-full bg-[#E8F7EF] text-[#008A4C] flex items-center justify-center hover:bg-[#008A4C] hover:text-white transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                <Bike className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-[#101714] dark:text-white">
                  Courier Assignment Pending
                </span>
                <span className="text-[10px] font-medium text-[#66736D]">
                  A rider will be assigned once the merchant accepts your order.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
