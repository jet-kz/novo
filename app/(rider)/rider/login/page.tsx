"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bike, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";
import { NovoLogo } from "@/components/shared/NovoLogo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/services/api";
import { OtpCodeStep, isUnverifiedEmailError } from "@/components/auth/OtpCodeStep";

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
      throw new Error("This account isn't registered as a rider. Register as a rider partner first.");
    }
    loginUser(token, me?.email || email, "rider");
    setSuccessMsg("Signed in! Opening Rider Hub...");
    router.push("/rider");
  };

  const handleRiderLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const result = await apiService.login({ email, password });
      if (!result?.access_token) throw new Error("Invalid rider email or password.");
      await completeLogin(result.access_token);
    } catch (err: any) {
      if (isUnverifiedEmailError(err?.message)) setOtpNotice(err.message);
      else setErrorMsg(err.message || "Invalid credentials or account not registered as a rider.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 px-4 overflow-hidden select-none text-white">
      <div className="w-full max-w-sm sm:max-w-md flex flex-col gap-5 py-4 bg-slate-900 p-8 rounded-3xl shadow-2xl">
        {/* LOGO & BRAND */}
        <div className="flex flex-col items-center text-center gap-2">
          <NovoLogo variant="rider" subtitle="Courier Partner Portal" size="md" />
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Rider Partner Sign In
          </h2>
          <p className="text-xs text-slate-400">
            Access active dispatch offers, live delivery GPS route navigation & earnings.
          </p>
        </div>

        {/* FEEDBACK ALERTS */}
        {errorMsg && (
          <div className="p-3 bg-rose-950/80 text-rose-300 text-xs font-semibold rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/80 text-emerald-300 text-xs font-semibold rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* FORM */}
        {otpNotice ? (
          <OtpCodeStep
            email={email}
            password={password}
            tone="dark"
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
        <form onSubmit={handleRiderLogin} className="flex flex-col gap-3">
          <Input
            label="Courier Email Address *"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="rider@novo.ng"
            required
            className="bg-slate-950 border-slate-700 text-white"
          />

          <Input
            label="Password *"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="bg-slate-950 border-slate-700 text-white"
          />
          <Link
            href={`/auth/forgot-password?portal=rider${email ? `&email=${encodeURIComponent(email)}` : ""}`}
            className="self-end -mt-1 text-xs font-bold text-emerald-400 hover:underline"
          >
            Forgot password?
          </Link>

          <Button
            variant="primary"
            type="submit"
            size="lg"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 text-xs font-black rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white"
            rightIcon={
              isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )
            }
          >
            {isLoading ? "Authenticating Rider..." : "Sign In to Rider Hub"}
          </Button>
        </form>
        )}

        {/* FOOTER LINKS */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
          <Link href="/auth" className="hover:text-white underline">
            ← Main Auth Portal
          </Link>
          <Link href="/rider/register" className="hover:text-emerald-400 font-bold">
            Become a Rider →
          </Link>
        </div>
      </div>
    </div>
  );
}
