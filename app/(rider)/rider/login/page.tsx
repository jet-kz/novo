"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePlatform } from "@/store/PlatformContext";
import { apiService } from "@/services/api";
import { OtpCodeStep, isUnverifiedEmailError } from "@/components/auth/OtpCodeStep";
import { AuthButton, AuthField, AuthNotice, AuthShell, PARTNER_PHOTOS } from "@/components/auth/AuthShell";

export default function RiderLoginPage() {
  const router = useRouter();
  const { loginUser } = usePlatform();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const completeLogin = async (token: string) => {
    const me = await apiService.getMe(token);
    if (me?.role !== "rider" && !(me?.roles || []).includes("rider")) {
      throw new Error("This account isn't registered as a rider. Sign up as a rider first.");
    }
    loginUser(token, me?.email || email, "rider");
    setSuccessMsg("Signed in. Opening your jobs…");
    const next = new URLSearchParams(window.location.search).get("next");
    // Only follow in-app rider paths.
    router.push(next && next.startsWith("/rider") && !next.startsWith("//") ? next : "/rider");
  };

  const handleRiderLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);
    try {
      const result = await apiService.login({ email, password });
      if (!result?.access_token) throw new Error("Wrong email or password.");
      await completeLogin(result.access_token);
    } catch (err: any) {
      if (isUnverifiedEmailError(err?.message)) setOtpNotice(err.message);
      else setErrorMsg(err.message || "Wrong email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title={otpNotice ? "Check your email" : "Welcome back, rider"}
      subtitle={otpNotice ? "One last step to secure your account." : "Sign in to see delivery jobs near you."}
      badge="For riders"
      home="/rider"
      photo={PARTNER_PHOTOS.rider}
      tagline="Deliver for Novo. Earn on your own schedule."
    >
      {errorMsg && <AuthNotice tone="error">{errorMsg}</AuthNotice>}
      {successMsg && <AuthNotice tone="ok">{successMsg}</AuthNotice>}

      {otpNotice ? (
        <OtpCodeStep
          email={email}
          password={password}
          initialNotice={otpNotice}
          onBack={() => setOtpNotice(null)}
          onVerified={async (token) => {
            setOtpNotice(null);
            if (!token) return setSuccessMsg("Email verified. Sign in to continue.");
            try {
              await completeLogin(token);
            } catch (err: any) {
              setErrorMsg(err?.message || "Sign in failed.");
            }
          }}
        />
      ) : (
        <form onSubmit={handleRiderLogin} className="flex flex-col gap-4">
          <AuthField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
          <div className="flex flex-col gap-2">
            <AuthField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" required />
            <Link
              href={`/auth/forgot-password?portal=rider${email ? `&email=${encodeURIComponent(email)}` : ""}`}
              className="self-end text-[13px] font-medium text-[#087F5B] dark:text-emerald-400 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="pt-1">
            <AuthButton type="submit" busy={isLoading}>{isLoading ? "Signing in…" : "Sign in"}</AuthButton>
          </div>
        </form>
      )}

      {!otpNotice && (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          New rider?{" "}
          <Link href="/rider/register" className="font-semibold text-[#087F5B] dark:text-emerald-400 hover:underline">
            Apply to deliver
          </Link>
        </p>
      )}
    </AuthShell>
  );
}
