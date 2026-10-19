"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pause, Pencil, Play, Plus, Shuffle, Tag, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { apiService } from "@/services/api";
import type { StorePromo, StorePromoRules } from "@/types";

type Filter = "active" | "inactive" | "all";
type Draft = {
  id?: string;
  code: string;
  promo_type: StorePromo["promo_type"];
  discount_value: string;
  min_order_amount: string;
  max_discount_amount: string;
  starts_at: string;
  ends_at: string;
  per_user_limit: string;
  usage_limit: string;
  name: string;
  locked?: boolean;
};

const naira = (n: number) => `₦${Math.round(n || 0).toLocaleString()}`;
const day = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "");
const toDateInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const fromDateInput = (v: string, endOfDay = false) => (v ? new Date(`${v}T${endOfDay ? "23:59:00" : "00:00:00"}`).toISOString() : "");

const STATE: Record<StorePromo["state"], { text: string; tone: string }> = {
  live: { text: "Live", tone: "bg-emerald-50 text-[#087F5B] dark:bg-emerald-950/50 dark:text-emerald-300" },
  scheduled: { text: "Scheduled", tone: "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300" },
  paused: { text: "Paused", tone: "bg-slate-100 text-slate-500 dark:bg-slate-800" },
  ended: { text: "Ended", tone: "bg-slate-100 text-slate-500 dark:bg-slate-800" },
  used_up: { text: "Used up", tone: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" },
  archived: { text: "Archived", tone: "bg-slate-100 text-slate-500 dark:bg-slate-800" },
};

function describePromo(p: Pick<StorePromo, "promo_type" | "discount_value" | "min_order_amount" | "max_discount_amount">) {
  const what =
    p.promo_type === "PERCENTAGE"
      ? `${p.discount_value}% off${p.max_discount_amount ? ` (up to ${naira(p.max_discount_amount)})` : ""}`
      : p.promo_type === "FIXED"
        ? `${naira(p.discount_value)} off`
        : "Free delivery";
  return `${what}${p.min_order_amount ? ` on orders from ${naira(p.min_order_amount)}` : ""}`;
}

const randomCode = () => {
  const words = ["TASTY", "FRESH", "HAPPY", "SAVE", "YUMMY", "TREAT", "WEEKEND"];
  return words[Math.floor(Math.random() * words.length)] + (10 + Math.floor(Math.random() * 40));
};

const emptyDraft = (): Draft => {
  const now = new Date();
  const later = new Date(now.getTime() + 14 * 86400000);
  return {
    code: "",
    promo_type: "PERCENTAGE",
    discount_value: "10",
    min_order_amount: "2000",
    max_discount_amount: "",
    starts_at: toDateInput(now),
    ends_at: toDateInput(later),
    per_user_limit: "1",
    usage_limit: "",
    name: "",
  };
};

export default function MerchantPromotionsPage() {
  const [promos, setPromos] = useState<StorePromo[] | null>(null);
  const [rules, setRules] = useState<StorePromoRules | null>(null);
  const [filter, setFilter] = useState<Filter>("active");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setPromos(await apiService.getMyPromotions());
      setError(null);
    } catch (e: any) {
      setError(e.message);
      setPromos([]);
    }
  }, []);

  useEffect(() => {
    load();
    apiService.getStorePromoRules().then(setRules).catch(() => {});
  }, [load]);

  const shown = useMemo(() => {
    const list = promos || [];
    if (filter === "active") return list.filter((p) => p.state === "live" || p.state === "scheduled");
    if (filter === "inactive") return list.filter((p) => p.state !== "live" && p.state !== "scheduled");
    return list;
  }, [promos, filter]);
  const liveCount = (promos || []).filter((p) => p.state === "live" || p.state === "scheduled").length;

  const act = async (id: string, fn: () => Promise<unknown>, done?: string) => {
    setBusyId(id);
    setError(null);
    setNotice(null);
    try {
      await fn();
      if (done) setNotice(done);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (p: StorePromo) => {
    setFormError(null);
    setDraft({
      id: p.id,
      code: p.code,
      promo_type: p.promo_type,
      discount_value: String(p.discount_value || ""),
      min_order_amount: String(p.min_order_amount || ""),
      max_discount_amount: p.max_discount_amount ? String(p.max_discount_amount) : "",
      starts_at: p.starts_at ? toDateInput(new Date(p.starts_at)) : "",
      ends_at: p.ends_at ? toDateInput(new Date(p.ends_at)) : "",
      per_user_limit: String(p.per_user_limit || 1),
      usage_limit: p.usage_limit ? String(p.usage_limit) : "",
      name: p.name && p.name !== p.code ? p.name : "",
      locked: p.uses > 0,
    });
  };

  const remove = (p: StorePromo) => {
    const msg = p.uses
      ? `Remove ${p.code}? It has been used ${p.uses} time${p.uses === 1 ? "" : "s"}, so it will be archived (kept for your order history) and stop working right away.`
      : `Delete ${p.code}? Customers won't be able to use it any more.`;
    if (!window.confirm(msg)) return;
    act(p.id, () => apiService.deleteMyPromotion(p.id), p.uses ? `${p.code} archived.` : `${p.code} deleted.`);
  };

  // Mirrors the server rules so mistakes show before saving (the server checks again).
  const check = (d: Draft): string | null => {
    if (!rules) return null;
    const value = Number(d.discount_value);
    const minOrder = Number(d.min_order_amount || 0);
    if (!d.id && !/^[A-Z0-9]{4,16}$/.test(d.code)) return "Code must be 4–16 letters or numbers, e.g. JOLLOF20";
    if (d.promo_type === "PERCENTAGE" && !(value >= rules.min_percent && value <= rules.max_percent))
      return `Percentage off must be between ${rules.min_percent}% and ${rules.max_percent}%`;
    if (d.promo_type === "FIXED") {
      if (!(value >= rules.min_fixed)) return `Amount off must be at least ${naira(rules.min_fixed)}`;
      if (minOrder < value * rules.fixed_needs_min_order_multiple)
        return `${naira(value)} off needs a minimum order of at least ${naira(value * rules.fixed_needs_min_order_multiple)}`;
    }
    if (!d.ends_at) return "Pick an end date";
    if (d.starts_at && d.ends_at < d.starts_at) return "The end date must be after the start date";
    return null;
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    const problem = check(draft);
    if (problem) return setFormError(problem);
    setSaving(true);
    setFormError(null);
    const payload: Record<string, unknown> = {
      starts_at: fromDateInput(draft.starts_at) || undefined,
      ends_at: fromDateInput(draft.ends_at, true),
      per_user_limit: Number(draft.per_user_limit) || 1,
      usage_limit: draft.usage_limit ? Number(draft.usage_limit) : null,
      name: draft.name.trim() || undefined,
    };
    if (!draft.locked) {
      Object.assign(payload, {
        promo_type: draft.promo_type,
        discount_value: Number(draft.discount_value) || 0,
        min_order_amount: Number(draft.min_order_amount) || 0,
        max_discount_amount: draft.promo_type === "PERCENTAGE" && draft.max_discount_amount ? Number(draft.max_discount_amount) : null,
      });
    }
    try {
      if (draft.id) await apiService.updateMyPromotion(draft.id, payload as Partial<StorePromo>);
      else await apiService.createMyPromotion({ ...(payload as Partial<StorePromo>), code: draft.code });
      setNotice(draft.id ? `${draft.code} updated.` : `${draft.code} is ready. Share it with your customers.`);
      setDraft(null);
      await load();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const preview = draft
    ? describePromo({
        promo_type: draft.promo_type,
        discount_value: Number(draft.discount_value) || 0,
        min_order_amount: Number(draft.min_order_amount) || 0,
        max_discount_amount: Number(draft.max_discount_amount) || null,
      })
    : "";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Promotions</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Codes your customers type at checkout. Your store pays for the discount: it comes out of your earnings for that order.
          </p>
        </div>
        <button
          onClick={() => {
            setFormError(null);
            setDraft(emptyDraft());
          }}
          disabled={!!rules && liveCount >= rules.max_live_codes}
          title={rules && liveCount >= rules.max_live_codes ? `You already have ${rules.max_live_codes} codes running` : undefined}
          className="h-11 px-5 rounded-2xl bg-[#087F5B] text-white text-sm font-semibold flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" /> New code
        </button>
      </div>

      {rules && (
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            `${rules.min_percent}–${rules.max_percent}% off`,
            `${naira(rules.min_fixed)}+ off needs ${rules.fixed_needs_min_order_multiple}× that as minimum order`,
            `Up to ${rules.max_live_codes} live codes (${liveCount} now)`,
            `Runs up to ${rules.max_days} days`,
            `Max ${rules.max_per_customer} uses per customer`,
          ].map((r) => (
            <span key={r} className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300">{r}</span>
          ))}
        </div>
      )}

      {error && <p role="alert" className="text-sm text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-2xl px-4 py-3">{error}</p>}
      {notice && <p role="status" className="text-sm text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-200 rounded-2xl px-4 py-3">{notice}</p>}

      <div className="flex gap-2">
        {([
          ["active", "Running"],
          ["inactive", "Paused & ended"],
          ["all", "All"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`h-9 px-4 rounded-full text-[13px] font-semibold cursor-pointer ${
              filter === id ? "bg-[#087F5B] text-white" : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {promos === null ? (
        <Loader2 className="w-6 h-6 animate-spin text-[#087F5B] mx-auto mt-8" />
      ) : shown.length === 0 ? (
        <div className="py-14 text-center flex flex-col items-center gap-3">
          <span className="w-14 h-14 rounded-[20px] bg-emerald-50 dark:bg-emerald-950/40 text-[#087F5B] flex items-center justify-center">
            <Tag className="w-6 h-6" />
          </span>
          <p className="text-sm text-slate-500 max-w-xs">
            {filter === "active" ? "No codes running. Create one to bring customers back." : "Nothing here."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col -mx-3">
          {shown.map((p) => {
            const st = STATE[p.state];
            const running = p.state === "live" || p.state === "scheduled";
            return (
              <li key={p.id} className={`flex flex-col gap-2 px-3 py-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900 ${busyId === p.id ? "opacity-60" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[15px] font-bold tracking-wide px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#087F5B] dark:text-emerald-300">
                    {p.code}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${st.tone}`}>{st.text}</span>
                  <div className="ml-auto flex items-center gap-1">
                    {(running || p.state === "paused") && (
                      <IconBtn
                        label={running ? "Pause" : "Resume"}
                        onClick={() => act(p.id, () => apiService.updateMyPromotion(p.id, { is_active: !p.is_active }), running ? `${p.code} paused.` : `${p.code} is running again.`)}
                      >
                        {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </IconBtn>
                    )}
                    <IconBtn label="Edit" onClick={() => openEdit(p)}>
                      <Pencil className="w-4 h-4" />
                    </IconBtn>
                    <IconBtn label="Delete" danger onClick={() => remove(p)}>
                      <Trash2 className="w-4 h-4" />
                    </IconBtn>
                  </div>
                </div>
                <div>
                  <p className="text-[15px] font-semibold">{describePromo(p)}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {p.state === "scheduled" ? `Starts ${day(p.starts_at)}` : `Ends ${day(p.ends_at)}`} · {p.uses} use{p.uses === 1 ? "" : "s"}
                    {p.usage_limit ? ` of ${p.usage_limit}` : ""} · {naira(p.discount_given)} given · {p.per_user_limit}× per customer
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal isOpen={!!draft} onClose={() => setDraft(null)} title={draft?.id ? `Edit ${draft.code}` : "New promo code"} maxWidth="lg">
        {draft && (
          <form onSubmit={save} className="flex flex-col gap-4">
            {!draft.id && (
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-slate-600 dark:text-slate-300">Code customers type</span>
                <span className="flex gap-2">
                  <input
                    value={draft.code}
                    onChange={(e) => set({ code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16) })}
                    placeholder="e.g. JOLLOF20"
                    className="flex-1 h-12 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 font-mono text-[15px] tracking-wide outline-none focus:ring-2 focus:ring-[#087F5B]/30"
                  />
                  <button type="button" onClick={() => set({ code: randomCode() })} className="h-12 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold flex items-center gap-1.5 cursor-pointer">
                    <Shuffle className="w-4 h-4" /> Suggest
                  </button>
                </span>
              </label>
            )}

            {draft.locked && (
              <p className="text-sm text-amber-800 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-200 rounded-2xl px-4 py-3">
                Customers have used this code, so the discount itself can&apos;t change. You can still change the dates and limits.
              </p>
            )}

            <fieldset disabled={draft.locked} className="flex flex-col gap-4 disabled:opacity-60">
              <div className="grid grid-cols-3 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
                {([
                  ["PERCENTAGE", "% off"],
                  ["FIXED", "₦ off"],
                  ["FREE_DELIVERY", "Free delivery"],
                ] as const).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => set({ promo_type: id, discount_value: id === "PERCENTAGE" ? "10" : id === "FIXED" ? "500" : "0" })}
                    className={`h-10 rounded-xl text-sm font-semibold cursor-pointer ${draft.promo_type === id ? "bg-white dark:bg-slate-900 shadow-sm" : "text-slate-500"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {draft.promo_type !== "FREE_DELIVERY" && (
                  <Field
                    label={draft.promo_type === "PERCENTAGE" ? "Percent off" : "Amount off (₦)"}
                    value={draft.discount_value}
                    onChange={(v) => set({ discount_value: v })}
                    suffix={draft.promo_type === "PERCENTAGE" ? "%" : undefined}
                  />
                )}
                <Field label="Minimum order (₦)" value={draft.min_order_amount} onChange={(v) => set({ min_order_amount: v })} />
                {draft.promo_type === "PERCENTAGE" && (
                  <Field label="Max discount (₦, optional)" value={draft.max_discount_amount} onChange={(v) => set({ max_discount_amount: v })} />
                )}
              </div>
            </fieldset>

            <div className="grid grid-cols-2 gap-3">
              <DateField label="Starts" value={draft.starts_at} onChange={(v) => set({ starts_at: v })} disabled={!!draft.id && draft.locked} />
              <DateField label="Ends" value={draft.ends_at} onChange={(v) => set({ ends_at: v })} />
              <Field label="Uses per customer" value={draft.per_user_limit} onChange={(v) => set({ per_user_limit: v })} />
              <Field label="Total uses (optional)" value={draft.usage_limit} onChange={(v) => set({ usage_limit: v })} placeholder="No limit" />
            </div>

            <p className="text-sm rounded-2xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3">
              Customers get <strong>{preview}</strong>
              {draft.ends_at ? `, until ${new Date(draft.ends_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}` : ""}. You pay the discount.
            </p>

            {formError && <p role="alert" className="text-sm text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-2xl px-4 py-3">{formError}</p>}
            <button type="submit" disabled={saving} className="h-12 rounded-2xl bg-[#087F5B] text-white text-[15px] font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {draft.id ? "Save changes" : "Create code"}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}

function Field({ label, value, onChange, suffix, placeholder }: { label: string; value: string; onChange: (v: string) => void; suffix?: string; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-slate-600 dark:text-slate-300">{label}</span>
      <span className="relative">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
          inputMode="decimal"
          placeholder={placeholder}
          className="w-full h-12 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[15px] outline-none focus:ring-2 focus:ring-[#087F5B]/30"
        />
        {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{suffix}</span>}
      </span>
    </label>
  );
}

function DateField({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-slate-600 dark:text-slate-300">{label}</span>
      <input
        type="date"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-12 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[15px] outline-none focus:ring-2 focus:ring-[#087F5B]/30 disabled:opacity-60"
      />
    </label>
  );
}

function IconBtn({ children, label, onClick, danger }: { children: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer ${
        danger ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
