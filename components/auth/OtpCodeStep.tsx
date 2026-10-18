"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
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
  submitLabel = "Verify & Continue",
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

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <p className={`text-xs text-center ${dark ? "text-slate-400" : "text-slate-500 dark:text-slate-400"}`}>
        Enter the 6-digit code we sent to <span className="font-bold">{email}</span>
      </p>

      {notice && !error && (
        <div className={`p-3 text-xs font-semibold flex items-center gap-2 rounded-xl ${dark ? "bg-emerald-950/80 text-emerald-300" : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"}`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}
      {error && (
        <div className={`p-3 text-xs font-semibold flex items-center gap-2 rounded-xl ${dark ? "bg-rose-950/80 text-rose-300" : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"}`}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <input
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        placeholder="••••••"
        aria-label="Verification code"
        className={`w-full text-center text-2xl font-black tracking-[0.5em] py-3 outline-none rounded-xl ${dark ? "bg-slate-950 border border-slate-700 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"}`}
      />

      <button
        type="submit"
        disabled={busy}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 rounded-xl disabled:opacity-60 cursor-pointer"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        <span>{busy ? "Verifying..." : submitLabel}</span>
        {!busy && <ArrowRight className="w-4 h-4" />}
      </button>

      <div className={`flex items-center justify-between text-xs ${dark ? "text-slate-400" : "text-slate-500 dark:text-slate-400"}`}>
        {onBack ? (
          <button type="button" onClick={onBack} className="font-bold hover:underline cursor-pointer">
            ← Change details
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0}
          className="font-bold text-emerald-600 dark:text-emerald-400 disabled:text-slate-400 disabled:cursor-default hover:underline cursor-pointer"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </button>
      </div>
    </form>
  );
}

/** True when a login error means the account exists but the email isn't verified yet. */
export const isUnverifiedEmailError = (message?: string) => /verify your email/i.test(message || "");
