"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { apiService } from "@/services/api";
import { usePlatform } from "@/store/PlatformContext";
import { NovoLogo } from "@/components/shared/NovoLogo";
import { Input } from "@/components/ui/Input";
import { UserRole } from "@/types";

const PORTALS = {
  customer: { login: "/auth", subtitle: "Delivery Express" },
  merchant: { login: "/merchant/login", subtitle: "Merchant Portal" },
  rider: { login: "/rider/login", subtitle: "Courier Partner Portal" },
} as const;

const HOME_FOR_ROLE: Record<string, string> = { customer: "/", merchant: "/merchant", rider: "/rider", admin: "/admin" };
const RESEND_COOLDOWN = 45;

function ForgotPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { loginUser } = usePlatform();
  const portalKey = (params.get("portal") || "customer") as keyof typeof PORTALS;
  const portal = PORTALS[portalKey] || PORTALS.customer;

  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState(params.get("email") || "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const requestCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await apiService.forgotPassword(email.trim());
      setNotice(res?.message || `If an account exists for ${email}, we've sent a reset code.`);
      setStep("reset");
      setCooldown(RESEND_COOLDOWN);
    } catch (err: any) {
      setError(err?.message || "Couldn't send the reset code.");
    } finally {
      setBusy(false);
    }
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (code.length !== 6) return setError("Enter the 6-digit code from your email.");
    if (password.length < 6) return setError("Your new password must be at least 6 characters.");
    if (password !== confirm) return setError("The passwords don't match.");

    setBusy(true);
    try {
      const res = await apiService.resetPassword({ email: email.trim(), token: code, new_password: password });
      if (!res?.access_token) {
        setNotice("Password updated. Sign in with your new password.");
        setTimeout(() => router.push(portal.login), 1200);
        return;
      }
      let role: UserRole = portalKey as UserRole;
      try {
        const me = await apiService.getMe(res.access_token);
        role = (me?.role || role) as UserRole;
      } catch {}
      loginUser(res.access_token, email.trim(), role);
      if (role === "merchant") localStorage.setItem("merchant_session", "true");
      setNotice("Password updated. Signing you in...");
      router.push(HOME_FOR_ROLE[role] || "/");
    } catch (err: any) {
      setError(err?.message || "Couldn't reset your password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-sm flex flex-col gap-4 text-slate-900 dark:text-slate-100">
      <div className="flex flex-col items-center text-center gap-2">
        <NovoLogo subtitle={portal.subtitle} size="md" />
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">
          {step === "email" ? "Forgot your password?" : "Choose a new password"}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {step === "email"
            ? "Enter your account email and we'll send you a 6-digit reset code."
            : `Enter the code we sent to ${email} and pick a new password.`}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && !error && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 rounded-xl">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {step === "email" ? (
        <form onSubmit={requestCode} className="flex flex-col gap-3">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 rounded-xl disabled:opacity-60 cursor-pointer"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>{busy ? "Sending..." : "Send Reset Code"}</span>
            {!busy && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      ) : (
        <form onSubmit={reset} className="flex flex-col gap-3">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            placeholder="••••••"
            aria-label="Reset code"
            className="w-full text-center text-2xl font-black tracking-[0.5em] py-3 outline-none rounded-xl bg-slate-100 dark:bg-slate-800"
          />
          <Input
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            autoComplete="new-password"
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 rounded-xl disabled:opacity-60 cursor-pointer"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>{busy ? "Updating..." : "Reset Password & Sign In"}</span>
          </button>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <button type="button" onClick={() => setStep("email")} className="font-bold hover:underline cursor-pointer">
              ← Different email
            </button>
            <button
              type="button"
              onClick={() => requestCode()}
              disabled={cooldown > 0 || busy}
              className="font-bold text-emerald-600 dark:text-emerald-400 disabled:text-slate-400 hover:underline cursor-pointer"
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
            </button>
          </div>
        </form>
      )}

      <Link href={portal.login} className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 hover:underline">
        Back to sign in
      </Link>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-8">
      <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-emerald-500" />}>
        <ForgotPasswordContent />
      </Suspense>
    </div>
  );
}
