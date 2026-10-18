"use client";

import React, { useState } from "react";
import { usePlatform } from "@/store/PlatformContext";
import { Table, Column } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Order, OrderStatus } from "@/types";
import { adminNextSteps, statusLabel } from "@/utils/orderStatus";

export default function AdminOrdersPage() {
  const { orders: ordersList, ordersError, updateOrderStatus } = usePlatform();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    if (newStatus === "cancelled" && !window.confirm(`Cancel order ${orderId}?`)) return;
    setBusyId(orderId);
    setActionError(null);
    try {
      await updateOrderStatus(orderId, newStatus, newStatus === "cancelled" ? { reason: "Cancelled by admin" } : undefined);
    } catch (e: any) {
      setActionError(`${orderId}: ${e?.message || "update failed"}`);
    } finally {
      setBusyId(null);
    }
  };

  const columns: Column<Order>[] = [
    { header: "Order ID", accessorKey: "id" },
    { header: "Customer", accessorKey: "customerName" },
    { header: "Store", accessorKey: "storeName" },
    { header: "Rider", cell: (o) => <span>{o.riderName || "Unassigned"}</span> },
    { header: "Total", cell: (o) => <span className="font-bold">₦{(o.total || 0).toLocaleString()}</span> },
    { header: "Status", cell: (o) => <StatusBadge status={o.status} /> },
    {
      header: "Admin Action",
      cell: (o) => (
        adminNextSteps(o.status).length === 0 ? (
          <span className="text-xs text-slate-400">—</span>
        ) : (
          <select
            value=""
            disabled={busyId === o.id}
            aria-label={`Change status of ${o.id}`}
            onChange={(e) => e.target.value && handleStatusChange(o.id, e.target.value as OrderStatus)}
            className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 cursor-pointer disabled:opacity-50"
          >
            <option value="">{busyId === o.id ? "Saving…" : "Move to…"}</option>
            {adminNextSteps(o.status).map((next) => (
              <option key={next} value={next}>
                {statusLabel(next)}
              </option>
            ))}
          </select>
        )
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
          Live Platform Order Monitor
        </h1>
        <span className="text-xs font-bold text-slate-500">
          {ordersList.length} Total Orders
        </span>
      </div>
      {(actionError || ordersError) && (
        <p role="alert" className="text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-xl p-3">
          {actionError || ordersError}
        </p>
      )}
      <Table columns={columns} data={ordersList} keyExtractor={(o) => o.id} />
    </div>
  );
}
