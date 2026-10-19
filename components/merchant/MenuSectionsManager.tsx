"use client";

import React, { useState } from "react";
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { apiService } from "@/services/api";
import { MenuSection } from "@/types";

interface Props {
  storeId: string;
  sections: MenuSection[];
  itemCounts: Record<string, number>;
  onChange: () => Promise<void> | void;
}

/** Create, rename, reorder and remove the sections customers see on the store page. */
export function MenuSectionsManager({ storeId, sections, itemCounts, onChange }: Props) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await onChange();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    run(async () => {
      await apiService.createMenuSection(storeId, name);
      setNewName("");
    });
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= sections.length) return;
    const ids = sections.map((s) => s.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    run(() => apiService.reorderMenuSections(storeId, ids));
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-black text-slate-900 dark:text-white">Menu sections</h3>
        <p className="text-xs text-slate-500 mt-0.5">Group your items the way customers browse, e.g. Rice dishes, Soups, Drinks. Order here is the order on your store page.</p>
      </div>

      {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

      {sections.length > 0 && (
        <ul className="flex flex-col ">
          {sections.map((section, i) => (
            <li key={section.id} className="flex items-center gap-2 py-2">
              {editingId === section.id ? (
                <form
                  className="flex-1 flex items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(() => apiService.renameMenuSection(section.id, editName)).then(() => setEditingId(null));
                  }}
                >
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm outline-none"
                    aria-label="Section name"
                  />
                  <button type="submit" disabled={busy} className="p-2 text-[#087F5B] cursor-pointer" aria-label="Save">
                    <Check className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} className="p-2 text-slate-400 cursor-pointer" aria-label="Cancel">
                    <X className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <>
                  <span className="flex-1 min-w-0 text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {section.name}
                    <span className="ml-2 text-xs font-normal text-slate-400">{itemCounts[section.id] || 0} items</span>
                  </span>
                  <SmallButton label="Move up" disabled={busy || i === 0} onClick={() => move(i, -1)}>
                    <ArrowUp className="w-4 h-4" />
                  </SmallButton>
                  <SmallButton label="Move down" disabled={busy || i === sections.length - 1} onClick={() => move(i, 1)}>
                    <ArrowDown className="w-4 h-4" />
                  </SmallButton>
                  <SmallButton
                    label="Rename"
                    disabled={busy}
                    onClick={() => {
                      setEditingId(section.id);
                      setEditName(section.name);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </SmallButton>
                  <SmallButton
                    label="Remove"
                    danger
                    disabled={busy}
                    onClick={() =>
                      window.confirm(`Remove "${section.name}"? Its items stay on your menu without a section.`) &&
                      run(() => apiService.deleteMenuSection(section.id))
                    }
                  >
                    <Trash2 className="w-4 h-4" />
                  </SmallButton>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="flex items-center gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New section name"
          className="flex-1 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none"
          aria-label="New section name"
        />
        <button
          type="submit"
          disabled={busy || !newName.trim()}
          className="px-4 py-2.5 rounded-xl bg-[#087F5B] text-white text-xs font-black flex items-center gap-1 disabled:opacity-50 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </form>
    </div>
  );
}

function SmallButton({
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
      className={`p-1.5 rounded-lg cursor-pointer disabled:opacity-30 ${danger ? "text-rose-500" : "text-slate-500"} hover:bg-slate-100 dark:hover:bg-slate-800`}
    >
      {children}
    </button>
  );
}
