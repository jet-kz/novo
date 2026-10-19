"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Layers, Loader2, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { apiService } from "@/services/api";
import { HomeCollection, PlatformCategory } from "@/types";
import { CategoryIcon, refreshCatalog } from "@/components/shared/useCatalog";

type CategoryDraft = { id?: string; name: string; icon: string; description: string };
type CollectionDraft = { id?: string; title: string; subtitle: string; badge: string; image: string; target_category: string };

const EMPTY_CATEGORY: CategoryDraft = { name: "", icon: "", description: "" };
const EMPTY_COLLECTION: CollectionDraft = { title: "", subtitle: "", badge: "", image: "", target_category: "all" };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<PlatformCategory[]>([]);
  const [collections, setCollections] = useState<HomeCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [catDraft, setCatDraft] = useState<CategoryDraft | null>(null);
  const [colDraft, setColDraft] = useState<CollectionDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const [cats, cols] = await Promise.all([apiService.getPlatformCategories(true), apiService.getHomeCollections(true)]);
      setCategories(cats);
      setCollections(cols);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const run = async (fn: () => Promise<unknown>) => {
    setError(null);
    try {
      await fn();
      await load();
      refreshCatalog();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const move = <T extends { id: string }>(list: T[], index: number, dir: -1 | 1, save: (id: string, order: number) => Promise<unknown>) => {
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    const reordered = [...list];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    run(() => Promise.all(reordered.map((item, i) => save(item.id, i + 1))));
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catDraft) return;
    setSaving(true);
    const payload = { name: catDraft.name, icon: catDraft.icon, description: catDraft.description };
    await run(() => (catDraft.id ? apiService.updatePlatformCategory(catDraft.id, payload) : apiService.createPlatformCategory(payload)));
    setSaving(false);
    setCatDraft(null);
  };

  const saveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colDraft) return;
    setSaving(true);
    const { id, ...payload } = colDraft;
    await run(() => (id ? apiService.updateHomeCollection(id, payload) : apiService.createHomeCollection(payload)));
    setSaving(false);
    setColDraft(null);
  };

  const uploadCollectionImage = async (file?: File) => {
    if (!file || !colDraft) return;
    setUploading(true);
    try {
      const url = await apiService.uploadImage(file, "store-banners");
      setColDraft((d) => (d ? { ...d, image: url } : d));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto mt-20" />;

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl">
      <div>
        <p className="text-xs text-slate-500 mt-1">
          Categories are the shortcuts at the top of the homepage; merchants pick one for their store. Collections are the featured rows below them.
        </p>
      </div>

      {error && <p role="alert" className="text-sm font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-xl p-3">{error}</p>}

      {/* CATEGORIES */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#087F5B]" /> Categories
          </h2>
          <Button size="sm" variant="primary" onClick={() => setCatDraft({ ...EMPTY_CATEGORY })} leftIcon={<Plus className="w-4 h-4" />}>
            Add category
          </Button>
        </div>
        <ul className="bg-white dark:bg-slate-900 rounded-2xl ">
          {categories.map((cat, i) => (
            <li key={cat.id} className={`flex items-center gap-3 p-3 ${cat.is_active ? "" : "opacity-50"}`}>
              <span className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[#087F5B] shrink-0">
                <CategoryIcon category={cat} size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {cat.name} {!cat.is_active && <span className="text-[10px] font-semibold text-slate-400">(hidden)</span>}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {cat.store_count ?? 0} store{cat.store_count === 1 ? "" : "s"} · {cat.description || cat.slug}
                </p>
              </div>
              <IconButton label="Move up" onClick={() => move(categories, i, -1, (id, o) => apiService.updatePlatformCategory(id, { display_order: o }))} disabled={i === 0}>
                <ArrowUp className="w-4 h-4" />
              </IconButton>
              <IconButton label="Move down" onClick={() => move(categories, i, 1, (id, o) => apiService.updatePlatformCategory(id, { display_order: o }))} disabled={i === categories.length - 1}>
                <ArrowDown className="w-4 h-4" />
              </IconButton>
              <IconButton label={cat.is_active ? "Hide" : "Show"} onClick={() => run(() => apiService.updatePlatformCategory(cat.id, { is_active: !cat.is_active }))}>
                {cat.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </IconButton>
              <IconButton label="Edit" onClick={() => setCatDraft({ id: cat.id, name: cat.name, icon: cat.icon || "", description: cat.description || "" })}>
                <Pencil className="w-4 h-4" />
              </IconButton>
              <IconButton
                label="Delete"
                danger
                onClick={() => window.confirm(`Delete "${cat.name}"?`) && run(() => apiService.deletePlatformCategory(cat.id))}
              >
                <Trash2 className="w-4 h-4" />
              </IconButton>
            </li>
          ))}
        </ul>
      </section>

      {/* COLLECTIONS */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#087F5B]" /> Featured collections
          </h2>
          <Button size="sm" variant="primary" onClick={() => setColDraft({ ...EMPTY_COLLECTION })} leftIcon={<Plus className="w-4 h-4" />}>
            Add collection
          </Button>
        </div>
        {collections.length === 0 && <p className="text-sm text-slate-500">No collections yet.</p>}
        <ul className="bg-white dark:bg-slate-900 rounded-2xl ">
          {collections.map((col, i) => (
            <li key={col.id} className={`flex items-center gap-3 p-3 ${col.is_active ? "" : "opacity-50"}`}>
              <span className="w-16 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {col.image && <img src={col.image} alt="" className="w-full h-full object-cover" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{col.title}</p>
                <p className="text-xs text-slate-500 truncate">
                  {col.target_category === "all" ? "All stores" : categories.find((c) => c.slug === col.target_category)?.name || col.target_category}
                  {col.subtitle ? ` · ${col.subtitle}` : ""}
                </p>
              </div>
              <IconButton label="Move up" onClick={() => move(collections, i, -1, (id, o) => apiService.updateHomeCollection(id, { display_order: o }))} disabled={i === 0}>
                <ArrowUp className="w-4 h-4" />
              </IconButton>
              <IconButton label="Move down" onClick={() => move(collections, i, 1, (id, o) => apiService.updateHomeCollection(id, { display_order: o }))} disabled={i === collections.length - 1}>
                <ArrowDown className="w-4 h-4" />
              </IconButton>
              <IconButton label={col.is_active ? "Hide" : "Show"} onClick={() => run(() => apiService.updateHomeCollection(col.id, { is_active: !col.is_active }))}>
                {col.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </IconButton>
              <IconButton
                label="Edit"
                onClick={() =>
                  setColDraft({
                    id: col.id,
                    title: col.title,
                    subtitle: col.subtitle || "",
                    badge: col.badge || "",
                    image: col.image || "",
                    target_category: col.target_category,
                  })
                }
              >
                <Pencil className="w-4 h-4" />
              </IconButton>
              <IconButton label="Delete" danger onClick={() => window.confirm(`Delete "${col.title}"?`) && run(() => apiService.deleteHomeCollection(col.id))}>
                <Trash2 className="w-4 h-4" />
              </IconButton>
            </li>
          ))}
        </ul>
      </section>

      <Modal isOpen={!!catDraft} onClose={() => setCatDraft(null)} title={catDraft?.id ? "Edit category" : "New category"}>
        {catDraft && (
          <form onSubmit={saveCategory} className="flex flex-col gap-4">
            <Input label="Name" value={catDraft.name} onChange={(e) => setCatDraft({ ...catDraft, name: e.target.value })} placeholder="e.g. Fashion" required />
            <Input
              label="Icon (emoji or image link)"
              value={catDraft.icon}
              onChange={(e) => setCatDraft({ ...catDraft, icon: e.target.value })}
              placeholder="e.g. 👗"
            />
            <Input
              label="Short description"
              value={catDraft.description}
              onChange={(e) => setCatDraft({ ...catDraft, description: e.target.value })}
              placeholder="Shown to merchants when they pick a category"
            />
            <Button type="submit" variant="primary" isLoading={saving} disabled={saving}>
              Save
            </Button>
          </form>
        )}
      </Modal>

      <Modal isOpen={!!colDraft} onClose={() => setColDraft(null)} title={colDraft?.id ? "Edit collection" : "New collection"}>
        {colDraft && (
          <form onSubmit={saveCollection} className="flex flex-col gap-4">
            <Input label="Title" value={colDraft.title} onChange={(e) => setColDraft({ ...colDraft, title: e.target.value })} placeholder="e.g. Late-night grills" required />
            <Input label="Subtitle" value={colDraft.subtitle} onChange={(e) => setColDraft({ ...colDraft, subtitle: e.target.value })} placeholder="One short line" />
            <Input label="Badge (optional)" value={colDraft.badge} onChange={(e) => setColDraft({ ...colDraft, badge: e.target.value })} placeholder="e.g. New" />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Shows stores from</label>
              <select
                value={colDraft.target_category}
                onChange={(e) => setColDraft({ ...colDraft, target_category: e.target.value })}
                className="w-full px-4 py-3 bg-[#F8FAF9] dark:bg-slate-800 text-sm outline-none"
              >
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => imageInput.current?.click()}
                className="relative w-28 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer shrink-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {colDraft.image ? <img src={colDraft.image} alt="" className="w-full h-full object-cover" /> : <ImagePlus className="w-5 h-5 text-slate-400" />}
                {uploading && (
                  <span className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </span>
                )}
              </button>
              <span className="text-xs text-slate-500">Optional cover image. Wide photos work best.</span>
              <input ref={imageInput} type="file" accept="image/*" className="hidden" onChange={(e) => uploadCollectionImage(e.target.files?.[0])} />
            </div>
            <Button type="submit" variant="primary" isLoading={saving} disabled={saving || uploading}>
              Save
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded-lg shrink-0 cursor-pointer disabled:opacity-30 disabled:cursor-default ${
        danger ? "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  );
}
