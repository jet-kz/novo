"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { AlertCircle, Check, Loader2, MapPin, Phone, Store as StoreIcon } from "lucide-react";
import { apiService } from "@/services/api";
import { Order, OrderStatus } from "@/types";
import { usePaymentReturn } from "@/components/checkout/usePaymentReturn";
import { LiveOrderMap } from "@/components/map/LiveOrderMap";
import { EnableAlertsCard } from "@/components/notifications/EnableAlertsCard";
import { saveGuestOrder } from "@/utils/guestOrders";

const STEPS: { status: OrderStatus; label: string; hint: string }[] = [
  { status: "pending_merchant", label: "Order sent", hint: "Waiting for the store to accept" },
  { status: "accepted", label: "Accepted", hint: "The store has your order" },
  { status: "preparing", label: "Being prepared", hint: "Your order is being made" },
  { status: "ready_for_pickup", label: "Ready", hint: "Waiting for a rider" },
  { status: "rider_assigned", label: "Rider on the way to the store", hint: "" },
  { status: "picked_up", label: "On the way to you", hint: "Keep your phone close" },
  { status: "delivered", label: "Delivered", hint: "Enjoy!" },
];
const REFRESH_MS = 10000;
const naira = (n: number) => `₦${Math.round(n).toLocaleString()}`;

