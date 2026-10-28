"use client";

import React from "react";
import { MessageSquareText } from "lucide-react";
import type { CartItem, Order, SelectedOption } from "@/types";

const naira = (n: number) => `₦${Math.round(n || 0).toLocaleString()}`;
const PAYMENT: Record<string, string> = { card: "Paid online", cash: "Cash on delivery", transfer: "Transfer on delivery" };

/** Groups picked options by their group: [["Protein", ["Beef"]], ["Extras", ["2× Plantain", "Egg"]]] */
function groupChoices(opts: SelectedOption[] = []): [string, string[]][] {
  const groups = new Map<string, string[]>();
  for (const o of opts) {
    const qty = Math.max(1, Number(o.quantity) || 1);
    const label = `${qty > 1 ? `${qty}× ` : ""}${o.name}`;
    const key = o.group || "Extras";
    groups.set(key, [...(groups.get(key) || []), label]);
  }
  return Array.from(groups.entries());
}

/**
 * Everything the customer picked, line by line: quantity, item, each choice under its group,
 * the item note, and what the line costs. Shown to the merchant before they accept.
 */
export function OrderItemsDetail({ order, compact = false }: { order: Order; compact?: boolean }) {
  const items: CartItem[] = order.items || [];
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2.5">
        {items.map((item, i) => {
          const choices = groupChoices(item.selectedOptions);
          return (
            <li key={i} className="flex items-start gap-3">
              <span className="min-w-8 h-8 px-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#087F5B] dark:text-emerald-300 text-sm font-bold flex items-center justify-center shrink-0">
                {item.quantity}×
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[15px] font-semibold leading-snug">{item.product?.name || "Item"}</p>
                  {!compact && <span className="text-sm font-semibold shrink-0">{naira((item.product?.price || 0) * item.quantity)}</span>}
                </div>
                {choices.map(([group, picks]) => (
                  <p key={group} className="text-sm text-slate-600 dark:text-slate-300 leading-snug">
                    <span className="text-slate-400">{group}:</span> {picks.join(", ")}
                  </p>
                ))}
                {item.specialInstructions && (
                  <p className="mt-1 text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 rounded-lg px-2 py-1 w-fit">
                    “{item.specialInstructions}”
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {order.customerNote && (
        <div className="flex items-start gap-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100 px-3.5 py-2.5 text-sm">
          <MessageSquareText className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            <span className="font-semibold">Note from customer:</span> {order.customerNote}
          </span>
        </div>
      )}

      {!compact && (
        <div className="flex flex-col gap-1 text-sm pt-1">
          <Row label="Items" value={naira(order.subtotal)} strong />
          <Row label="Delivery fee (goes to the rider)" value={naira(order.deliveryFee)} />
          {order.tip > 0 && <Row label="Rider tip" value={naira(order.tip)} />}
          <Row label="Customer pays" value={naira(order.total)} />
          <p className="text-xs text-slate-500 mt-1">{PAYMENT[order.paymentMethod] || order.paymentMethod}</p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${strong ? "font-semibold" : "text-slate-500"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
