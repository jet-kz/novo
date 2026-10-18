"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { apiService } from "@/services/api";
import { usePlatform } from "@/store/PlatformContext";
import { NovoLogo } from "@/components/shared/NovoLogo";
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
            "Invalid email or password. If you don't have an account yet, please register your store below!"
        );
      }
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center px-4 overflow-hidden select-none font-sans text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-sm sm:max-w-md flex flex-col gap-4 py-2">
        {/* LOGO */}
        <div className="flex flex-col items-center text-center gap-2">
          <NovoLogo subtitle="Merchant Portal" size="md" href="/merchant" />
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Merchant Portal Sign In</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Sign in to manage your store, orders &amp; earnings</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs font-bold text-center leading-relaxed">
            {error}
          </div>
        )}

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
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-black text-slate-700 dark:text-slate-300">Merchant Email</label>
            <div className="relative mt-1">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="store@restaurant.com"
                required
                className="w-full pl-9 p-3 bg-slate-100 dark:bg-slate-800 text-xs font-bold outline-none text-slate-900 dark:text-white rounded-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-slate-700 dark:text-slate-300">Password</label>
            <div className="relative mt-1">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-9 p-3 bg-slate-100 dark:bg-slate-800 text-xs font-bold outline-none text-slate-900 dark:text-white rounded-none"
              />
            </div>
            <Link
              href={`/auth/forgot-password?portal=merchant${email ? `&email=${encodeURIComponent(email)}` : ""}`}
              className="block text-right mt-1.5 text-xs font-bold text-[#087F5B] dark:text-emerald-400 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 py-3 bg-[#087F5B] text-white text-xs font-black cursor-pointer flex items-center justify-center gap-2 rounded-none"
          >
            <span>{loading ? "Authenticating..." : "Sign In to Merchant Portal"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
        )}

        <div className="text-center pt-2 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">New Store Partner?</span>
          <Link
            href="/merchant/register"
            className="text-[#087F5B] dark:text-emerald-400 font-black hover:underline"
          >
            Register Store →
          </Link>
        </div>
      </div>
    </div>
  );
}
