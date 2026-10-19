"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiService } from "@/services/api";
import { usePlatform } from "@/store/PlatformContext";
import { AuthButton, AuthField, AuthNotice, AuthShell, PARTNER_PHOTOS } from "@/components/auth/AuthShell";
import { OtpCodeStep, isUnverifiedEmailError } from "@/components/auth/OtpCodeStep";

export default function MerchantLoginPage() {
  const router = useRouter();
  const { loginUser } = usePlatform();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);

  const completeLogin = async (token: string) => {
    const me = await apiService.getMe(token);
    if (me?.role !== "merchant") {
      throw new Error("This account isn't registered as a merchant. Create a merchant account first.");
    }
    localStorage.setItem("merchant_session", "true");
    loginUser(token, me?.email || email, "merchant");

    try {
      const merchRes = await apiService.getMerchantMe(token);
      if (merchRes) {
        const merch = merchRes.merchant || merchRes;
        const store = merchRes.stores?.[0];
        const bName = store?.name || merch?.name;
        if (bName) {
          const profile = {
            fullName: merch?.owner_name || merch?.full_name || bName,
            businessName: bName,
            address: store?.address || merch?.address || "Store Address",
            businessType: store?.store_type || "Restaurant",
          };
          localStorage.setItem("merchant_profile", JSON.stringify(profile));
        }
      }
    } catch (mErr) {}

    router.push("/merchant");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await apiService.login({ email, password });
      const token = data?.access_token || data?.data?.access_token;
      if (!token) throw new Error("Invalid email or password.");
      await completeLogin(token);
    } catch (err: any) {
      if (isUnverifiedEmailError(err?.message)) {
        setOtpNotice(err.message);
      } else {
        setError(
          err?.message ||
            "Wrong email or password."
        );
      }
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={otpNotice ? "Check your email" : "Welcome back"}
      subtitle={otpNotice ? "One last step to secure your account." : "Sign in to manage your store and orders."}
      badge="For stores"
      home="/merchant"
      photo={PARTNER_PHOTOS.merchant}
      tagline="Reach more customers. We handle the delivery."
    >
      {error && <AuthNotice tone="error">{error}</AuthNotice>}

      {otpNotice ? (
        <OtpCodeStep
          email={email}
          password={password}
          initialNotice={otpNotice}
          onBack={() => setOtpNotice(null)}
          onVerified={async (token) => {
            if (!token) {
              setOtpNotice(null);
              setError("Email verified. Sign in to continue.");
              return;
            }
            try {
              await completeLogin(token);
            } catch (err: any) {
              setOtpNotice(null);
              setError(err?.message || "Sign in failed.");
            }
          }}
        />
      ) : (
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <AuthField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourstore.com" autoComplete="email" required />
          <div className="flex flex-col gap-2">
            <AuthField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" required />
            <Link
              href={`/auth/forgot-password?portal=merchant${email ? `&email=${encodeURIComponent(email)}` : ""}`}
              className="self-end text-[13px] font-medium text-[#087F5B] dark:text-emerald-400 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="pt-1">
            <AuthButton type="submit" busy={loading}>{loading ? "Signing in…" : "Sign in"}</AuthButton>
          </div>
        </form>
      )}

      {!otpNotice && (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          New to Novo?{" "}
          <Link href="/merchant/register" className="font-semibold text-[#087F5B] dark:text-emerald-400 hover:underline">
            List your store
          </Link>
        </p>
      )}
    </AuthShell>
  );
}
