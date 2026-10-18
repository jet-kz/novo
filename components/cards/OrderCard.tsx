"use client";

import React from "react";
import { Order } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ShoppingBag, MapPin, User, Bike, ChevronRight } from "lucide-react";

interface OrderCardProps {
  order: Order;
  userRole?: "customer" | "merchant" | "rider" | "admin";
  onUpdateStatus?: (orderId: string, status: any) => void;
  onSelectOrder?: (order: Order) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  userRole = "customer",
  onUpdateStatus,
  onSelectOrder,
}) => {
  return (
    <div
      onClick={() => onSelectOrder && onSelectOrder(order)}
      className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col gap-4"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 dark:text-slate-100 text-sm">
                {order.id}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {order.storeName}
            </p>
          </div>
        </div>

        <StatusBadge status={order.status} />
      </div>

      {/* Items Preview */}
      <div className="flex flex-col gap-1.5 text-xs text-slate-600 dark:text-slate-400">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <span className="font-semibold">
              {item.quantity}x {item.product.name}
            </span>
            <span className="font-mono">₦{(item.product.price * item.quantity).toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Address & Customer details */}
      <div className="flex flex-col gap-1 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="truncate">{order.deliveryAddress}</span>
        </div>
        {userRole !== "customer" && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{order.customerName} ({order.customerPhone})</span>
          </div>
        )}
        {order.riderName && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <Bike className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>Rider: {order.riderName}</span>
          </div>
        )}
      </div>

      {/* Bottom Footer & Action Controls */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Total Paid
          </span>
          <p className="text-base font-black text-slate-900 dark:text-slate-100">
            ₦{order.total.toLocaleString()}
          </p>
        </div>

        {/* Dynamic Role Actions */}
        {userRole === "merchant" && onUpdateStatus && (
          <div className="flex items-center gap-2">
            {order.status === "pending_merchant" && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => onUpdateStatus(order.id, "preparing")}
              >
                Accept Order
              </Button>
            )}
            {order.status === "preparing" && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onUpdateStatus(order.id, "ready_for_pickup")}
              >
                Mark Ready
              </Button>
            )}
          </div>
        )}

        {userRole === "rider" && onUpdateStatus && (
          <div className="flex items-center gap-2">
            {order.status === "ready_for_pickup" && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => onUpdateStatus(order.id, "rider_assigned")}
              >
                Accept Job
              </Button>
            )}
            {order.status === "rider_assigned" && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onUpdateStatus(order.id, "picked_up")}
              >
                Picked Up
              </Button>
            )}
            {order.status === "picked_up" && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => onUpdateStatus(order.id, "delivered")}
              >
                Deliver Order
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
