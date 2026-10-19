"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Loader2, Mail, MapPin, Phone, Search, Store as StoreIcon, Bike, Undo2 } from "lucide-react";
import { apiService } from "@/services/api";
import { optionsLabel } from "@/utils/options";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LiveOrderMap } from "@/components/map/LiveOrderMap";
import { adminNextSteps, statusLabel } from "@/utils/orderStatus";
import { OrderStatus } from "@/types";

const VIEWS: [string, string][] = [
  ["attention", "Needs attention"],
  ["active", "In progress"],
  ["awaiting_payment", "Awaiting payment"],
  ["delivered", "Delivered"],
  ["cancelled", "Cancelled"],
  ["refunds", "Refunds"],
  ["all", "All"],
];
const PAGE = 50;
const naira = (n: number) => `₦${Math.round(n || 0).toLocaleString()}`;
const when = (iso?: string) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "");
const PAY: Record<string, string> = { card: "Paid online", cash: "Cash on delivery", transfer: "Transfer on delivery" };

function OrdersContent() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const view = params.get("view") || "active";
  const openId = params.get("order");

  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next}`, { scroll: false });
  };

  const load = useCallback(async (offset = 0) => {
    setLoading(true);
    try {
      const res = await apiService.adminOrders({ view, q: query, limit: PAGE, offset });
      setRows((prev) => (offset ? [...prev, ...res.items] : res.items));
      setTotal(res.total);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [view, query]);

  useEffect(() => {
    load(0);
  }, [load]);

  // Debounced search.
  useEffect(() => {
    const t = setTimeout(() => setQuery(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="flex flex-col gap-4 w-full max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none flex-1" role="tablist">
          {VIEWS.map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={view === id}
              onClick={() => setParam("view", id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${
                view === id ? "bg-[#087F5B] text-white" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Order ID, name, phone, email"
            aria-label="Search orders"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>
      </div>

      {error && <p role="alert" className="text-sm font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-xl p-3">{error}</p>}

      <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        {loading && rows.length === 0 ? (
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto my-12" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-12">{view === "attention" ? "No stuck orders. All good." : "No orders here."}</p>
        ) : (
          <ul className="">
            {rows.map((raw) => {
              const o = apiService.normalizeOrder(raw);
              return (
                <li key={o.id}>
                  <button onClick={() => setParam("order", o.id)} className="w-full text-left px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                    <div className="flex items-center gap-2 sm:w-40 shrink-0">
                      <span className="font-mono text-xs text-slate-500">{o.id}</span>
                      {raw.stuck && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" aria-label="Stuck" />}
                      {raw.needs_refund && <Undo2 className="w-3.5 h-3.5 text-rose-500" aria-label="Needs refund" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {o.customerName}{o.isGuest ? " (guest)" : ""} → {o.storeName || "—"}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{when(o.createdAt)} · {PAY[o.paymentMethod] || o.paymentMethod}{o.paymentMethod === "card" && o.paymentStatus !== "paid" ? " (unpaid)" : ""}</p>
                    </div>
                    <div className="flex items-center gap-3 sm:justify-end">
                      <StatusBadge status={o.status} />
                      <span className="text-sm font-black text-slate-900 dark:text-white w-24 text-right">{naira(o.total)}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {rows.length < total && (
          <div className="p-3 text-center border-slate-100 dark:border-slate-800">
            <button onClick={() => load(rows.length)} disabled={loading} className="text-sm font-bold text-[#087F5B] cursor-pointer">
              {loading ? "Loading…" : `Show more (${total - rows.length} left)`}
            </button>
          </div>
        )}
      </div>

      {openId && <OrderDrawer orderId={openId} onClose={() => setParam("order", null)} onChanged={() => load(0)} />}
    </div>
  );
}

function OrderDrawer({ orderId, onClose, onChanged }: { orderId: string; onClose: () => void; onChanged: () => void }) {
  const [raw, setRaw] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const [refunding, setRefunding] = useState(false);
  const [refundRef, setRefundRef] = useState("");
  const [refundNote, setRefundNote] = useState("");

  const load = useCallback(async () => {
    try {
      setRaw(await apiService.adminOrder(orderId));
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, [orderId]);
  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await load();
      onChanged();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const o = raw ? apiService.normalizeOrder(raw) : null;
  const steps = o ? adminNextSteps(o.status).filter((s) => s !== "cancelled") : [];
  const canCancel = o ? adminNextSteps(o.status).includes("cancelled") : false;

  return (
    <Modal isOpen onClose={onClose} title={`Order ${orderId}`} subtitle={o ? when(o.createdAt) : undefined} maxWidth="2xl">
      {!o ? (
        error ? <p className="text-sm text-rose-600">{error}</p> : <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto my-10" />
      ) : (
        <div className="flex flex-col gap-5">
          {error && <p role="alert" className="text-sm font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-xl p-3">{error}</p>}

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={o.status} />
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {PAY[o.paymentMethod] || o.paymentMethod} · {raw.payment_status}
            </span>
            {raw.needs_refund && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700">Refund needed</span>}
            {raw.stuck && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">Stuck</span>}
          </div>

          {/* Actions */}
          {(steps.length > 0 || canCancel || raw.needs_refund) && (
            <div className="flex flex-wrap gap-2">
              {steps.map((s: OrderStatus) => (
                <Button key={s} size="sm" variant="primary" disabled={busy} onClick={() => act(() => apiService.updateOrderStatus(o.id, s))}>
                  Mark {statusLabel(s).toLowerCase()}
                </Button>
              ))}
              {canCancel && (
                <Button size="sm" variant="danger" disabled={busy} onClick={() => setCancelling(true)}>Cancel order</Button>
              )}
              {raw.needs_refund && (
                <Button size="sm" variant="secondary" disabled={busy} onClick={() => setRefunding(true)}>Record refund</Button>
              )}
            </div>
          )}

          {cancelling && (
            <form
              className="rounded-xl bg-rose-50 dark:bg-rose-950/30 p-3 flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                act(() => apiService.updateOrderStatus(o.id, "cancelled", undefined, { reason: reason.trim() || "Cancelled by Novo support" })).then(() => setCancelling(false));
              }}
            >
              <Input label="Reason (sent to the customer)" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Store closed unexpectedly" />
              <div className="flex gap-2">
                <Button type="submit" size="sm" variant="danger" disabled={busy}>Cancel order</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setCancelling(false)}>Keep it</Button>
              </div>
              {o.paymentStatus === "paid" && <p className="text-xs text-rose-700">This order was paid online. After cancelling, refund it in Bachs and record it here.</p>}
            </form>
          )}

          {refunding && (
            <form
              className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                act(() => apiService.recordRefund(o.id, refundRef, refundNote)).then(() => setRefunding(false));
              }}
            >
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Refund {naira(o.total)} in the Bachs dashboard (or by bank transfer), then record it here so the books match.
              </p>
              <Input label="Refund reference" value={refundRef} onChange={(e) => setRefundRef(e.target.value)} placeholder="Bachs refund ID or bank reference" required />
              <Input label="Note (optional)" value={refundNote} onChange={(e) => setRefundNote(e.target.value)} />
              <div className="flex gap-2">
                <Button type="submit" size="sm" variant="primary" disabled={busy || !refundRef.trim()}>Save refund</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setRefunding(false)}>Cancel</Button>
              </div>
            </form>
          )}

          {o.status !== "delivered" && o.status !== "cancelled" && <LiveOrderMap order={o} className="h-52" />}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <Card title="Customer">
              <p className="font-semibold">{o.customerName}{o.isGuest ? " (guest)" : ""}</p>
              {o.customerPhone && <a href={`tel:${o.customerPhone}`} className="flex items-center gap-1.5 text-[#087F5B]"><Phone className="w-3.5 h-3.5" />{o.customerPhone}</a>}
              {o.customerEmail && <a href={`mailto:${o.customerEmail}`} className="flex items-center gap-1.5 text-[#087F5B] truncate"><Mail className="w-3.5 h-3.5" />{o.customerEmail}</a>}
              <p className="flex items-start gap-1.5 text-slate-500 text-xs"><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />{o.deliveryAddress}</p>
            </Card>
            <Card title="Store">
              <p className="font-semibold flex items-center gap-1.5"><StoreIcon className="w-3.5 h-3.5" />{o.storeName || "—"}</p>
              {raw.store_phone && <a href={`tel:${raw.store_phone}`} className="flex items-center gap-1.5 text-[#087F5B]"><Phone className="w-3.5 h-3.5" />{raw.store_phone}</a>}
              {o.pickupCode && <p className="text-xs text-slate-500">Pickup code <strong className="font-mono text-slate-900 dark:text-white">{o.pickupCode}</strong></p>}
              {o.deliveryCode && <p className="text-xs text-slate-500">Delivery code <strong className="font-mono text-slate-900 dark:text-white">{o.deliveryCode}</strong> <span className="text-slate-400">(only give it to a rider after confirming with the customer)</span></p>}
            </Card>
            <Card title="Rider">
              {o.riderId ? (
                <>
                  <p className="font-semibold flex items-center gap-1.5"><Bike className="w-3.5 h-3.5" />{o.riderName || "Rider"}</p>
                  {o.riderPhone && <a href={`tel:${o.riderPhone}`} className="flex items-center gap-1.5 text-[#087F5B]"><Phone className="w-3.5 h-3.5" />{o.riderPhone}</a>}
                  {o.riderEarnings != null && <p className="text-xs text-slate-500">Earns {naira(o.riderEarnings)}</p>}
                </>
              ) : (
                <p className="text-slate-500">Not assigned yet</p>
              )}
            </Card>
          </div>

          <Card title="Items">
            <ul className="flex flex-col gap-1">
              {o.items.map((it, i) => (
                <li key={i} className="flex justify-between">
                  <span>{it.quantity}× {it.product.name}{it.selectedOptions?.length ? <span className="text-slate-500"> ({optionsLabel(it.selectedOptions)})</span> : null}</span>
                  <span>{naira(it.product.price * it.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 pt-2 border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex flex-col gap-0.5">
              <Line label="Subtotal" value={naira(o.subtotal)} />
              <Line label="Delivery fee" value={naira(o.deliveryFee)} />
              <Line label="Service fee" value={naira(o.serviceFee)} />
              {o.tip > 0 && <Line label="Rider tip" value={naira(o.tip)} />}
              <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-1"><span>Total</span><span>{naira(o.total)}</span></div>
            </div>
          </Card>

          <Card title="Timeline">
            <ol className="flex flex-col gap-2">
              {raw.history.map((h: any) => (
                <li key={h.id} className="text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white">{statusLabel(apiService.normalizeOrder({ status: h.new_status }).status)}</span>
                  <span className="text-slate-500"> · {when(h.created_at)}{h.changed_by_email ? ` · by ${h.changed_by_email}` : ""}</span>
                  {h.cancellation_reason && <p className="text-rose-600">Reason: {h.cancellation_reason}</p>}
                </li>
              ))}
            </ol>
          </Card>

          {(raw.transactions.length > 0 || raw.refunds.length > 0) && (
            <Card title="Payments">
              <ul className="flex flex-col gap-1 text-xs">
                {raw.transactions.map((t: any) => (
                  <li key={t.id} className="flex justify-between">
                    <span>{t.provider} {t.txn_type} · {t.status} · <span className="font-mono">{t.provider_reference}</span></span>
                    <span className="font-bold">{naira(t.amount)}</span>
                  </li>
                ))}
                {raw.refunds.map((r: any) => (
                  <li key={r.id} className="flex justify-between text-rose-600">
                    <span>Refund · {r.status} · {r.reason}</span>
                    <span className="font-bold">−{naira(r.amount)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </Modal>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 flex flex-col gap-1.5 text-slate-800 dark:text-slate-200">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{title}</p>
      {children}
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span>{label}</span><span>{value}</span></div>;
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto mt-20" />}>
      <OrdersContent />
    </Suspense>
  );
}
