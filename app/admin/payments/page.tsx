"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Undo2 } from "lucide-react";
import { apiService } from "@/services/api";

const naira = (n: number) => `₦${(Math.round((n || 0) * 100) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const when = (iso?: string) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "");

/** Every online payment received, refunds still to handle, and cash collected on delivery. */
export default function AdminPaymentsPage() {
  const [data, setData] = useState<any>(null);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async () => {
    try {
      const [payments, toRefund] = await Promise.all([apiService.adminPayments(0), apiService.adminOrders({ view: "refunds", limit: 100 })]);
      setData(payments);
      setRefunds(toRefund.items.filter((o: any) => o.needs_refund));
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const more = async () => {
    setLoadingMore(true);
    try {
      const next = await apiService.adminPayments(data.items.length);
      setData({ ...data, items: [...data.items, ...next.items] });
    } finally {
      setLoadingMore(false);
    }
  };

  if (!data) return error ? <p className="text-sm text-rose-600">{error}</p> : <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto mt-20" />;

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl">
      <p className="text-sm text-slate-500">
        Online payments arrive in Novo&apos;s Bachs account. Refunds are made in the{" "}
        <a href="https://dashboard.bachs.io" target="_blank" rel="noreferrer" className="font-semibold text-[#087F5B] inline-flex items-center gap-0.5">
          Bachs dashboard <ExternalLink className="w-3 h-3" />
        </a>{" "}
        and recorded here on the order.
      </p>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Collected online" value={naira(data.totals.collected_online)} />
        <Stat label="Collected on delivery" value={naira(data.totals.collected_on_delivery)} hint="Cash/transfer, held by riders until remitted" />
        <Stat label="Refunded" value={naira(data.totals.refunded)} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Undo2 className="w-4 h-4 text-rose-500" /> Refunds to handle ({refunds.length})
        </h2>
        {refunds.length === 0 ? (
          <p className="text-sm text-slate-500 bg-white dark:bg-slate-900 rounded-2xl p-4">No paid orders are waiting for a refund.</p>
        ) : (
          <ul className="bg-white dark:bg-slate-900 rounded-2xl ">
            {refunds.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders?view=refunds&order=${o.id}`} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <span className="font-mono text-xs text-slate-500 w-28">{o.id}</span>
                  <span className="flex-1 truncate">{o.customer_name} · {o.customer_email || o.customer_phone}</span>
                  <span className="font-bold">{naira(o.total)}</span>
                  <span className="text-xs font-bold text-[#087F5B]">Record refund →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-black text-slate-900 dark:text-white">Online payments ({data.total})</h2>
        {data.items.length === 0 ? (
          <p className="text-sm text-slate-500 bg-white dark:bg-slate-900 rounded-2xl p-4">No online payments yet.</p>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-bold">When</th>
                  <th className="px-4 py-3 font-bold">Order</th>
                  <th className="px-4 py-3 font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold">Reference</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="">
                {data.items.map((t: any) => (
                  <tr key={t.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">{when(t.created_at)}</td>
                    <td className="px-4 py-3"><Link href={`/admin/orders?view=all&order=${t.order_id}`} className="font-mono text-xs text-[#087F5B]">{t.order_id}</Link></td>
                    <td className="px-4 py-3">{t.customer_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 max-w-[180px] truncate" title={t.provider_reference}>{t.provider} · {t.provider_reference}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold ${t.status === "success" ? "text-emerald-600" : "text-amber-600"}`}>{t.status}</span>
                      {(t.order_status === "CANCELLED" || t.order_status === "FAILED") && <span className="text-xs text-rose-600"> · order cancelled</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-bold whitespace-nowrap">{naira(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.items.length < data.total && (
              <div className="p-3 text-center border-slate-100 dark:border-slate-800">
                <button onClick={more} disabled={loadingMore} className="text-sm font-bold text-[#087F5B] cursor-pointer">{loadingMore ? "Loading…" : "Show more"}</button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{value}</p>
      {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
    </div>
  );
}
