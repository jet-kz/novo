"use client";

import React, { useState, useEffect } from "react";
import { usePlatform } from "@/store/PlatformContext";
import {
  isDone,
  isInKitchen,
  isNewOrder,
  isOnTheWay,
  isReady,
  merchantCanReject,
  merchantNextStep,
  statusLabel,
} from "@/utils/orderStatus";
import { apiService } from "@/services/api";
import { Order, OrderStatus } from "@/types";
import {
  ShoppingBag,
  Clock,
  MapPin,
  Phone,
  User,
  Check,
  X,
  AlertTriangle,
  ChevronRight,
  Eye,
  CreditCard,
  History,
} from "lucide-react";

export default function MerchantOrdersPage() {
  const { orders, merchantStore, updateOrderStatus, ordersError, ordersLoading } = usePlatform();

  const liveOrders = merchantStore ? orders.filter((o) => o.storeId === merchantStore.id) : [];
  const [filter, setFilter] = useState("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const selectedOrder = liveOrders.find((o) => o.id === selectedOrderId) || null;
  const setSelectedOrder = (o: Order | null) => setSelectedOrderId(o?.id || null);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedOrderId) return;
    let cancelled = false;
    apiService
      .getOrderHistory(selectedOrderId)
      .then((hist) => !cancelled && setOrderHistory(Array.isArray(hist) ? hist : []))
      .catch(() => !cancelled && setOrderHistory([]));
    return () => {
      cancelled = true;
    };
  }, [selectedOrderId, selectedOrder?.status]);

  const matchesFilter = (o: Order) => {
    switch (filter) {
      case "pending":
        return isNewOrder(o.status);
      case "preparing":
        return isInKitchen(o.status);
      case "ready":
        return isReady(o.status);
      case "out_for_delivery":
        return isOnTheWay(o.status);
      case "completed":
        return isDone(o.status);
      case "cancelled":
        return o.status === "cancelled";
      default:
        return true;
    }
  };
  const filteredOrders = liveOrders.filter(matchesFilter);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus, extra?: Record<string, any>) => {
    setBusyId(orderId);
    setActionError(null);
    try {
      await updateOrderStatus(orderId, newStatus, extra);
      return true;
    } catch (e: any) {
      setActionError(e?.message || "Could not update the order.");
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalOrder) return;
    const ok = await handleStatusChange(cancelModalOrder.id, "cancelled", { reason: cancelReason.trim() || "Declined by store" });
    if (ok) {
      setCancelModalOrder(null);
      setCancelReason("");
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 font-sans text-[#17201D] dark:text-slate-100">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Orders Queue</h1>
          <p className="text-xs font-semibold text-[#66736E] dark:text-slate-400 mt-1">
            Accept, prepare and dispatch customer orders in real-time
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${ordersError ? "bg-rose-500" : "bg-emerald-500 animate-pulse"}`} />
          <span className="text-xs font-extrabold text-[#087F5B] dark:text-emerald-400">
            {ordersError ? "Connection problem — retrying" : ordersLoading ? "Refreshing…" : "Live queue · refreshes every 20s"}
          </span>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200/80 dark:border-slate-800">
        {[
          { id: "all", label: "All Orders" },
          { id: "pending", label: "New / Pending" },
          { id: "preparing", label: "Preparing" },
          { id: "ready", label: "Ready for Pickup" },
          { id: "out_for_delivery", label: "In Transit" },
          { id: "completed", label: "Completed" },
          { id: "cancelled", label: "Cancelled" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              filter === tab.id
                ? "bg-[#087F5B] text-white shadow-md shadow-[#087F5B]/20"
                : "bg-white dark:bg-slate-900 text-[#66736E] dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {(actionError || ordersError) && (
        <p role="alert" className="text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-2xl p-3">
          {actionError || ordersError}
        </p>
      )}

      {/* ORDERS LIST */}
      <div className="flex flex-col gap-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">No Orders Found</h3>
            <p className="text-xs text-[#66736E] dark:text-slate-400 max-w-sm">
              There are no orders matching this status filter right now. New customer orders will pop up automatically!
            </p>
          </div>
        ) : (
          filteredOrders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-slate-900 dark:text-white">#{ord.id}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isNewOrder(ord.status)
                          ? "bg-emerald-100 text-[#087F5B]"
                          : isInKitchen(ord.status)
                          ? "bg-amber-100 text-amber-700"
                          : isReady(ord.status) || isOnTheWay(ord.status)
                          ? "bg-blue-100 text-blue-700"
                          : isDone(ord.status)
                          ? "bg-slate-100 text-slate-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {statusLabel(ord.status)}
                    </span>
                  </div>
                  <span className="text-xs text-[#66736E] font-semibold mt-1" suppressHydrationWarning>
                    {new Date(ord.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <div className="flex flex-col border-l border-slate-200 dark:border-slate-800 pl-5">
                  <span className="text-xs font-black text-slate-900 dark:text-white">{ord.customerName || "Customer"}</span>
                  <span className="text-xs text-[#66736E] font-medium">{ord.customerPhone || "No phone provided"}</span>
                </div>

                <div className="flex flex-col border-l border-slate-200 dark:border-slate-800 pl-5 max-w-xs">
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {ord.items && ord.items.length > 0
                      ? ord.items.map((i) => `${i.quantity}x ${i.product?.name || "Item"}`).join(", ")
                      : "Standard Order Items"}
                  </span>
                  <span className="text-xs font-black text-[#087F5B]">₦{ord.total?.toLocaleString() || "0"}</span>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center gap-2 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setSelectedOrder(ord)}
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>

                {merchantNextStep(ord.status) && (
                  <button
                    onClick={() => handleStatusChange(ord.id, merchantNextStep(ord.status)!.status)}
                    disabled={busyId === ord.id}
                    className="px-5 py-2.5 rounded-2xl bg-[#087F5B] text-white text-xs font-black hover:bg-[#065A43] transition-all shadow-md shadow-[#087F5B]/20 cursor-pointer disabled:opacity-50"
                  >
                    {busyId === ord.id ? "Saving…" : merchantNextStep(ord.status)!.label}
                  </button>
                )}

                {merchantCanReject(ord.status) && (
                  <button
                    onClick={() => setCancelModalOrder(ord)}
                    disabled={busyId === ord.id}
                    className="px-4 py-2.5 rounded-2xl bg-rose-100 text-rose-700 text-xs font-extrabold hover:bg-rose-200 transition-all cursor-pointer disabled:opacity-50"
                  >
                    Decline
                  </button>
                )}

                {(isReady(ord.status) || ord.status === "rider_assigned") && ord.pickupCode && (
                  <span className="px-4 py-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-black" title="Give this code to the rider at pickup">
                    Pickup code: {ord.pickupCode}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Order #{selectedOrder.id}</h3>
                <span className="text-xs text-[#66736E] font-semibold" suppressHydrationWarning>
                  Placed at {new Date(selectedOrder.createdAt || Date.now()).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CUSTOMER & DELIVERY INFO */}
            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-xs font-black text-[#087F5B] uppercase tracking-wider">Customer & Delivery Info</span>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                <User className="w-4 h-4 text-slate-400" />
                <span>{selectedOrder.customerName || "Customer"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{selectedOrder.customerPhone || "No phone provided"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{selectedOrder.deliveryAddress || "Standard Delivery Address"}</span>
              </div>
            </div>

            {/* ITEMS LIST */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-black text-slate-900 dark:text-white">Ordered Items</span>
              {selectedOrder.items && selectedOrder.items.length > 0 ? (
                selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    <span>{item.quantity}x {item.product?.name || "Item"}</span>
                    <span>₦{((item.product?.price || 0) * item.quantity).toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <span className="text-xs text-slate-500 font-medium">Item breakdown included in total</span>
              )}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex items-center justify-between text-sm font-black text-[#087F5B]">
                <span>Total Amount</span>
                <span>₦{selectedOrder.total?.toLocaleString() || "0"}</span>
              </div>
            </div>

            {/* TIMELINE HISTORY FROM BACKEND */}
            {orderHistory.length > 0 && (
              <div className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white">
                  <History className="w-4 h-4 text-[#087F5B]" />
                  <span>Order Timeline History</span>
                </div>
                <div className="flex flex-col gap-2">
                  {orderHistory.map((h, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="font-bold">
                        {statusLabel(apiService.normalizeOrder({ status: h.new_status }).status)}
                        {h.cancellation_reason ? ` — ${h.cancellation_reason}` : ""}
                      </span>
                      <span className="text-[10px]" suppressHydrationWarning>
                        {h.created_at ? new Date(h.created_at).toLocaleTimeString() : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full py-3 rounded-2xl bg-[#087F5B] text-white text-xs font-black hover:bg-[#065A43] transition-all cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {cancelModalOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Decline Order #{cancelModalOrder.id}?</h3>
            <p className="text-xs text-[#66736E]">Please specify a cancellation reason for the customer:</p>

            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="E.g., Item out of stock / Store closing soon..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none text-slate-900 dark:text-white"
            />

            <div className="flex items-center justify-end gap-3 mt-2">
              <button
                onClick={() => setCancelModalOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={busyId === cancelModalOrder.id}
                className="disabled:opacity-50 px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-black hover:bg-rose-700 cursor-pointer"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
