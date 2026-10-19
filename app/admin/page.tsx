"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Bike, CheckCircle2, Clock, Loader2, RefreshCw, Store, Undo2 } from "lucide-react";
import { apiService, ORDER_STATUS_FROM_API } from "@/services/api";
import { StatusBadge } from "@/components/ui/StatusBadge";

const naira = (n: number) => `₦${Math.round(n || 0).toLocaleString()}`;
const STAGES: [string, string][] = [
  ["PENDING", "Waiting for store"],
  ["CONFIRMED", "Accepted"],
  ["PREPARING", "Preparing"],
  ["READY_FOR_PICKUP", "Ready for rider"],
  ["RIDER_ASSIGNED", "Rider heading to store"],
  ["PICKED_UP", "On the way"],
];

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setData(await apiService.adminOverview());
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => document.visibilityState === "visible" && load(), 30000);
    return () => clearInterval(t);
  }, [load]);

  if (!data) {
    return error ? <p className="text-sm text-rose-600">{error}</p> : <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto mt-20" />;
  }

  const a = data.attention;
  const attention = [
    { n: a.orders_not_accepted, text: "orders not accepted by the store for 15+ min", href: "/admin/orders?view=attention", icon: Clock },
    { n: a.orders_waiting_for_rider, text: "orders ready but no rider for 15+ min", href: "/admin/orders?view=attention", icon: Bike },
    { n: a.refunds_to_handle, text: "paid orders cancelled — refund needed", href: "/admin/payments", icon: Undo2 },
    { n: a.riders_to_review, text: "riders waiting for approval", href: "/admin/riders", icon: Bike },
    { n: a.stores_to_approve, text: "stores waiting for approval", href: "/admin/stores", icon: Store },
  ].filter((x) => x.n > 0);
  const live = STAGES.reduce((sum, [s]) => sum + (data.live_orders[s] || 0), 0);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Live figures. Money counts delivered orders only. Updates every 30 seconds.</p>
        <button onClick={load} className="p-2 rounded-xl text-slate-500 hover:bg-white dark:hover:bg-slate-900 cursor-pointer" aria-label="Refresh">
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Needs attention */}
      <section className={`rounded-2xl p-5 ${attention.length ? "bg-amber-50 dark:bg-amber-950/30" : "bg-emerald-50 dark:bg-emerald-950/30"}`}>
        {attention.length === 0 ? (
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Nothing needs your attention right now.
          </p>
        ) : (
          <>
            <p className="text-sm font-black text-amber-900 dark:text-amber-200 flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4" /> Needs attention
            </p>
            <ul className="flex flex-col gap-1.5">
              {attention.map((x) => (
                <li key={x.text}>
                  <Link href={x.href} className="flex items-center gap-3 text-sm text-amber-950 dark:text-amber-100 hover:underline">
                    <x.icon className="w-4 h-4 shrink-0" />
                    <span><strong>{x.n}</strong> {x.text}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-auto shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Headline numbers */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile label="Orders today" value={String(data.today.orders)} hint={`${live} in progress now`} />
        <Tile label="Delivered value today" value={naira(data.today.gmv)} hint={`Novo earned ${naira(data.today.revenue)}`} />
        <Tile label="Last 7 days" value={naira(data.last_7_days.gmv)} hint={`Novo earned ${naira(data.last_7_days.revenue)}`} />
        <Tile label="Last 30 days" value={naira(data.last_30_days.gmv)} hint={`Novo earned ${naira(data.last_30_days.revenue)}`} />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5">
          <DailyOrdersChart days={data.daily} />
          <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-slate-100 dark:border-slate-800 text-sm">
            <Mini label="Delivered (30 days)" value={String(data.last_30_days.delivered)} />
            <Mini label="Cancelled (30 days)" value={String(data.last_30_days.cancelled)} />
            <Mini label="Average order" value={naira(data.last_30_days.average_order)} />
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-2xl p-5 flex flex-col gap-3">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">Orders in progress</h2>
          <ul className="flex flex-col gap-2">
            {STAGES.map(([s, label]) => (
              <li key={s} className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-300">{label}</span>
                <span className="font-black text-slate-900 dark:text-white">{data.live_orders[s] || 0}</span>
              </li>
            ))}
          </ul>
          <Link href="/admin/orders?view=active" className="text-xs font-bold text-[#087F5B] dark:text-emerald-400 mt-1">Open live orders →</Link>
          <div className="mt-2 pt-3 border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-sm">
            <Mini label="Customers" value={String(data.counts.customers)} />
            <Mini label="Merchants" value={String(data.counts.merchants)} />
            <Mini label="Stores" value={String(data.counts.stores)} />
            <Mini label="Riders online" value={`${data.counts.riders_online} / ${data.counts.riders_approved}`} />
          </div>
        </section>
      </div>

      <section className="bg-white dark:bg-slate-900 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">Latest orders</h2>
          <Link href="/admin/orders" className="text-xs font-bold text-[#087F5B] dark:text-emerald-400">All orders →</Link>
        </div>
        {data.recent_orders.length === 0 ? (
          <p className="text-sm text-slate-500">No orders yet.</p>
        ) : (
          <ul className="">
            {data.recent_orders.map((o: any) => (
              <li key={o.id}>
                <Link href={`/admin/orders?order=${o.id}`} className="flex items-center gap-3 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-2 px-2 rounded-lg">
                  <span className="font-mono text-xs text-slate-500 w-28 shrink-0 truncate">{o.id}</span>
                  <span className="flex-1 min-w-0 truncate text-slate-800 dark:text-slate-200">
                    {o.customer_name} · {o.store_name || "—"}
                  </span>
                  <span className="hidden sm:inline"><StatusBadge status={ORDER_STATUS_FROM_API[o.status] || o.status.toLowerCase()} /></span>
                  <span className="font-bold text-slate-900 dark:text-white">{naira(o.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{value}</p>
      {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

/** Orders per day, last 14 days. One series: brand green, hover tooltip, table view for screen readers. */
function DailyOrdersChart({ days }: { days: { date: string; orders: number; gmv: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...days.map((d) => d.orders));
  const ticks = [0, Math.ceil(max / 2), max];
  const fmt = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });

  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="text-sm font-black text-slate-900 dark:text-white">Orders per day · last 14 days</figcaption>
      <div className="relative h-48 flex">
        {/* y axis */}
        <div className="flex flex-col justify-between text-[10px] text-slate-400 pr-2 pb-5 tabular-nums">
          {[...ticks].reverse().map((t) => <span key={t}>{t}</span>)}
        </div>
        <div className="relative flex-1">
          <div className="absolute inset-x-0 top-0 bottom-5 flex flex-col justify-between pointer-events-none">
            {ticks.map((t) => <div key={t} className="border-slate-100 dark:border-slate-800" />)}
          </div>
          <div className="absolute inset-x-0 top-0 bottom-5 flex items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
            {days.map((d, i) => (
              <div
                key={d.date}
                className="flex-1 h-full flex items-end cursor-default"
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                tabIndex={0}
                aria-label={`${fmt(d.date)}: ${d.orders} orders, ${naira(d.gmv)} delivered`}
              >
                <div
                  className={`w-full rounded-t-[4px] bg-[#087F5B] dark:bg-[#12A37A] ${hover !== null && hover !== i ? "opacity-50" : ""}`}
                  style={{ height: `${(d.orders / max) * 100}%`, minHeight: d.orders ? 3 : 0 }}
                />
              </div>
            ))}
          </div>
          {hover !== null && (
            <div
              className="absolute z-10 -translate-x-1/2 -translate-y-full top-0 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs shadow-lg pointer-events-none whitespace-nowrap"
              style={{ left: `${((hover + 0.5) / days.length) * 100}%` }}
            >
              <p className="font-bold">{fmt(days[hover].date)}</p>
              <p>{days[hover].orders} orders · {naira(days[hover].gmv)} delivered</p>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 flex text-[10px] text-slate-400">
            {days.map((d, i) => (
              <span key={d.date} className="flex-1 text-center">{i % 3 === 0 || i === days.length - 1 ? fmt(d.date) : ""}</span>
            ))}
          </div>
        </div>
      </div>
      <table className="sr-only">
        <caption>Orders per day</caption>
        <thead><tr><th>Date</th><th>Orders</th><th>Delivered value</th></tr></thead>
        <tbody>{days.map((d) => <tr key={d.date}><td>{d.date}</td><td>{d.orders}</td><td>{naira(d.gmv)}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}
