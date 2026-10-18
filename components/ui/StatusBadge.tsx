"use client";

import React from "react";
import { OrderStatus } from "@/types";
import { ORDER_STATUS_LABELS } from "@/utils/orderStatus";

interface StatusBadgeProps {
  status: OrderStatus | "active" | "pending" | "suspended" | "verified" | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getBadgeConfig = (statusStr: string) => {
    switch (statusStr) {
      case "pending_merchant":
      case "pending":
        return {
          label: "Awaiting Store",
          className: "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300",
          dot: "bg-amber-500",
        };
      case "accepted":
      case "confirmed":
      case "preparing":
        return {
          label: statusStr === "preparing" ? "Preparing" : "Accepted",
          className: "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300",
          dot: "bg-blue-500",
        };
      case "ready_for_pickup":
        return {
          label: "Ready for Pickup",
          className: "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300",
          dot: "bg-indigo-500",
        };
      case "rider_assigned":
      case "picked_up":
      case "out_for_delivery":
        return {
          label: statusStr === "rider_assigned" ? "Rider Assigned" : "Out for Delivery",
          className: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300",
          dot: "bg-emerald-500",
        };
      case "delivered":
      case "active":
      case "verified":
        return {
          label: statusStr === "delivered" ? "Delivered" : statusStr === "active" ? "Active" : "Verified",
          className: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400",
          dot: "bg-emerald-500",
        };
      case "cancelled":
      case "suspended":
        return {
          label: statusStr === "cancelled" ? "Cancelled" : "Suspended",
          className: "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300",
          dot: "bg-rose-500",
        };
      default:
        return {
          label: ORDER_STATUS_LABELS[statusStr as OrderStatus] || statusStr.replace(/_/g, " "),
          className: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
          dot: "bg-slate-400",
        };
    }
  };

  const config = getBadgeConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-extrabold ${config.className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};
