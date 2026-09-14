"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag,
  Store,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";
import { NovoLogo } from "@/components/shared/NovoLogo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { UserRole } from "@/types";
import { apiService } from "@/services/api";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCurrentRole, loginUser } = usePlatform();

  const modeParam = searchParams.get("mode");

  const [isLogin, setIsLogin] = useState(modeParam !== "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // OTP Verification State
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpToken, setOtpToken] = useState("");

  // UI Feedback State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRouteRedirect = (role: UserRole = "customer") => {
    setCurrentRole(role);
    setTimeout(() => {
      if (role === "customer") router.push("/");
      else if (role === "merchant") router.push("/merchant");
      else if (role === "rider") router.push("/rider");
      else if (role === "admin") router.push("/admin");
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (isOtpStep) {
        // VERIFY OTP TOKEN
        const result = await apiService.verifyOtp({ email, token: otpToken });
        if (result.access_token) {
          loginUser(result.access_token, email);
        }
        setSuccessMsg("Email verified successfully! Accessing portal...");
        handleRouteRedirect("customer");
        return;
      }

      if (isLogin) {
        // LOGIN VIA FASTAPI BACKEND
        const result = await apiService.login({ email, password });
        if (result && result.access_token) {
          loginUser(result.access_token, email);
          const targetRole: UserRole = email.toLowerCase().includes("admin") || email === "admin@novo.ng" ? "admin" : "customer";
          setSuccessMsg(`Welcome back! Redirecting to ${targetRole === "admin" ? "Admin Portal" : "Novo"}...`);
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
          setSuccessMsg("Account created successfully! Redirecting...");
          handleRouteRedirect("customer");
        } else {
          setSuccessMsg("Registration initiated! Enter the OTP token sent to your email.");
          setIsOtpStep(true);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during authentication.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm sm:max-w-md flex flex-col gap-3 py-2 text-slate-900 dark:text-slate-100">
      {/* LOGO & TITLE */}
      <div className="flex flex-col items-center text-center gap-2">
        <NovoLogo subtitle="Delivery Express" size="md" />
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          {isOtpStep
            ? "Verify Email OTP"
            : isLogin
            ? "Welcome Back to Novo"
            : "Create Your Account"}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {isOtpStep
            ? `Enter the verification code sent to ${email}`
            : "Order food, groceries, pharmacy & express delivery."}
        </p>
      </div>

      {/* FEEDBACK ALERTS */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* AUTH FORM */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {isOtpStep ? (
          <Input
            label="Verification Code (OTP)"
            type="text"
            value={otpToken}
            onChange={(e) => setOtpToken(e.target.value)}
            placeholder="e.g. 123456"
            required
          />
        ) : (
          <>
            {!isLogin && (
              <>
                <Input
                  label="Full Name *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Godswill Okenrenkporo"
                  required
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +234 801 234 5678"
                />
              </>
            )}

            <Input
              label="Email Address *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@domain.com"
              required
            />

            <Input
              label="Password *"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••• (Min 6 chars)"
              required
            />
          </>
        )}

        <Button
          variant="primary"
          type="submit"
          size="lg"
          disabled={isLoading}
          className="w-full mt-1 py-3 text-xs font-black rounded-none"
          rightIcon={
            isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )
          }
        >
          {isLoading
            ? "Processing Request..."
            : isOtpStep
            ? "Verify Code & Continue"
            : isLogin
            ? "Sign In to Novo"
            : "Create Account"}
        </Button>
      </form>

      {/* TOGGLE LOGIN / SIGNUP */}
      {!isOtpStep && (
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{isLogin ? "Don't have an account?" : "Already have an account?"}</span>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="font-black text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              {isLogin ? "Sign Up Now" : "Log In"}
            </button>
          </div>

          {/* DEDICATED MERCHANT PARTNER LINK */}
          <div className="mt-1 p-2.5 bg-slate-100/70 dark:bg-slate-900/80 text-center">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Want to list your restaurant, supermarket, or pharmacy?
            </p>
            <Link
              href="/merchant/register"
              className="inline-flex items-center gap-1 mt-0.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Register Your Business on Novo</span>
            </Link>
          </div>
        </div>
      )}

      {isOtpStep && (
        <button
          type="button"
          onClick={() => setIsOtpStep(false)}
          className="text-xs font-bold text-slate-400 hover:text-slate-200 text-center cursor-pointer"
        >
          Back to Account Form
        </button>
      )}
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 overflow-hidden select-none">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center gap-3 p-8">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-xs font-bold text-slate-400">Loading Novo Portal...</p>
          </div>
        }
      >
        <AuthContent />
      </Suspense>
    </div>
  );
}
