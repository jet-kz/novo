"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Minus, Plus, Trash2 } from "lucide-react";
import type { GroupOption, OptionGroup, Product } from "@/types";

const uid = () => Math.random().toString(36).slice(2, 10);

type Template = { label: string; name: string; min: number; max: number; options: string[] };

const FOOD_TEMPLATES: Template[] = [
  { label: "Protein", name: "Choose your protein", min: 1, max: 1, options: ["Chicken", "Beef", "Fish"] },
  { label: "Extra meat", name: "Extra protein", min: 0, max: 3, options: ["Chicken", "Beef", "Goat meat"] },
  { label: "Swallow", name: "Choose your swallow", min: 1, max: 1, options: ["Eba", "Pounded yam", "Semo"] },
  { label: "Sides", name: "Add sides", min: 0, max: 4, options: ["Plantain", "Coleslaw", "Moi moi"] },
  { label: "Drink", name: "Add a drink", min: 0, max: 2, options: ["Coke", "Fanta", "Water"] },
  { label: "Spice", name: "How spicy?", min: 1, max: 1, options: ["Mild", "Medium", "Hot"] },
];
const SHOP_TEMPLATES: Template[] = [
  { label: "Size", name: "Choose size", min: 1, max: 1, options: ["Small", "Medium", "Large"] },
  { label: "Weight", name: "Choose weight", min: 1, max: 1, options: ["500g", "1kg", "2kg"] },
  { label: "Pack", name: "Pack size", min: 1, max: 1, options: ["Single", "Pack of 6", "Carton"] },
  { label: "Flavour", name: "Choose flavour", min: 1, max: 1, options: [] },
  { label: "Add-ons", name: "Add-ons", min: 0, max: 5, options: [] },
];

const capacity = (g: OptionGroup) => Math.max(1, g.options.reduce((n, o) => n + Math.max(1, o.max_qty || 1), 0));

export function groupsProblem(groups: OptionGroup[]): string | null {
  for (const g of groups) {
    if (!g.name.trim()) return "Give every option group a name, e.g. “Choose your protein”.";
    const named = g.options.filter((o) => o.name.trim());
    if (named.length === 0) return `Add at least one choice to “${g.name}”.`;
    if (g.options.some((o) => !o.name.trim() && o.price)) return `A choice in “${g.name}” has a price but no name.`;
  }
  return null;
}

/** Drop blank rows and clamp rules before saving. */
export function cleanGroups(groups: OptionGroup[]): OptionGroup[] {
  return groups.map((g) => {
    const options = g.options.filter((o) => o.name.trim()).map((o) => ({ ...o, name: o.name.trim(), price: Math.max(0, Number(o.price) || 0) }));
    const cap = Math.max(1, options.reduce((n, o) => n + Math.max(1, o.max_qty || 1), 0));
    const max = Math.min(Math.max(1, g.max), cap);
    return { ...g, name: g.name.trim(), options, max, min: Math.min(g.min, max) };
  });
}

interface Props {
  groups: OptionGroup[];
  onChange: (groups: OptionGroup[]) => void;
  /** Other items in the store, to copy their options. */
  otherProducts?: Product[];
  isFood?: boolean;
}

/**
  * Lets a merchant describe how an item can be customised: any number of groups
    * (protein, swallow, size, drinks...), each with its own rules and priced choices.
      */
