"use client";

import React from "react";
import { usePlatform } from "@/store/PlatformContext";
import { OrderCard } from "@/components/cards/OrderCard";

export default function RiderHistoryPage() {
  const { orders, riderProfile, currentUser } = usePlatform();
  const me = riderProfile.id || currentUser.id;
  const completedDeliveries = orders.filter((o) => o.status === "delivered" && o.riderId === me);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full min-h-screen flex flex-col gap-6">
      <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Delivery Job History</h1>

      {completedDeliveries.length === 0 && (
        <p className="p-10 text-center text-xs font-medium text-slate-400 bg-white dark:bg-slate-900 rounded-3xl">
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
