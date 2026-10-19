"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Pencil, Plus, ShoppingBag, Star } from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";
import { getUniqueStoreBanner } from "@/utils/storeImageUtils";
import {
  isCancelled,
  isDone,
  isInKitchen,
  isNewOrder,
  isOnTheWay,
  isReady,
  merchantCanReject,
  merchantNextStep,
  statusLabel,
} from "@/utils/orderStatus";
import type { Order, OrderStatus } from "@/types";

type Tab = "new" | "preparing" | "ready" | "completed";

const TABS: { id: Tab; label: string }[] = [
  { id: "new", label: "New" },
  { id: "preparing", label: "In the kitchen" },
  { id: "ready", label: "Ready & on the way" },
  { id: "completed", label: "Completed" },
];

const naira = (n: number) => `₦${Math.round(n || 0).toLocaleString()}`;
const isToday = (iso?: string) => {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
};
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

export default function MerchantDashboardPage() {
  const { merchantStore, merchantStoreLoading, updateOrderStatus, orders, ordersError, products } = usePlatform();

  const isLoading = merchantStoreLoading && !merchantStore;
  const storeOrders = merchantStore ? orders.filter((o) => o.storeId === merchantStore.id) : [];
  const storeProducts = merchantStore ? products.filter((p) => p.storeId === merchantStore.id) : [];

  const [tab, setTab] = useState<Tab>("new");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const run = async (id: string, fn: () => Promise<unknown>) => {
    setBusyId(id);
    setActionError(null);
    try {
      await fn();
    } catch (e: any) {
      setActionError(e?.message || "That didn't go through. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const inTab = (s: OrderStatus, t: Tab) =>
    t === "new" ? isNewOrder(s) : t === "preparing" ? isInKitchen(s) : t === "ready" ? isReady(s) || isOnTheWay(s) : isDone(s);
  const counts = Object.fromEntries(TABS.map((t) => [t.id, storeOrders.filter((o) => inTab(o.status, t.id)).length])) as Record<Tab, number>;
  const shown = storeOrders.filter((o) => inTab(o.status, tab)).slice(0, 8);

  const today = storeOrders.filter((o) => isToday(o.createdAt) && !isCancelled(o.status));
  const salesToday = today.reduce((sum, o) => sum + (o.subtotal || 0), 0);
  const rating = Number(merchantStore?.rating) || 0;

  const banner = merchantStore?.banner || (merchantStore ? getUniqueStoreBanner(merchantStore) : "");

  if (isLoading) {
    return <div className="py-24 flex justify-center"><span className="w-7 h-7 rounded-full border-[3px] border-[#087F5B] border-t-transparent animate-spin" /></div>;
  }

  if (!merchantStore) {
    return (
      <div className="max-w-md mx-auto py-20 text-center flex flex-col items-center gap-3">
        <span className="w-14 h-14 rounded-[20px] bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
          <ShoppingBag className="w-6 h-6 text-slate-400" />
        </span>
        <h1 className="text-xl font-bold">No store linked yet</h1>
        <p className="text-sm text-slate-500">Finish setting up your store to start receiving orders.</p>
        <Link href="/merchant/register" className="mt-2 h-11 px-5 rounded-2xl bg-[#087F5B] text-white text-sm font-semibold flex items-center">
          Set up my store
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Greeting */}
      <div>
        <p className="text-sm text-slate-500">{greeting()}</p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-0.5">
          {counts.new > 0 ? `${counts.new} new order${counts.new === 1 ? "" : "s"} waiting` : "You're all caught up"}
        </h1>
      </div>

      {/* Store banner, styled like the homepage promo */}
      <section className="relative w-full aspect-[2/1] sm:aspect-[3/1] lg:aspect-[4/1] rounded-[28px] overflow-hidden bg-slate-900">
        {banner && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banner} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent" />
        <div className="relative h-full flex flex-col justify-end sm:justify-center gap-1.5 p-5 sm:p-8 max-w-[80%] sm:max-w-[60%]">
          <h2 className="text-xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight">{merchantStore.name}</h2>
          {merchantStore.address && (
            <p className="text-xs sm:text-sm text-white/80 flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 shrink-0" /> {merchantStore.address}
            </p>
          )}
          <Link
            href="/merchant/profile"
            className="mt-2 inline-flex w-fit items-center gap-1.5 h-9 px-4 rounded-full bg-white text-slate-900 text-xs sm:text-sm font-semibold"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit store
          </Link>
        </div>
      </section>

      {/* Today at a glance: plain numbers, no boxes */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6">
        <Stat label="Orders today" value={String(today.length)} />
        <Stat label="Sales today" value={naira(salesToday)} hint="Before Novo's commission" />
        <Stat label="Waiting on you" value={String(counts.new)} tone={counts.new ? "warn" : undefined} />
        <Stat
          label="Rating"
          value={rating > 0 ? rating.toFixed(1) : "–"}
          hint={merchantStore.reviewCount ? `${merchantStore.reviewCount} reviews` : "No reviews yet"}
          icon={rating > 0 ? <Star className="w-5 h-5 fill-amber-400 text-amber-400" /> : undefined}
        />
      </section>

      {/* Orders */}
      <section className="flex flex-col gap-4">
        <SectionHead title="Orders" href="/merchant/orders" />
        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
              className={`h-9 px-4 rounded-full text-[13px] font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer ${
                tab === t.id ? "bg-[#087F5B] text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              {t.label}
              <span className={tab === t.id ? "text-white/80" : "text-slate-400"}>{counts[t.id]}</span>
            </button>
          ))}
        </div>

        {(actionError || ordersError) && (
          <p role="alert" className="text-sm text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-2xl px-4 py-3">
            {actionError || ordersError}
          </p>
        )}

        {shown.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            {tab === "new" ? "No new orders. They'll pop up here (with a sound) the moment one comes in." : "Nothing here right now."}
          </p>
        ) : (
          <ul className="flex flex-col -mx-3">
            {shown.map((o) => (
              <OrderRow
                key={o.id}
                order={o}
                busy={busyId === o.id}
                onAdvance={(status) => run(o.id, () => updateOrderStatus(o.id, status))}
                onReject={() => {
                  if (!window.confirm("Reject this order? The customer will be told and refunded if they paid.")) return;
                  run(o.id, () => updateOrderStatus(o.id, "cancelled", { reason: "Rejected by store" }));
                }}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Menu strip, like "Popular near you" on the homepage */}
      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Your menu</h2>
            <p className="text-sm text-slate-500">
              {storeProducts.length} item{storeProducts.length === 1 ? "" : "s"}
              {storeProducts.some((p) => p.inStock === false) ? ` · ${storeProducts.filter((p) => p.inStock === false).length} sold out` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/merchant/menu?action=add" className="h-9 px-4 rounded-full bg-[#087F5B] text-white text-[13px] font-semibold flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add item
            </Link>
            <Link href="/merchant/menu" className="hidden sm:flex h-9 px-3 items-center gap-1 text-[13px] font-semibold text-[#087F5B]">
              Manage <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {storeProducts.length === 0 ? (
          <p className="py-8 text-sm text-slate-500">Add your first item so customers can order from you.</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
            {storeProducts.slice(0, 12).map((p) => (
              <Link key={p.id} href="/merchant/menu" className="w-40 sm:w-44 shrink-0 group">
                <div className="relative aspect-square rounded-[22px] overflow-hidden bg-slate-100 dark:bg-slate-900">
                  {p.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  )}
                  {p.inStock === false && (
                    <span className="absolute inset-0 bg-slate-950/55 flex items-center justify-center text-white text-xs font-semibold">Sold out</span>
                  )}
                </div>
                <p className="mt-2 text-sm font-semibold truncate">{p.name}</p>
                <p className="text-sm text-slate-500">{naira(p.price)}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SectionHead({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      <Link href={href} className="text-[13px] font-semibold text-[#087F5B] flex items-center gap-1">
        See all <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

function Stat({ label, value, hint, tone, icon }: { label: string; value: string; hint?: string; tone?: "warn"; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-1.5 ${tone === "warn" ? "text-amber-600" : ""}`}>
        {icon}
        {value}
      </p>
      {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function OrderRow({
  order,
  busy,
  onAdvance,
  onReject,
}: {
  order: Order;
  busy: boolean;
  onAdvance: (status: OrderStatus) => void;
  onReject: () => void;
}) {
  const next = merchantNextStep(order.status);
  const itemCount = order.items.reduce((n, it) => n + (it.quantity || 0), 0);
  const time = order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";
  return (
    <li className={`flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-2.5 px-3 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors ${busy ? "opacity-60" : ""}`}>
      <span className="w-11 h-11 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-[#087F5B] flex items-center justify-center text-sm font-semibold shrink-0">
        {(order.customerName || "C").slice(0, 1).toUpperCase()}
      </span>
      <Link href="/merchant/orders" className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold truncate flex items-center justify-between gap-2">
          <span className="truncate">{order.customerName || "Customer"}</span>
          <span className="sm:hidden shrink-0">{naira(order.subtotal || order.total)}</span>
        </p>
        <p className="text-xs text-slate-500 truncate">
          #{order.id.slice(-6).toUpperCase()} · {itemCount} item{itemCount === 1 ? "" : "s"} · {time}
        </p>
      </Link>
      <span className="hidden sm:block text-[15px] font-semibold w-24 text-right">{naira(order.subtotal || order.total)}</span>
      <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto pl-14 sm:pl-0">
        {next ? (
          <button
            onClick={() => onAdvance(next.status)}
            disabled={busy}
            className="h-9 px-4 rounded-full bg-[#087F5B] text-white text-[13px] font-semibold cursor-pointer disabled:cursor-not-allowed"
          >
            {isNewOrder(order.status) ? "Accept" : next.label}
          </button>
        ) : (
          <span className="h-9 px-3.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-[13px] font-medium flex items-center">
            {statusLabel(order.status)}
          </span>
        )}
        {isNewOrder(order.status) && merchantCanReject(order.status) && (
          <button
            onClick={onReject}
            disabled={busy}
            className="h-9 px-3.5 rounded-full text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[13px] font-medium cursor-pointer"
          >
            Decline
          </button>
        )}
      </div>
    </li>
  );
}
