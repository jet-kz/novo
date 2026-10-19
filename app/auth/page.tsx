"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";
import { AuthButton, AuthField, AuthNotice, AuthShell } from "@/components/auth/AuthShell";
import { UserRole } from "@/types";
import { apiService } from "@/services/api";
import { OtpCodeStep, isUnverifiedEmailError } from "@/components/auth/OtpCodeStep";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCurrentRole, loginUser } = usePlatform();

  const modeParam = searchParams.get("mode");

  const [isLogin, setIsLogin] = useState(modeParam !== "signup");
  const next = searchParams.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // OTP Verification State
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);

  // UI Feedback State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRouteRedirect = (role: UserRole = "customer") => {
    setCurrentRole(role);
    setTimeout(() => {
      const home = role === "customer" ? "/" : `/${role}`;
      // Honour ?next= only when it's a page this role can actually open.
      const safeNext = next && next.startsWith("/") && !next.startsWith("//") && (role === "customer" ? !/^\/(admin|merchant|rider)/.test(next) : next.startsWith(home));
      if (safeNext) router.push(next!);
      else if (role === "customer") router.push("/");
      else if (role === "merchant") router.push("/merchant");
      else if (role === "rider") router.push("/rider");
      else if (role === "admin") router.push("/admin");
    }, 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        // LOGIN VIA FASTAPI BACKEND
        const result = await apiService.login({ email, password });
        if (result && result.access_token) {
          loginUser(result.access_token, email);
          let targetRole: UserRole = "customer";
          try {
            const me = await apiService.getMe(result.access_token);
            targetRole = (me?.role || "customer") as UserRole;
            loginUser(result.access_token, me?.email || email, targetRole);
          } catch (e) {
            console.warn("Could not resolve role from /auth/me:", e);
          }
          setSuccessMsg("Signed in. Taking you there…");
          handleRouteRedirect(targetRole);
        } else {
          throw new Error("Invalid email or password");
        }
      } else {
        // SIGNUP VIA FASTAPI BACKEND AS CUSTOMER
        const result = await apiService.signUp({
          email,
          password,
          full_name: name,
          role: "customer",
          phone,
        });

        if (result && result.access_token) {
          loginUser(result.access_token, email);
          setSuccessMsg("Account created. Taking you in…");
          handleRouteRedirect("customer");
        } else {
          setOtpNotice(result?.message || `We've sent a 6-digit code to ${email}.`);
          setIsOtpStep(true);
        }
      }
    } catch (err: any) {
      if (isLogin && isUnverifiedEmailError(err?.message)) {
        setOtpNotice(err.message);
        setIsOtpStep(true);
      } else {
        setErrorMsg(err.message || "An unexpected error occurred during authentication.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerified = async (token: string | null) => {
    if (!token) {
      setIsOtpStep(false);
      setIsLogin(true);
      setSuccessMsg("Email verified! Sign in to continue.");
      return;
    }
    let role: UserRole = "customer";
    try {
      const me = await apiService.getMe(token);
      role = (me?.role || "customer") as UserRole;
    } catch {}
    loginUser(token, email, role);
    setIsOtpStep(false);
    setSuccessMsg("Email verified! Signing you in...");
    handleRouteRedirect(role);
  };

  const switchMode = (login: boolean) => {
    setIsLogin(login);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  return (
    <AuthShell
      title={isOtpStep ? "Check your email" : isLogin ? "Welcome back" : "Create your account"}
      subtitle={
        isOtpStep
          ? "One last step to secure your account."
          : isLogin
            ? "Sign in to order from stores near you."
            : "It takes less than a minute."
      }
    >
      {!isOtpStep && (
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900" role="tablist">
          {[
            { login: true, label: "Sign in" },
            { login: false, label: "Create account" },
          ].map((t) => (
            <button
              key={t.label}
              type="button"
              role="tab"
              aria-selected={isLogin === t.login}
              onClick={() => switchMode(t.login)}
              className={`h-10 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                isLogin === t.login ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {errorMsg && <AuthNotice tone="error">{errorMsg}</AuthNotice>}
      {successMsg && <AuthNotice tone="ok">{successMsg}</AuthNotice>}

      {isOtpStep ? (
        <OtpCodeStep
          email={email}
          password={password}
          initialNotice={otpNotice}
          onVerified={handleVerified}
          onBack={() => setIsOtpStep(false)}
        />
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <>
              <AuthField label="Full name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" required />
              <AuthField label="Phone number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="080 1234 5678" autoComplete="tel" />
            </>
          )}
          <AuthField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
          <div className="flex flex-col gap-2">
            <AuthField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? "Your password" : "At least 6 characters"}
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={6}
              required
            />
            {isLogin && (
              <Link
                href={`/auth/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`}
                className="self-end text-[13px] font-medium text-[#087F5B] dark:text-emerald-400 hover:underline"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <div className="pt-1">
            <AuthButton type="submit" busy={isLoading}>
              {isLoading ? (isLogin ? "Signing in…" : "Creating account…") : isLogin ? "Sign in" : "Create account"}
            </AuthButton>
          </div>
        </form>
      )}

    </AuthShell>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center bg-white dark:bg-slate-950">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
