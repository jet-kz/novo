"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AuthButton, AuthNotice } from "@/components/auth/AuthShell";
import { apiService } from "@/services/api";

const RESEND_COOLDOWN = 45;

interface OtpCodeStepProps {
  email: string;
  /** When given, the backend signs the user in after verifying and returns a token. */
  password?: string;
  onVerified: (accessToken: string | null) => void | Promise<void>;
  onBack?: () => void;
  /** Message shown above the input when the step opens, e.g. from signup or login. */
  initialNotice?: string | null;
  tone?: "light" | "dark";
  submitLabel?: string;
}

/** 6-digit email code entry with resend, shared by customer, merchant and rider signup. */
export function OtpCodeStep({
  email,
  password,
  onVerified,
  onBack,
  initialNotice,
  tone = "light",
  submitLabel = "Verify",
}: OtpCodeStepProps) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(initialNotice ?? null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const dark = tone === "dark";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await apiService.verifyOtp({ email, token: code, password });
      await onVerified(res?.access_token ?? null);
    } catch (err: any) {
      setError(err?.message || "Verification failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      const res = await apiService.resendOtp(email, "signup");
      setNotice(res?.message || `A new code is on its way to ${email}.`);
      setCode("");
      setCooldown(RESEND_COOLDOWN);
    } catch (err: any) {
      setError(err?.message || "Couldn't resend the code.");
    }
  };

  if (dark) {
    return (
      <form onSubmit={submit} className="flex flex-col gap-3">
        <p className="text-xs text-center text-slate-400">
          Enter the 6-digit code we sent to <span className="font-bold">{email}</span>
        </p>
        {notice && !error && <p className="p-3 text-xs font-semibold rounded-xl bg-emerald-950/80 text-emerald-300">{notice}</p>}
        {error && <p role="alert" className="p-3 text-xs font-semibold rounded-xl bg-rose-950/80 text-rose-300">{error}</p>}
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          placeholder="••••••"
          aria-label="Verification code"
          className="w-full text-center text-2xl font-black tracking-[0.5em] py-3 outline-none rounded-xl bg-slate-950 text-white"
        />
        <button type="submit" disabled={busy} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 rounded-xl disabled:opacity-60 cursor-pointer">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{busy ? "Verifying..." : submitLabel}</span>
        </button>
        <div className="flex items-center justify-between text-xs text-slate-400">
          {onBack ? <button type="button" onClick={onBack} className="font-bold hover:underline cursor-pointer">← Change details</button> : <span />}
          <button type="button" onClick={resend} disabled={cooldown > 0} className="font-bold text-emerald-400 disabled:text-slate-500 cursor-pointer disabled:cursor-default">
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        We sent a 6-digit code to <span className="font-semibold text-slate-900 dark:text-white">{email}</span>.
      </p>
      {notice && !error && <AuthNotice tone="ok">{notice}</AuthNotice>}
      {error && <AuthNotice tone="error">{error}</AuthNotice>}
      <CodeInput value={code} onChange={setCode} label="Verification code" autoFocus />
      <AuthButton type="submit" busy={busy}>{busy ? "Verifying…" : submitLabel}</AuthButton>
      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        {onBack ? (
          <button type="button" onClick={onBack} className="font-medium hover:text-slate-900 dark:hover:text-white cursor-pointer">
            Change details
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0}
          className="font-medium text-[#087F5B] dark:text-emerald-400 disabled:text-slate-400 cursor-pointer disabled:cursor-default"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
      </div>
    </form>
  );
}

/** Six separate-looking digit boxes backed by one input (paste and SMS autofill just work). */
export function CodeInput({
  value,
  onChange,
  label,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="group relative block">
      <span className="sr-only">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus={autoFocus}
        maxLength={6}
        className="absolute inset-0 w-full h-full opacity-0 cursor-text"
      />
      <span aria-hidden="true" className="grid grid-cols-6 gap-2">
        {Array.from({ length: 6 }).map((_, i) => {
          const active = i === Math.min(value.length, 5);
          return (
            <span
              key={i}
              className={`h-14 rounded-2xl flex items-center justify-center text-xl font-semibold transition-all bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white ${
                active ? "group-focus-within:ring-2 group-focus-within:ring-[#087F5B]/40 group-focus-within:bg-white dark:group-focus-within:bg-slate-900" : ""
              }`}
            >
              {value[i] || ""}
            </span>
          );
        })}
      </span>
    </label>
  );
}

/** True when a login error means the account exists but the email isn't verified yet. */
export const isUnverifiedEmailError = (message?: string) => /verify your email/i.test(message || "");