function TrackContent() {
  const { orderId } = useParams<{ orderId: string }>();
  const params = useSearchParams();
  const token = params.get("t") || "";
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!orderId || !token) return;
    try {
      const o = await apiService.getGuestOrder(orderId, token);
      setOrder(o);
      setError(null);
      saveGuestOrder({ id: o.id, token, storeName: o.storeName, total: o.total, createdAt: o.createdAt });
    } catch (e: any) {
      setError(e.message || "We couldn't find that order.");
    }
  }, [orderId, token]);

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  const payment = usePaymentReturn(orderId, params, token, load);

  const payNow = async () => {
    setBusy(true);
    try {
      const session = await apiService.startBachsCheckout({ order_id: orderId, guest_token: token });
      window.location.href = session.checkout_url;
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!window.confirm("Cancel this order?")) return;
    setBusy(true);
    try {
      setOrder(await apiService.cancelGuestOrder(orderId, token, "Cancelled by customer"));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return <Message title="This link is incomplete" body="Open the tracking link from your order confirmation." />;
  }
  if (!order) {
    return error ? <Message title="Order not found" body={error} /> : <Loader2 className="w-7 h-7 animate-spin text-emerald-600 mx-auto mt-24" />;
  }

  const cancelled = order.status === "cancelled";
  const current = STEPS.findIndex((s) => s.status === order.status);
  const awaitingPayment = order.paymentMethod === "card" && order.paymentStatus !== "paid" && !cancelled;
  const canCancel = !cancelled && ["pending_merchant", "accepted"].includes(order.status);

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 md:py-10 flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold text-slate-500">Order {order.id}</p>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
          {cancelled ? "Order cancelled" : order.status === "delivered" ? "Delivered" : STEPS[Math.max(current, 0)].label}
        </h1>
      </div>

      {!cancelled && order.status !== "delivered" && (
        <EnableAlertsCard
          storageKey={`track-${order.id}`}
          title="Get updates on this order"
          body="We'll notify you when the store accepts it, when the rider picks it up and when it arrives."
          guest={{ orderId: order.id, token, openUrl: `/track/${encodeURIComponent(order.id)}?t=${encodeURIComponent(token)}` }}
        />
      )}
      {payment === "confirming" && <Banner tone="info" icon={<Loader2 className="w-4 h-4 animate-spin" />} text="Confirming your payment…" />}
      {payment === "paid" && <Banner tone="ok" icon={<Check className="w-4 h-4" />} text="Payment received. The store has your order." />}
      {payment === "pending" && (
        <Banner tone="warn" icon={<AlertCircle className="w-4 h-4" />} text="We haven't received payment confirmation yet. This page updates on its own; if you were charged, it will show here shortly." />
      )}
      {awaitingPayment && payment !== "confirming" && payment !== "paid" && (
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            {payment === "cancelled" ? "Payment wasn't completed." : "This order is waiting for payment."} The store will only see it once it&apos;s paid.
          </p>
          <div className="flex gap-2">
            <button onClick={payNow} disabled={busy} className="flex-1 py-3 rounded-xl bg-[#087F5B] text-white text-sm font-bold disabled:opacity-60 cursor-pointer">
              Pay {naira(order.total)}
            </button>
            <button onClick={cancel} disabled={busy} className="px-4 py-3 rounded-xl bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && <Banner tone="warn" icon={<AlertCircle className="w-4 h-4" />} text={error} />}

      {!cancelled && order.status !== "delivered" && <LiveOrderMap order={order} className="h-56" />}

      {!cancelled && (
        <ol className="rounded-2xl bg-white dark:bg-slate-900 p-5 flex flex-col gap-4">
          {STEPS.map((step, i) => {
            const done = i <= current;
            return (
              <li key={step.status} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    done ? "bg-[#087F5B] text-white" : "bg-slate-100 dark:bg-slate-800"
                  }`}
                >
                  {done && <Check className="w-3 h-3" />}
                </span>
                <div>
                  <p className={`text-sm ${i === current ? "font-black text-slate-900 dark:text-white" : done ? "font-semibold text-slate-700 dark:text-slate-300" : "text-slate-400"}`}>
                    {step.label}
                  </p>
                  {i === current && step.hint && <p className="text-xs text-slate-500">{step.hint}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {order.riderName && !cancelled && order.status !== "delivered" && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Your rider</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{order.riderName}</p>
          </div>
          {order.riderPhone && (
            <a href={`tel:${order.riderPhone}`} className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#087F5B] dark:text-emerald-300 text-sm font-bold flex items-center gap-1.5">
              <Phone className="w-4 h-4" /> Call
            </a>
          )}
        </div>
      )}

      <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 flex flex-col gap-3 text-sm">
        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <StoreIcon className="w-4 h-4 text-[#087F5B]" /> {order.storeName || "Store"}
        </div>
        <ul className="flex flex-col gap-1.5 text-slate-600 dark:text-slate-300">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between">
              <span>{item.quantity}× {item.product.name}</span>
              <span>{naira(item.product.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between font-black text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
          <span>Total</span>
          <span>{naira(order.total)}</span>
        </div>
        <p className="text-xs text-slate-500">
          {order.paymentMethod === "card"
            ? order.paymentStatus === "paid" ? "Paid online" : "Online payment"
            : order.paymentMethod === "cash" ? "Cash on delivery" : "Transfer on delivery"}
        </p>
        <p className="flex items-start gap-1.5 text-xs text-slate-500">
          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {order.deliveryAddress}
        </p>
      </div>

      {canCancel && !awaitingPayment && (
        <button onClick={cancel} disabled={busy} className="text-sm font-semibold text-rose-600 py-2 cursor-pointer">
          Cancel order
        </button>
      )}

      <p className="text-xs text-slate-400 text-center">
        Keep this page&apos;s link to check on your order.{" "}
        <Link href="/auth?mode=signup" className="font-semibold text-[#087F5B]">Create an account</Link> to keep all your orders in one place.
      </p>
    </div>
  );
}

function Banner({ tone, icon, text }: { tone: "ok" | "info" | "warn"; icon: React.ReactNode; text: string }) {
  const tones = {
    ok: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
    info: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    warn: "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  };
  return (
    <div role="status" className={`rounded-2xl p-3.5 text-sm font-semibold flex items-start gap-2 ${tones[tone]}`}>
      <span className="mt-0.5">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div className="max-w-sm mx-auto px-4 py-24 text-center">
      <h1 className="text-xl font-black text-slate-900 dark:text-white">{title}</h1>
      <p className="text-sm text-slate-500 mt-2">{body}</p>
      <Link href="/" className="inline-block mt-6 text-sm font-bold text-[#087F5B]">Back to Novo</Link>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<Loader2 className="w-7 h-7 animate-spin text-emerald-600 mx-auto mt-24" />}>
      <TrackContent />
    </Suspense>
  );
}
