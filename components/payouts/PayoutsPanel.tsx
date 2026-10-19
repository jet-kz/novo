"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AlertCircle, ArrowDownToLine, BadgeCheck, Building2, Clock, ExternalLink, Loader2 } from "lucide-react";
import { apiService } from "@/services/api";
import { MyPayouts } from "@/types";

const naira = (n: number) => `₦${(Math.round(n * 100) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

/**
  * Earnings + payouts for a merchant or rider. Money flow: Novo collects payments -> admin settles
    * what's owed into the payee's Bachs payout account -> the payee withdraws to their bank.
      */
export function PayoutsPanel({ tone = "light" }: { tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  const card = dark ? "bg-slate-900 text-white" : "bg-slate-50 dark:bg-slate-900/70 text-slate-900 dark:text-white";
  const muted = dark ? "text-slate-400" : "text-slate-500 dark:text-slate-400";
  const field = dark
    ? "w-full px-3 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm outline-none"
    : "w-full h-12 px-3.5 rounded-2xl bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#087F5B]/30";

  const [data, setData] = useState<MyPayouts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [banks, setBanks] = useState<{ code: string; name: string }[]>([]);
  const [form, setForm] = useState({ bank_code: "", account_number: "", account_name: "", first_name: "", last_name: "" });
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const load = useCallback(async () => {
    try {
      setData(await apiService.getMyPayouts());
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
    if (new URLSearchParams(window.location.search).get("verification") === "done") {
      setNotice("Thanks — Bachs is checking your details. This page updates once they're done.");
    }
  }, [load]);

  useEffect(() => {
    if ((editing || (data && !data.account)) && banks.length === 0) {
      apiService.getPayoutBanks().then(setBanks).catch(() => {});
    }
  }, [editing, data, banks.length]);

  const run = async (fn: () => Promise<unknown>, done?: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await fn();
      if (done) setNotice(done);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const saveBank = (e: React.FormEvent) => {
    e.preventDefault();
    const bank = banks.find((b) => b.code === form.bank_code);
    run(async () => {
      await apiService.savePayoutAccount({ ...form, bank_name: bank?.name || "" });
      setEditing(false);
    }, "Bank details saved.");
  };

  const verify = async () => {
    setBusy(true);
    try {
      const { url } = await apiService.getPayoutVerificationLink();
      window.location.href = url;
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
    }
  };

  if (!data) {
    return error ? <p className="text-sm text-rose-500">{error}</p> : <Loader2 className={`w-6 h-6 animate-spin mx-auto mt-10 ${dark ? "text-emerald-400" : "text-emerald-600"}`} />;
  }

  const { earnings, account } = data;
  const isRider = data.payee_type === "rider";
  const showForm = editing || !account;
  const withdrawable = data.withdrawable ?? 0;

  return (
    <div className="flex flex-col gap-4">
      {error && <Banner tone="error" dark={dark}>{error}</Banner>}
      {notice && <Banner tone="ok" dark={dark}>{notice}</Banner>}

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat card={card} muted={muted} label="Earned" value={naira(earnings.earned)} hint={`${earnings.orders} delivered order${earnings.orders === 1 ? "" : "s"}`} />
        {isRider && <Stat card={card} muted={muted} label="Cash you collected" value={naira(earnings.cash_collected)} hint="Belongs to Novo, deducted" />}
        <Stat card={card} muted={muted} label="Settled to you" value={naira(earnings.settled)} />
        <Stat
          card={card}
          muted={muted}
          label={earnings.owed < 0 ? "You owe Novo" : "Waiting to be settled"}
          value={naira(Math.abs(earnings.owed))}
          accent={earnings.owed < 0 ? "text-rose-500" : "text-emerald-500"}
        />
        {!isRider && <Stat card={card} muted={muted} label="Ready to withdraw" value={naira(withdrawable)} accent="text-emerald-500" />}
      </div>

      {/* Withdraw */}
      {account?.payouts_enabled && (
        <div className={`rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${card}`}>
          <div className="flex-1">
            <p className={`text-sm ${muted}`}>Ready to withdraw</p>
            <p className="text-2xl font-bold tracking-tight mt-1">{naira(withdrawable)}</p>
            <p className={`text-xs mt-1 ${muted}`}>Goes to {account.bank_name} ••••{account.account_last4}</p>
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => apiService.withdrawPayout(withdrawAmount ? Number(withdrawAmount) : undefined), "Withdrawal started. It usually reaches your bank within minutes.").then(() => setWithdrawAmount(""));
            }}
          >
            <input
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value.replace(/[^\d.]/g, ""))}
              inputMode="decimal"
              placeholder="All"
              aria-label="Amount to withdraw"
              className={`${field} w-28`}
            />
            <button
              type="submit"
              disabled={busy || withdrawable <= 0}
              className="px-4 py-3 rounded-xl bg-[#087F5B] text-white text-sm font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <ArrowDownToLine className="w-4 h-4" /> Withdraw
            </button>
          </form>
        </div>
      )}

      {/* Payout account */}
      <div className={`rounded-2xl p-5 flex flex-col gap-3 ${card}`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-black flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-500" /> Payout account
          </h2>
          {account && !showForm && (
            <button onClick={() => setEditing(true)} className="text-xs font-bold text-emerald-500 cursor-pointer">Change bank</button>
          )}
        </div>

        {account && !showForm && (
          <>
            <p className="text-sm">
              {account.account_name} · {account.bank_name} ••••{account.account_last4}
            </p>
            {account.status === "active" ? (
              <p className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5"><BadgeCheck className="w-4 h-4" /> Verified by Bachs</p>
            ) : account.status === "incomplete" ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <p className={`text-xs flex items-center gap-1.5 ${muted}`}><AlertCircle className="w-4 h-4 text-amber-500" /> Bachs needs a few more details to verify you.</p>
                <button onClick={verify} disabled={busy} className="sm:ml-auto px-4 py-2.5 rounded-xl bg-[#087F5B] text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-60 cursor-pointer">
                  Complete verification <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : account.status === "restricted" ? (
              <p className="text-xs text-rose-500 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> Bachs couldn&apos;t verify this account. Contact info@novong.com.</p>
            ) : (
              <p className={`text-xs flex items-center gap-1.5 ${muted}`}><Clock className="w-4 h-4" /> Bachs is reviewing your details.</p>
            )}
          </>
        )}

        {showForm && (
          <form onSubmit={saveBank} className="flex flex-col gap-3">
            <p className={`text-xs ${muted}`}>
              We pay you through Bachs, our payment partner. The account must be in your name{isRider ? "" : " or your business's name"}.
            </p>
            <select
              value={form.bank_code}
              onChange={(e) => setForm({ ...form, bank_code: e.target.value })}
              required
              className={field}
              aria-label="Bank"
            >
              <option value="">{banks.length ? "Choose your bank" : "Loading banks…"}</option>
              {banks.map((b) => (
                <option key={b.code} value={b.code}>{b.name}</option>
              ))}
            </select>
            <input
              value={form.account_number}
              onChange={(e) => setForm({ ...form, account_number: e.target.value.replace(/\D/g, "").slice(0, 10) })}
              inputMode="numeric"
              placeholder="10-digit account number"
              required
              className={field}
              aria-label="Account number"
            />
            <input
              value={form.account_name}
              onChange={(e) => setForm({ ...form, account_name: e.target.value })}
              placeholder="Account name (as on your bank)"
              required
              className={field}
              aria-label="Account name"
            />
            <div className="grid grid-cols-2 gap-3">
              <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="Your first name" required className={field} aria-label="First name" />
              <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Your last name" required className={field} aria-label="Last name" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className="flex-1 py-3 rounded-xl bg-[#087F5B] text-white text-sm font-bold disabled:opacity-60 cursor-pointer">
                {busy ? "Saving…" : "Save bank details"}
              </button>
              {account && (
                <button type="button" onClick={() => setEditing(false)} className={`px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer ${muted}`}>Cancel</button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* History */}
      {(data.settlements.length > 0 || data.withdrawals.length > 0) && (
        <div className={`rounded-2xl p-5 flex flex-col gap-2 ${card}`}>
          <h2 className="text-sm font-black">History</h2>
          <ul className="flex flex-col ">
            {[
              ...data.settlements.map((s) => ({ id: s.id, date: s.created_at, label: "Settled by Novo", amount: s.amount, status: s.status })),
              ...data.withdrawals.map((w) => ({ id: w.id, date: w.created_at, label: "Withdrawn to bank", amount: -w.amount, status: w.status })),
            ]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((row) => (
                <li key={row.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-semibold">{row.label}</p>
                    <p className={`text-xs ${muted}`}>{new Date(row.date).toLocaleDateString()} · {row.status}</p>
                  </div>
                  <span className={`font-bold ${row.amount < 0 ? "" : "text-emerald-500"}`}>
                    {row.amount < 0 ? "−" : "+"}{naira(Math.abs(row.amount))}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}

      <p className={`text-xs ${muted}`}>
        How it works: customers pay Novo. Novo settles what you&apos;ve earned from delivered orders into your payout account
        {isRider ? ", minus any cash you collected on delivery" : ""}. You then withdraw it to your bank whenever you like.
      </p>
    </div>
  );
}

function Stat({ card, muted, label, value, hint, accent }: { card: string; muted: string; label: string; value: string; hint?: string; accent?: string }) {
  return (
    <div className={`rounded-2xl p-4 ${card}`}>
      <p className={`text-sm ${muted}`}>{label}</p>
      <p className={`text-xl font-black mt-1 ${accent || ""}`}>{value}</p>
      {hint && <p className={`text-[11px] mt-0.5 ${muted}`}>{hint}</p>}
    </div>
  );
}

function Banner({ tone, dark, children }: { tone: "ok" | "error"; dark: boolean; children: React.ReactNode }) {
  const cls =
    tone === "ok"
      ? dark ? "bg-emerald-950/60 text-emerald-300" : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
      : dark ? "bg-rose-950/60 text-rose-300" : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
  return <p role={tone === "error" ? "alert" : "status"} className={`rounded-xl p-3 text-sm font-semibold ${cls}`}>{children}</p>;
}
