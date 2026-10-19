"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, BadgeCheck, Bike, Clock, Loader2, Send, Store } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { apiService } from "@/services/api";
import { PayoutsOverview } from "@/types";

type Payee = PayoutsOverview["payees"][number];
const naira = (n: number) => `₦${(Math.round(n * 100) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const ACCOUNT_LABEL: Record<string, { text: string; tone: string }> = {
  active: { text: "Verified", tone: "text-emerald-600" },
  in_review: { text: "Bachs reviewing", tone: "text-amber-600" },
  incomplete: { text: "Verification incomplete", tone: "text-amber-600" },
  restricted: { text: "Restricted by Bachs", tone: "text-rose-600" },
};

export default function AdminSettlementsPage() {
  const [data, setData] = useState<PayoutsOverview | null>(null);
  const [filter, setFilter] = useState<"owed" | "merchant" | "rider" | "all">("owed");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [settling, setSettling] = useState<Payee | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      setData(await apiService.getPayoutsOverview());
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => {
    const payees = data?.payees || [];
    if (filter === "owed") return payees.filter((p) => p.earnings.owed !== 0).sort((a, b) => b.earnings.owed - a.earnings.owed);
    if (filter === "all") return payees;
    return payees.filter((p) => p.payee_type === filter);
  }, [data, filter]);

  const totalOwed = (data?.payees || []).reduce((sum, p) => sum + Math.max(p.earnings.owed, 0), 0);
  const cashHeldByRiders = (data?.payees || []).reduce((sum, p) => sum + Math.max(-p.earnings.owed, 0), 0);
  const names = Object.fromEntries((data?.payees || []).map((p) => [`${p.payee_type}:${p.payee_id}`, p.name]));

  const openSettle = (p: Payee) => {
    setAmount(String(Math.max(p.earnings.owed, 0)));
    setNote("");
    setSettling(p);
  };

  const settle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settling) return;
    setBusy(true);
    setError(null);
    try {
      await apiService.settlePayee({ payee_type: settling.payee_type, payee_id: settling.payee_id, amount: Number(amount), note: note.trim() || undefined });
      setNotice(`${naira(Number(amount))} sent to ${settling.name}'s payout account. They've been emailed.`);
      setSettling(null);
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!data) {
    return error ? <p className="text-sm text-rose-600">{error}</p> : <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto mt-20" />;
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl">
      <div>
        <p className="text-xs text-slate-500 mt-1">
          Customers pay into Novo&apos;s Bachs account. Settling sends a merchant&apos;s or rider&apos;s share to their Bachs payout account, and they withdraw it to their bank.
        </p>
      </div>

      {!data.bachs_configured && (
        <p className="text-sm font-semibold text-amber-800 bg-amber-50 rounded-xl p-3">Bachs isn&apos;t configured on the server, so settlements can&apos;t be sent yet.</p>
      )}
      {error && <p role="alert" className="text-sm font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-xl p-3">{error}</p>}
      {notice && <p role="status" className="text-sm font-semibold text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl p-3">{notice}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Available in Novo's Bachs balance" value={data.available_balance == null ? "—" : naira(data.available_balance)} hint="Only settled payments can be sent out" />
        <Stat label="Owed to merchants & riders" value={naira(totalOwed)} />
        <Stat label="Cash riders owe Novo" value={naira(cashHeldByRiders)} hint="Collected on cash/transfer-on-delivery orders" />
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {([
          ["owed", "Needs settling"],
          ["merchant", "Merchants"],
          ["rider", "Riders"],
          ["all", "Everyone"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${
              filter === id ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-500 bg-white dark:bg-slate-900 rounded-2xl p-8 text-center">Nothing to settle right now.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((p) => {
            const acct = p.account ? ACCOUNT_LABEL[p.account.status] || { text: p.account.status, tone: "text-slate-500" } : null;
            const canSettle = !!p.account?.transfers_enabled && p.earnings.owed > 0 && data.bachs_configured;
            return (
              <li key={`${p.payee_type}:${p.payee_id}`} className="bg-white dark:bg-slate-900 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-[#087F5B] flex items-center justify-center shrink-0">
                    {p.payee_type === "merchant" ? <Store className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-xs text-slate-500">
                      Earned {naira(p.earnings.earned)}
                      {p.payee_type === "rider" && p.earnings.cash_collected > 0 ? ` · cash collected ${naira(p.earnings.cash_collected)}` : ""} · settled {naira(p.earnings.settled)}
                    </p>
                    <p className={`text-xs font-semibold mt-0.5 flex items-center gap-1 ${acct ? acct.tone : "text-slate-400"}`}>
                      {p.account?.status === "active" ? <BadgeCheck className="w-3.5 h-3.5" /> : p.account ? <Clock className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      {acct ? `${acct.text} · ${p.account?.bank_name} ••••${p.account?.account_last4}` : "No bank details yet"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:justify-end">
                  <div className="text-right">
                    <p className="text-[11px] text-slate-500">{p.earnings.owed < 0 ? "Owes Novo" : "Owed"}</p>
                    <p className={`text-base font-black ${p.earnings.owed < 0 ? "text-rose-600" : "text-slate-900 dark:text-white"}`}>{naira(Math.abs(p.earnings.owed))}</p>
                  </div>
                  <button
                    onClick={() => openSettle(p)}
                    disabled={!canSettle}
                    title={!p.account ? "They need to add bank details first" : !p.account.transfers_enabled ? "Waiting for Bachs to verify them" : undefined}
                    className="px-4 py-2.5 rounded-xl bg-[#087F5B] text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Send className="w-3.5 h-3.5" /> Settle
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {data.settlements.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">Recent settlements</h2>
          <ul className="bg-white dark:bg-slate-900 rounded-2xl ">
            {data.settlements.map((s) => (
              <li key={s.id} className="flex items-center justify-between p-3 text-sm">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{names[`${s.payee_type}:${s.payee_id}`] || s.payee_type}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(s.created_at).toLocaleString()} · {s.status}
                    {s.failure_reason ? ` — ${s.failure_reason}` : ""}
                    {s.note ? ` · ${s.note}` : ""}
                  </p>
                </div>
                <span className={`font-bold ${s.status === "failed" ? "text-rose-600 line-through" : "text-slate-900 dark:text-white"}`}>{naira(s.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Modal isOpen={!!settling} onClose={() => setSettling(null)} title={settling ? `Settle ${settling.name}` : ""} subtitle="Sent from Novo's Bachs balance to their payout account.">
        {settling && (
          <form onSubmit={settle} className="flex flex-col gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              They&apos;re owed <strong>{naira(settling.earnings.owed)}</strong>. Send all of it or part.
            </p>
            <Input label="Amount (₦)" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" required />
            <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Week of 12 Oct" />
            <Button type="submit" variant="primary" isLoading={busy} disabled={busy || !(Number(amount) > 0)} leftIcon={<Send className="w-4 h-4" />}>
              Send {amount ? naira(Number(amount)) : ""}
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4">
      <p className="text-[11px] font-bold uppercase text-slate-500">{label}</p>
      <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{value}</p>
      {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}
