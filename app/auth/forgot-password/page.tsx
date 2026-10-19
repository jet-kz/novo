"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { apiService } from "@/services/api";
import { usePlatform } from "@/store/PlatformContext";
import { AuthButton, AuthField, AuthNotice, AuthShell } from "@/components/auth/AuthShell";
import { CodeInput } from "@/components/auth/OtpCodeStep";
import { UserRole } from "@/types";

const PORTALS = {
  customer: { login: "/auth" },
  merchant: { login: "/merchant/login" },
  rider: { login: "/rider/login" },
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
    <AuthShell
      title={step === "email" ? "Reset your password" : "Choose a new password"}
      subtitle={step === "email" ? "We'll email you a 6-digit code." : `Enter the code we sent to ${email}.`}
    >
      {error && <AuthNotice tone="error">{error}</AuthNotice>}
      {notice && !error && <AuthNotice tone="ok">{notice}</AuthNotice>}

      {step === "email" ? (
        <form onSubmit={requestCode} className="flex flex-col gap-4">
          <AuthField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
          <AuthButton type="submit" busy={busy}>{busy ? "Sending…" : "Send code"}</AuthButton>
        </form>
      ) : (
        <form onSubmit={reset} className="flex flex-col gap-4">
          <CodeInput value={code} onChange={setCode} label="Reset code" />
          <AuthField label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete="new-password" required />
          <AuthField label="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
          <AuthButton type="submit" busy={busy}>{busy ? "Updating…" : "Update password"}</AuthButton>
          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <button type="button" onClick={() => setStep("email")} className="font-medium hover:text-slate-900 dark:hover:text-white cursor-pointer">
              Use another email
            </button>
            <button
              type="button"
              onClick={() => requestCode()}
              disabled={cooldown > 0 || busy}
              className="font-medium text-[#087F5B] dark:text-emerald-400 disabled:text-slate-400 cursor-pointer disabled:cursor-default"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>
        </form>
      )}

      <Link href={portal.login} className="text-center text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
        Back to sign in
      </Link>
    </AuthShell>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-emerald-600" /></div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
