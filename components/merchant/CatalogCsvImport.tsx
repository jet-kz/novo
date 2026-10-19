"use client";

import React, { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Loader2, RefreshCw, Upload, X } from "lucide-react";
import { apiService } from "@/services/api";
import type { CatalogKind, CsvImportResult } from "@/types";

const KINDS: { id: CatalogKind; label: string; hint: string }[] = [
  { id: "food", label: "Food", hint: "Restaurants, kitchens, bakeries" },
  { id: "grocery", label: "Groceries", hint: "Supermarkets, shops" },
  { id: "pharmacy", label: "Pharmacy", hint: "Medicines & health" },
];

export function kindForCategory(category?: string): CatalogKind {
  const c = (category || "").toLowerCase();
  if (/pharm|drug|chemist/.test(c)) return "pharmacy";
  if (/restaurant|food|kitchen|bakery|cafe|drink|bar/.test(c)) return "food";
  return "grocery";
}

/**
 * Spreadsheet import: download the standard template (or your current items), edit it,
 * upload it back. Every row is checked first; nothing is saved until the merchant confirms.
 */
export function CatalogCsvImport({
  storeId,
  storeCategory,
  onClose,
  onImported,
}: {
  storeId: string;
  storeCategory?: string;
  onClose: () => void;
  onImported: () => Promise<void> | void;
}) {
  const [kind, setKind] = useState<CatalogKind>(kindForCategory(storeCategory));
  const [fileName, setFileName] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const [busy, setBusy] = useState<"check" | "apply" | "download" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [skipInvalid, setSkipInvalid] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const download = async (mine: boolean) => {
    setBusy("download");
    setError(null);
    try {
      await apiService.downloadCatalogCsv(kind, mine ? storeId : undefined);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const check = async (csv: string, k: CatalogKind) => {
    setBusy("check");
    setError(null);
    setResult(null);
    try {
      setResult(await apiService.importCatalogCsv(storeId, { csv, kind: k, dry_run: true }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const pick = async (file?: File) => {
    if (!file) return;
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
      setError("Upload a .csv file. In Excel or Google Sheets use File → Save as / Download → CSV.");
      return;
    }
    if (file.size > 1_000_000) {
      setError("That file is over 1 MB. Split it into smaller files.");
      return;
    }
    const content = await file.text();
    setFileName(file.name);
    setText(content);
    if (fileRef.current) fileRef.current.value = "";
    check(content, kind);
  };

  const apply = async () => {
    if (!text) return;
    setBusy("apply");
    setError(null);
    try {
      const res = await apiService.importCatalogCsv(storeId, { csv: text, kind, dry_run: false, skip_invalid: skipInvalid });
      setResult(res);
      await onImported();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const errorsCount = result?.summary?.errors || 0;
  const goodCount = (result?.summary?.create || 0) + (result?.summary?.update || 0);
  const canApply = !!result && !result.applied && !result.file_errors.length && goodCount > 0 && (errorsCount === 0 || skipInvalid);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 p-0 sm:p-4">
      <div className="w-full sm:max-w-2xl max-h-[94dvh] overflow-y-auto bg-white dark:bg-slate-900 rounded-t-[28px] sm:rounded-[28px] p-5 sm:p-7 flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Import items from a spreadsheet</h2>
            <p className="text-sm text-slate-500 mt-1">Download the template, fill it in Excel or Google Sheets, save as CSV and upload it here.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Template type */}
        <section className="flex flex-col gap-2">
          <p className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">1 · Template</p>
          <div className="grid grid-cols-3 gap-2">
            {KINDS.map((k) => (
              <button
                key={k.id}
                onClick={() => {
                  setKind(k.id);
                  if (text) check(text, k.id);
                }}
                className={`p-3 rounded-2xl text-left cursor-pointer transition-colors ${
                  kind === k.id ? "bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-[#087F5B]" : "bg-slate-50 dark:bg-slate-800/60"
                }`}
              >
                <span className="block text-sm font-semibold">{k.label}</span>
                <span className="block text-[11px] text-slate-500 mt-0.5">{k.hint}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => download(false)} disabled={busy === "download"} className="h-10 px-4 rounded-full bg-slate-100 dark:bg-slate-800 text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
              <Download className="w-4 h-4" /> Blank template
            </button>
            <button onClick={() => download(true)} disabled={busy === "download"} className="h-10 px-4 rounded-full bg-slate-100 dark:bg-slate-800 text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
              <FileSpreadsheet className="w-4 h-4" /> My current items
            </button>
          </div>
          <details className="text-xs text-slate-500">
            <summary className="cursor-pointer font-medium text-slate-600 dark:text-slate-300">How to fill it in</summary>
            <ul className="mt-2 flex flex-col gap-1 list-disc pl-5">
              <li>Keep the first row (the column names) exactly as it is. One item per row.</li>
              <li><b>name</b> and <b>price</b> are required. Price is in naira, e.g. 3500.</li>
              <li>Leave <b>id</b> empty for new items. Rows with an id, or the same name as an existing item, update that item.</li>
              <li><b>in_stock</b>: yes or no. <b>image_url</b>: an https:// link, or leave empty and add photos later.</li>
              {kind === "pharmacy" && <li><b>requires_prescription</b> (yes/no) is required for every item. <b>dosage_form</b>: Tablet, Capsule, Syrup, Suspension, Injection, Cream, Ointment, Drops, Inhaler, Sachet, Device or Other.</li>}
              {kind === "food" && <li><b>spice_level</b>: Not spicy, Mild, Medium, Hot or Extra hot.</li>}
              <li>
                <b>options</b> (optional): <code>Choose your protein (required): Chicken=0, Beef=500; Extras (up to 3): Plantain=300 x3</code>
              </li>
            </ul>
          </details>
        </section>

        {/* 2. Upload */}
        <section className="flex flex-col gap-2">
          <p className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">2 · Upload</p>
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex flex-col items-center gap-1.5 cursor-pointer transition-colors"
          >
            {busy === "check" ? <Loader2 className="w-6 h-6 animate-spin text-[#087F5B]" /> : <Upload className="w-6 h-6 text-[#087F5B]" />}
            <span className="text-sm font-semibold">{fileName || "Choose a CSV file"}</span>
            <span className="text-xs text-slate-500">{fileName ? "Tap to choose another" : "Up to 1,000 items, 1 MB"}</span>
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        </section>

        {error && (
          <p role="alert" className="text-sm text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-2xl px-4 py-3 flex gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </p>
        )}

        {/* 3. Check */}
        {result && (
          <section className="flex flex-col gap-3">
            <p className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">3 · Check</p>
            {result.file_errors.map((e) => (
              <p key={e} className="text-sm text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-2xl px-4 py-3">{e}</p>
            ))}
            {result.warnings?.map((w) => (
              <p key={w} className="text-sm text-amber-800 bg-amber-50 dark:bg-amber-950/40 rounded-2xl px-4 py-3">{w}</p>
            ))}
            {result.applied ? (
              <p className="text-sm text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-200 rounded-2xl px-4 py-3 flex gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                Done: {result.created || 0} new item{result.created === 1 ? "" : "s"}, {result.updated || 0} updated
                {errorsCount ? `, ${errorsCount} row${errorsCount === 1 ? "" : "s"} skipped` : ""}.
              </p>
            ) : result.summary ? (
              <div className="flex flex-wrap gap-2 text-sm">
                <Count tone="ok" n={result.summary.create} label="new" />
                <Count tone="ok" n={result.summary.update} label="to update" />
                <Count tone={result.summary.errors ? "bad" : "ok"} n={result.summary.errors} label="with problems" />
              </div>
            ) : null}

            {result.rows.length > 0 && (
              <ul className="flex flex-col gap-1 max-h-72 overflow-y-auto rounded-2xl bg-slate-50 dark:bg-slate-800/40 p-2">
                {[...result.rows].sort((a, b) => b.errors.length - a.errors.length).map((r) => (
                  <li key={r.line} className="px-3 py-2 rounded-xl text-sm flex items-start gap-3 bg-white dark:bg-slate-900">
                    <span className="text-xs text-slate-400 w-12 shrink-0 pt-0.5">Row {r.line}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{r.name || <span className="text-slate-400">No name</span>}</p>
                      {r.errors.map((e) => (
                        <p key={e} className="text-xs text-rose-600">{e}</p>
                      ))}
                    </div>
                    {r.errors.length ? (
                      <span className="text-[11px] font-semibold text-rose-600 shrink-0">Fix</span>
                    ) : (
                      <span className={`text-[11px] font-semibold shrink-0 ${r.action === "create" ? "text-[#087F5B]" : "text-sky-600"}`}>
                        {r.action === "create" ? "New" : "Update"}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {!result.applied && errorsCount > 0 && goodCount > 0 && (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={skipInvalid} onChange={(e) => setSkipInvalid(e.target.checked)} className="w-4 h-4 accent-[#087F5B]" />
                Import the {goodCount} good row{goodCount === 1 ? "" : "s"} and skip the rest
              </label>
            )}

            <div className="flex gap-2">
              {text && !result.applied && (
                <button onClick={() => check(text, kind)} disabled={!!busy} className="h-12 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                  <RefreshCw className="w-4 h-4" /> Re-check
                </button>
              )}
              {result.applied ? (
                <button onClick={onClose} className="flex-1 h-12 rounded-2xl bg-[#087F5B] text-white text-[15px] font-semibold cursor-pointer">
                  Done
                </button>
              ) : (
                <button
                  onClick={apply}
                  disabled={!canApply || !!busy}
                  className="flex-1 h-12 rounded-2xl bg-[#087F5B] text-white text-[15px] font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busy === "apply" && <Loader2 className="w-4 h-4 animate-spin" />}
                  {errorsCount && !skipInvalid ? "Fix the rows above first" : `Import ${goodCount} item${goodCount === 1 ? "" : "s"}`}
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Count({ n, label, tone }: { n: number; label: string; tone: "ok" | "bad" }) {
  return (
    <span className={`px-3 py-1.5 rounded-full font-semibold ${tone === "bad" && n ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40" : "bg-slate-100 dark:bg-slate-800"}`}>
      {n} {label}
    </span>
  );
}
