"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { apiService } from "@/services/api";
import { usePlatform } from "@/store/PlatformContext";
import { useCatalog } from "@/components/shared/useCatalog";
import type { PromoBanner } from "@/types";

type Draft = Partial<PromoBanner> & { link_kind?: "none" | "store" | "category" | "custom" };

const STATE: Record<string, { text: string; tone: string }> = {
  live: { text: "Live", tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" },
  scheduled: { text: "Scheduled", tone: "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300" },
  ended: { text: "Ended", tone: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
  hidden: { text: "Hidden", tone: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
};

const EMPTY: Draft = { title: "", subtitle: "", image: "", cta_label: "Order now", link_url: "/shop", placement: "home", show_text: true, is_active: true, link_kind: "custom" };

/** <input type="datetime-local"> wants local time without a zone. */
const toLocalInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);
const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "");

function linkKind(url?: string | null): Draft["link_kind"] {
  if (!url) return "none";
  if (/^\/shop\?store=/.test(url)) return "store";
  if (/^\/shop\?category=/.test(url)) return "category";
  return "custom";
}

export default function AdminBannersPage() {
  const { stores } = usePlatform();
  const { categories } = useCatalog();
  const [rows, setRows] = useState<PromoBanner[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      setRows(await apiService.getBanners("all", true));
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const flushCache = () => {
    try {
      Object.keys(sessionStorage).filter((k) => k.startsWith("novo_banners_v1")).forEach((k) => sessionStorage.removeItem(k));
    } catch {}
  };

  const act = async (id: string, fn: () => Promise<unknown>) => {
    setBusyId(id);
    setError(null);
    try {
      await fn();
      flushCache();
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const move = (i: number, dir: -1 | 1) => {
    if (!rows) return;
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
    act(rows[i].id, () => apiService.reorderBanners(next.map((r) => r.id)));
  };

  const upload = async (file?: File) => {
    if (!file || !draft) return;
    setUploading(true);
    setError(null);
    try {
      const url = await apiService.uploadImage(file, "promo-banners");
      setDraft((d) => (d ? { ...d, image: url } : d));
    } catch (e: any) {
      setError(e.message || "Couldn't upload that image.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    if (!draft.image) return setError("Upload the banner image first.");
    setSaving(true);
    setError(null);
    const { link_kind, state, id, ...payload } = draft as any;
    if (link_kind === "none") payload.link_url = null;
    try {
      if (id) await apiService.updateBanner(id, payload);
      else await apiService.createBanner(payload);
      flushCache();
      setDraft(null);
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (patch: Draft) => setDraft((d) => (d ? { ...d, ...patch } : d));

  return (
    <div className="flex flex-col gap-5 w-full max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-slate-500 max-w-2xl">
          Banners rotate at the top of the home screen every 5 seconds. Use them for promos, new stores or announcements. Schedule one to go live and come down on its own.
        </p>
        <button
          onClick={() => setDraft({ ...EMPTY })}
          className="h-11 px-5 rounded-2xl bg-[#087F5B] text-white text-sm font-semibold flex items-center gap-2 shrink-0 cursor-pointer hover:bg-[#066A4C]"
        >
          <Plus className="w-4 h-4" /> New banner
        </button>
      </div>

      {error && <p role="alert" className="text-sm font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-2xl p-3">{error}</p>}

      {rows === null ? (
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto mt-16" />
      ) : rows.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center flex flex-col items-center gap-3">
          <span className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-[#087F5B] flex items-center justify-center">
            <ImagePlus className="w-6 h-6" />
          </span>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">No banners yet</p>
          <p className="text-sm text-slate-500 max-w-sm">Customers see a default Novo banner until you add one.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rows.map((b, i) => {
            const st = STATE[b.state || "live"];
            return (
              <li key={b.id} className={`bg-white dark:bg-slate-900 rounded-3xl overflow-hidden flex flex-col ${busyId === b.id ? "opacity-60" : ""}`}>
                <BannerPreview banner={b} />
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{b.title || "Image-only banner"}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {b.placement === "shop" ? "Stores page" : "Home"} · {b.link_url || "No link"}
                      </p>
                      {(b.starts_at || b.ends_at) && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {b.starts_at ? `From ${when(b.starts_at)}` : "Now"} {b.ends_at ? `until ${when(b.ends_at)}` : ""}
                        </p>
                      )}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 ${st.tone}`}>{st.text}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Tool label="Move earlier" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="w-4 h-4" /></Tool>
                    <Tool label="Move later" onClick={() => move(i, 1)} disabled={i === rows.length - 1}><ArrowDown className="w-4 h-4" /></Tool>
                    <Tool label={b.is_active ? "Hide" : "Show"} onClick={() => act(b.id, () => apiService.updateBanner(b.id, { is_active: !b.is_active }))}>
                      {b.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Tool>
                    <Tool label="Edit" onClick={() => setDraft({ ...b, link_kind: linkKind(b.link_url) })}><Pencil className="w-4 h-4" /></Tool>
                    <span className="flex-1" />
                    <Tool
                      label="Delete"
                      danger
                      onClick={() => window.confirm("Delete this banner?") && act(b.id, () => apiService.deleteBanner(b.id))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Tool>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal isOpen={!!draft} onClose={() => setDraft(null)} title={draft?.id ? "Edit banner" : "New banner"} maxWidth="xl">
        {draft && (
          <form onSubmit={save} className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative w-full rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer group"
              aria-label={draft.image ? "Replace image" : "Upload image"}
            >
              {draft.image ? (
                <BannerPreview banner={draft as PromoBanner} />
              ) : (
                <div className="aspect-[5/2] flex flex-col items-center justify-center gap-2 text-slate-500">
                  <ImagePlus className="w-7 h-7" />
                  <span className="text-sm font-semibold">Upload banner image</span>
                  <span className="text-xs">Wide image, ideally 1800 × 720 or larger. JPG, PNG or WebP.</span>
                </div>
              )}
              {draft.image && (
                <span className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-white/90 text-slate-900 text-xs font-semibold opacity-90 group-hover:opacity-100">
                  Change image
                </span>
              )}
              {uploading && (
                <span className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </span>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />

            <Toggle
              on={draft.show_text !== false}
              onChange={(v) => set({ show_text: v })}
              label="Show title and button over the image"
              hint="Turn off if your artwork already has its own text."
            />

            {draft.show_text !== false && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Title" value={draft.title || ""} onChange={(v) => set({ title: v })} placeholder="e.g. 20% off your first order" max={120} />
                <Field label="Button text" value={draft.cta_label || ""} onChange={(v) => set({ cta_label: v })} placeholder="Order now" max={40} />
                <div className="sm:col-span-2">
                  <Field label="Subtitle" value={draft.subtitle || ""} onChange={(v) => set({ subtitle: v })} placeholder="Short supporting line" max={240} />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">When tapped, open</span>
              <div className="flex flex-wrap gap-1.5">
                {([
                  ["none", "Nothing"],
                  ["store", "A store"],
                  ["category", "A category"],
                  ["custom", "A link"],
                ] as const).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => set({ link_kind: k, link_url: k === "none" ? null : k === "custom" ? draft.link_url || "/shop" : null })}
                    className={`px-3.5 py-2 rounded-full text-xs font-semibold cursor-pointer ${
                      draft.link_kind === k ? "bg-[#087F5B] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {draft.link_kind === "store" && (
                <select
                  value={(draft.link_url || "").replace("/shop?store=", "")}
                  onChange={(e) => set({ link_url: e.target.value ? `/shop?store=${e.target.value}` : null })}
                  className="h-11 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-sm outline-none cursor-pointer"
                >
                  <option value="">Choose a store…</option>
                  {stores.map((st) => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              )}
              {draft.link_kind === "category" && (
                <select
                  value={(draft.link_url || "").replace("/shop?category=", "")}
                  onChange={(e) => set({ link_url: e.target.value ? `/shop?category=${e.target.value}` : null })}
                  className="h-11 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-sm outline-none cursor-pointer"
                >
                  <option value="">Choose a category…</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              )}
              {draft.link_kind === "custom" && (
                <Field label="" value={draft.link_url || ""} onChange={(v) => set({ link_url: v })} placeholder="/shop or https://…" />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Show on</span>
                <select
                  value={draft.placement || "home"}
                  onChange={(e) => set({ placement: e.target.value as PromoBanner["placement"] })}
                  className="h-11 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-sm outline-none cursor-pointer"
                >
                  <option value="home">Home screen</option>
                  <option value="shop">Stores page</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Starts (optional)</span>
                <input
                  type="datetime-local"
                  value={toLocalInput(draft.starts_at)}
                  onChange={(e) => set({ starts_at: fromLocalInput(e.target.value) })}
                  className="h-11 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-sm outline-none"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Ends (optional)</span>
                <input
                  type="datetime-local"
                  value={toLocalInput(draft.ends_at)}
                  onChange={(e) => set({ ends_at: fromLocalInput(e.target.value) })}
                  className="h-11 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-sm outline-none"
                />
              </label>
            </div>

            <Toggle on={draft.is_active !== false} onChange={(v) => set({ is_active: v })} label="Visible to customers" />

            <button
              type="submit"
              disabled={saving || uploading || !draft.image}
              className="h-12 rounded-2xl bg-[#087F5B] text-white text-sm font-semibold disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {draft.id ? "Save banner" : "Publish banner"}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}

function BannerPreview({ banner }: { banner: PromoBanner }) {
  return (
    <div className="relative w-full aspect-[5/2] bg-slate-900 overflow-hidden">
      {banner.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={banner.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
      )}
      {banner.show_text && (banner.title || banner.subtitle || banner.cta_label) && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/45 to-transparent" />
          <div className="relative h-full flex flex-col justify-center gap-1 p-5 max-w-[65%] text-left">
            {banner.title && <p className="text-lg font-extrabold text-white leading-tight">{banner.title}</p>}
            {banner.subtitle && <p className="text-xs text-white/85 line-clamp-2">{banner.subtitle}</p>}
            {banner.cta_label && banner.link_url && (
              <span className="mt-1.5 inline-flex w-fit h-8 px-3.5 items-center rounded-full bg-white text-slate-900 text-xs font-bold">{banner.cta_label}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, max }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; max?: number }) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</span>}
      <input
        value={value}
        maxLength={max}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 px-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#087F5B]/30"
      />
    </label>
  );
}

function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex items-center gap-3 text-left cursor-pointer">
      <span className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${on ? "bg-[#087F5B]" : "bg-slate-300 dark:bg-slate-700"}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
      </span>
      <span>
        <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</span>
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      </span>
    </button>
  );
}

function Tool({ children, label, onClick, disabled, danger }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-30 cursor-pointer ${
        danger ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