export function OptionGroupsEditor({ groups, onChange, otherProducts = [], isFood = true }: Props) {
  const [copyFrom, setCopyFrom] = useState("");
  const update = (i: number, patch: Partial<OptionGroup>) => onChange(groups.map((g, idx) => (idx === i ? { ...g, ...patch } : g)));
  const updateOption = (gi: number, oi: number, patch: Partial<GroupOption>) =>
    update(gi, { options: groups[gi].options.map((o, idx) => (idx === oi ? { ...o, ...patch } : o)) });
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= groups.length) return;
    const next = [...groups];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const addGroup = (t?: Template) =>
    onChange([
      ...groups,
      {
        id: uid(),
        name: t?.name || "",
        min: t?.min ?? 0,
        max: t?.max ?? 1,
        options: (t?.options.length ? t.options : [""]).map((name) => ({ id: uid(), name, price: 0, available: true, max_qty: 1 })),
      },
    ]);

  const copyable = otherProducts.filter((p) => (p.optionGroups || []).length > 0);
  const doCopy = () => {
    const src = copyable.find((p) => p.id === copyFrom);
    if (!src) return;
    const copies = (src.optionGroups || []).map((g) => ({ ...g, id: uid(), options: g.options.map((o) => ({ ...o, id: uid() })) }));
    onChange([...groups, ...copies]);
    setCopyFrom("");
  };

  const templates = isFood ? [...FOOD_TEMPLATES, ...SHOP_TEMPLATES.slice(0, 1)] : [...SHOP_TEMPLATES, ...FOOD_TEMPLATES.slice(4, 5)];

  return (
    <div className="flex flex-col gap-3">
      {groups.map((g, gi) => {
        const cap = capacity(g);
        const required = g.min > 0;
        return (
          <div key={g.id} className="rounded-3xl bg-slate-50 dark:bg-slate-800/60 p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <input
                value={g.name}
                onChange={(e) => update(gi, { name: e.target.value })}
                placeholder="Group name, e.g. Choose your protein"
                className="flex-1 min-w-0 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#087F5B]/40"
              />
              <IconBtn label="Move up" onClick={() => move(gi, -1)} disabled={gi === 0}><ChevronUp className="w-4 h-4" /></IconBtn>
              <IconBtn label="Move down" onClick={() => move(gi, 1)} disabled={gi === groups.length - 1}><ChevronDown className="w-4 h-4" /></IconBtn>
              <IconBtn label="Remove group" onClick={() => onChange(groups.filter((_, i) => i !== gi))} danger><Trash2 className="w-4 h-4" /></IconBtn>
            </div>

            {/* Rules */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="inline-flex p-1 rounded-2xl bg-white dark:bg-slate-900">
                {[
                  { on: true, text: "Required" },
                  { on: false, text: "Optional" },
                ].map((r) => (
                  <button
                    key={r.text}
                    type="button"
                    onClick={() => update(gi, { min: r.on ? Math.max(1, Math.min(g.min || 1, g.max)) : 0 })}
                    className={`px-3 py-1.5 rounded-xl font-semibold cursor-pointer transition-colors ${
                      required === r.on ? "bg-[#087F5B] text-white" : "text-slate-500"
                    }`}
                  >
                    {r.text}
                  </button>
                ))}
              </div>
              {required && g.max > 1 && (
                <Stepper label="At least" value={g.min} min={1} max={g.max} onChange={(v) => update(gi, { min: v })} />
              )}
              <Stepper
                label={g.max === 1 ? "Pick" : "Up to"}
                value={Math.min(g.max, cap)}
                min={Math.max(1, g.min)}
                max={cap}
                onChange={(v) => update(gi, { max: v })}
                suffix={g.max === 1 ? "only" : undefined}
              />
            </div>

            {/* Choices */}
            <ul className="flex flex-col gap-1.5">
              {g.options.map((o, oi) => (
                <li key={o.id} className={`flex flex-wrap sm:flex-nowrap items-center gap-2 rounded-2xl bg-white dark:bg-slate-900 p-1.5 ${o.available === false ? "opacity-60" : ""}`}>
                  <input
                    value={o.name}
                    onChange={(e) => updateOption(gi, oi, { name: e.target.value })}
                    placeholder="Choice, e.g. Goat meat"
                    className="basis-full sm:basis-auto sm:flex-1 min-w-0 px-2.5 py-2 bg-transparent text-sm outline-none"
                  />
                  <span className="flex items-center whitespace-nowrap rounded-xl bg-slate-50 dark:bg-slate-800 px-2 ml-auto sm:ml-0">
                    <span className="text-xs text-slate-400">+₦</span>
                    <input
                      value={o.price ? String(o.price) : ""}
                      onChange={(e) => updateOption(gi, oi, { price: Number(e.target.value.replace(/[^\d.]/g, "")) || 0 })}
                      inputMode="decimal"
                      placeholder="0"
                      aria-label={`Extra price for ${o.name || "this choice"}`}
                      className="w-16 py-2 pl-1 bg-transparent text-sm outline-none"
                    />
                  </span>
                  {g.max > 1 && (
                    <select
                      value={o.max_qty || 1}
                      onChange={(e) => updateOption(gi, oi, { max_qty: Number(e.target.value) })}
                      aria-label="How many of this a customer can add"
                      title="How many of this one choice a customer can add"
                      className="py-2 px-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs outline-none cursor-pointer"
                    >
                      {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                        <option key={n} value={n}>{n === 1 ? "×1" : `up to ×${n}`}</option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => updateOption(gi, oi, { available: o.available === false })}
                    className={`px-2.5 py-2 rounded-xl text-[11px] font-semibold whitespace-nowrap cursor-pointer ${
                      o.available === false ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40" : "bg-emerald-50 text-[#087F5B] dark:bg-emerald-950/40"
                    }`}
                  >
                    {o.available === false ? "Sold out" : "In stock"}
                  </button>
                  <IconBtn
                    label="Remove choice"
                    onClick={() => update(gi, { options: g.options.filter((_, i) => i !== oi) })}
                    danger
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </IconBtn>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => update(gi, { options: [...g.options, { id: uid(), name: "", price: 0, available: true, max_qty: 1 }] })}
              className="self-start px-3 py-2 rounded-xl text-xs font-semibold text-[#087F5B] hover:bg-white dark:hover:bg-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add choice
            </button>
          </div>
        );
      })}

      <div className="flex flex-col gap-2">
        <p className="text-xs text-slate-500">
          {groups.length ? "Add another group:" : "Let customers customise this item. Start from a common group:"}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {templates.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => addGroup(t)}
              className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-[#087F5B] cursor-pointer"
            >
              + {t.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => addGroup()}
            className="px-3 py-1.5 rounded-full bg-[#087F5B]/10 text-xs font-semibold text-[#087F5B] cursor-pointer"
          >
            + Custom group
          </button>
        </div>
        {copyable.length > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <select
              value={copyFrom}
              onChange={(e) => setCopyFrom(e.target.value)}
              className="flex-1 min-w-0 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs outline-none cursor-pointer"
            >
              <option value="">Copy options from another item…</option>
              {copyable.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({(p.optionGroups || []).map((g) => g.name).join(", ")})</option>
              ))}
            </select>
            <button
              type="button"
              disabled={!copyFrom}
              onClick={doCopy}
              className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold flex items-center gap-1 disabled:opacity-40 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-2xl bg-white dark:bg-slate-900">
      <span className="text-slate-500 mr-1">{label}</span>
      <button type="button" aria-label={`${label} fewer`} disabled={value <= min} onClick={() => onChange(value - 1)} className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center disabled:opacity-30 cursor-pointer">
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-5 text-center font-bold text-slate-900 dark:text-white">{value}</span>
      <button type="button" aria-label={`${label} more`} disabled={value >= max} onClick={() => onChange(value + 1)} className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center disabled:opacity-30 cursor-pointer">
        <Plus className="w-3 h-3" />
      </button>
      {suffix && <span className="text-slate-400 ml-1 mr-1">{suffix}</span>}
    </span>
  );
}

function IconBtn({ children, label, onClick, disabled, danger }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center disabled:opacity-30 cursor-pointer ${
        danger ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40" : "text-slate-400 hover:text-slate-700 hover:bg-white dark:hover:bg-slate-900"
      }`}
    >
      {children}
    </button>
  );
}
