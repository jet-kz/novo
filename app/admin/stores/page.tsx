"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, BadgeCheck, Loader2, Mail, MapPinOff, Phone, Search, Settings2 } from "lucide-react";
import { apiService } from "@/services/api";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { refreshCatalog, useCatalog } from "@/components/shared/useCatalog";

type StoreRow = {
  id: string; name: string; category: string; address: string | null; phone: string | null;
  is_verified: boolean; is_open: boolean; pinned: boolean; logo: string | null; delivered_orders: number;
};
type MerchantRow = {
  id: string; name: string; status: string; owner_id: string;
  owner: { email?: string; name?: string; phone?: string }; stores: StoreRow[];
};

const FILTERS: [string, string][] = [["pending", "Waiting for approval"], ["all", "All"], ["suspended", "Suspended"], ["unpinned", "Not on the map"]];

export default function AdminStoresPage() {
  const { categories } = useCatalog();
  const [merchants, setMerchants] = useState<MerchantRow[] | null>(null);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [configuring, setConfiguring] = useState<{ merchant: MerchantRow; store: StoreRow } | null>(null);

  const load = useCallback(async () => {
    try {
      setMerchants(await apiService.adminMerchants());
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const run = async (key: string, fn: () => Promise<unknown>, message: string) => {
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      await fn();
      setNotice(message);
      await load();
      refreshCatalog();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (merchants || []).filter((m) => {
      const text = [m.name, m.owner.email, m.owner.name, ...m.stores.map((s) => s.name)].join(" ").toLowerCase();
      if (term && !text.includes(term)) return false;
      if (filter === "pending") return m.stores.some((s) => !s.is_verified);
      if (filter === "suspended") return m.status !== "active";
      if (filter === "unpinned") return m.stores.some((s) => !s.pinned);
      return true;
    });
  }, [merchants, filter, q]);

  const catName = (slug: string) => categories.find((c) => c.slug === slug)?.name || slug;

  if (!merchants) return error ? <p className="text-sm text-rose-600">{error}</p> : <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto mt-20" />;

  return (
    <div className="flex flex-col gap-4 w-full max-w-6xl">
      <p className="text-sm text-slate-500">
        Approved stores appear to customers. Stores must also be pinned on the map, or delivery distances and fees will be wrong.
      </p>
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none flex-1">
          {FILTERS.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${
                filter === id ? "bg-[#087F5B] text-white" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Store, merchant or owner email" aria-label="Search stores"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40" />
        </div>
      </div>

      {error && <p role="alert" className="text-sm font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-xl p-3">{error}</p>}
      {notice && <p role="status" className="text-sm font-semibold text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl p-3">{notice}</p>}

      {shown.length === 0 && <p className="text-sm text-slate-500 bg-white dark:bg-slate-900 rounded-2xl p-8 text-center">Nothing here.</p>}

      {shown.map((m) => (
        <section key={m.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                {m.name}
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${m.status === "active" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"}`}>
                  {m.status === "active" ? "Active" : m.status === "pending" ? "Under review" : "Suspended"}
                </span>
              </p>
              <p className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                <span>{m.owner.name || "Owner"}</span>
                {m.owner.email && <a href={`mailto:${m.owner.email}`} className="inline-flex items-center gap-1 text-[#087F5B]"><Mail className="w-3 h-3" />{m.owner.email}</a>}
                {m.owner.phone && <a href={`tel:${m.owner.phone}`} className="inline-flex items-center gap-1 text-[#087F5B]"><Phone className="w-3 h-3" />{m.owner.phone}</a>}
                {!m.owner.email && <span className="text-amber-600">No login account (demo data)</span>}
              </p>
            </div>
            <Button
              size="sm"
              variant={m.status === "active" ? "ghost" : "primary"}
              disabled={busy === m.id}
              onClick={() => {
                const suspend = m.status === "active";
                if (suspend && !window.confirm(`Suspend ${m.name}? Their stores stop receiving orders.`)) return;
                run(m.id, () => apiService.toggleMerchantStatus(m.id, !suspend), suspend ? `${m.name} suspended` : `${m.name} reactivated`);
              }}
            >
              {m.status === "active" ? "Suspend merchant" : "Reactivate merchant"}
            </Button>
          </div>

          {m.stores.length === 0 ? (
            <p className="text-xs text-slate-500">No store set up yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {m.stores.map((s) => (
                <li key={s.id} className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {s.logo && <img src={s.logo} alt="" className="w-full h-full object-cover" />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {s.name}
                        {s.is_verified && <BadgeCheck className="w-4 h-4 text-[#087F5B]" aria-label="Approved" />}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {catName(s.category)} · {s.address || "No address"} · {s.delivered_orders} delivered
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {!s.is_verified && <Tag tone="amber" icon={<AlertTriangle className="w-3 h-3" />} text="Waiting for approval" />}
                        {!s.pinned && <Tag tone="rose" icon={<MapPinOff className="w-3 h-3" />} text="Not pinned on map" />}
                        <Tag tone={s.is_open ? "emerald" : "slate"} text={s.is_open ? "Open" : "Closed"} />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <Button
                      size="sm"
                      variant={s.is_verified ? "ghost" : "primary"}
                      disabled={busy === s.id}
                      onClick={() => run(s.id, () => apiService.verifyStore(s.id, !s.is_verified), s.is_verified ? `${s.name} hidden from customers` : `${s.name} approved — it's live`)}
                    >
                      {s.is_verified ? "Withdraw approval" : "Approve"}
                    </Button>
                    <Button size="sm" variant="ghost" disabled={busy === s.id} onClick={() => run(s.id, () => apiService.toggleStoreOpenStatus(s.id), s.is_open ? `${s.name} closed` : `${s.name} opened`)}>
                      {s.is_open ? "Close" : "Open"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfiguring({ merchant: m, store: s })} leftIcon={<Settings2 className="w-3.5 h-3.5" />}>
                      Settings
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      {configuring && (
        <StoreSettings
          key={configuring.store.id}
          merchant={configuring.merchant}
          store={configuring.store}
          onClose={() => setConfiguring(null)}
          onSaved={async (msg) => {
            setConfiguring(null);
            setNotice(msg);
            await load();
            refreshCatalog();
          }}
        />
      )}
    </div>
  );
}

function Tag({ tone, text, icon }: { tone: "amber" | "rose" | "emerald" | "slate"; text: string; icon?: React.ReactNode }) {
  const tones = {
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
    emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
    slate: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  };
  return <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${tones[tone]}`}>{icon}{text}</span>;
}

function StoreSettings({ merchant, store, onClose, onSaved }: { merchant: MerchantRow; store: StoreRow; onClose: () => void; onSaved: (msg: string) => Promise<void> }) {
  const { categories } = useCatalog();
  const [category, setCategory] = useState(store.category);
  const [commission, setCommission] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (category !== store.category) await apiService.updateStore(store.id, { store_type: category } as any);
      if (commission.trim() !== "") {
        const rate = Number(commission);
        if (!(rate >= 0 && rate <= 100)) throw new Error("Commission must be between 0 and 100%");
        await apiService.saveCommissionRule({ name: `${merchant.name} commission`, rule_type: "PERCENTAGE", value: rate, merchant_id: merchant.id, is_active: true });
      }
      await onSaved(`${store.name} updated`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={`${store.name} settings`} subtitle={merchant.name}>
      <form onSubmit={save} className="flex flex-col gap-4">
        {error && <p role="alert" className="text-sm font-semibold text-rose-700 bg-rose-50 rounded-xl p-3">{error}</p>}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Homepage category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 bg-[#F8FAF9] dark:bg-slate-800 text-sm outline-none">
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
        <Input
          label="Commission for this merchant (%)"
          value={commission}
          onChange={(e) => setCommission(e.target.value.replace(/[^\d.]/g, ""))}
          placeholder="Leave blank to keep the platform default"
          inputMode="decimal"
        />
        <p className="text-xs text-slate-500">Platform-wide commission, delivery and service fees are under Pricing &amp; promotions.</p>
        <Button type="submit" variant="primary" isLoading={busy} disabled={busy}>Save</Button>
      </form>
    </Modal>
  );
}
