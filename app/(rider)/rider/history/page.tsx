"use client";

import React from "react";
import { usePlatform } from "@/store/PlatformContext";
import { OrderCard } from "@/components/cards/OrderCard";

export default function RiderHistoryPage() {
  const { orders, riderProfile, currentUser } = usePlatform();
  const me = riderProfile.id || currentUser.id;
  const completedDeliveries = orders.filter((o) => o.status === "delivered" && o.riderId === me);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 w-full flex flex-col gap-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">History</h1>
        <p className="text-sm text-slate-500 mt-1">{completedDeliveries.length} completed deliver{completedDeliveries.length === 1 ? "y" : "ies"}</p>
      </div>

      {completedDeliveries.length === 0 && (
        <p className="py-12 text-center text-sm text-slate-500">
          Completed deliveries will appear here.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {completedDeliveries.map((ord) => (
          <OrderCard key={ord.id} order={ord} userRole="rider" />
        ))}
      </div>
    </div>
  );
}
