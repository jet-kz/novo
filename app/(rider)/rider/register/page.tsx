"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePlatform } from "@/store/PlatformContext";
import { AuthButton, AuthField, AuthNotice, AuthShell, PARTNER_PHOTOS } from "@/components/auth/AuthShell";
import { apiService } from "@/services/api";
import { OtpCodeStep } from "@/components/auth/OtpCodeStep";

export default function RiderRegisterPage() {
  const router = useRouter();
  const { loginUser } = usePlatform();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [vehicleType, setVehicleType] = useState<"motorcycle" | "bicycle" | "car">("motorcycle");
  const [vehiclePlate, setVehiclePlate] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);

  const enterHub = (token: string) => {
    loginUser(token, email, "rider");
    setSuccessMsg("Account created. Opening your rider app…");
    router.push("/rider");
  };

  const handleVerified = async (token: string | null) => {
    let session = token;
    if (!session) {
      try {
        session = (await apiService.login({ email, password }))?.access_token || null;
      } catch {}
    }
    setOtpNotice(null);
    if (!session) {
      setSuccessMsg("Email verified. Sign in to continue.");
      return;
    }
    enterHub(session);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      // Create user account with role='rider'
      const result = await apiService.signUp({
        email,
        password,
        full_name: fullName,
        phone,
        role: "rider",
        vehicle_type: vehicleType,
        vehicle_plate: vehiclePlate.trim() || undefined,
      });

      if (result?.access_token) {
        enterHub(result.access_token);
      } else {
        setOtpNotice(result?.message || `We've sent a 6-digit code to ${email}.`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create rider partner account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title={otpNotice ? "Check your email" : "Become a Novo rider"}
      subtitle={otpNotice ? "One last step to secure your account." : "Earn delivering orders from stores in your city."}
      badge="For riders"
      home="/rider"
      photo={PARTNER_PHOTOS.rider}
      tagline="Deliver for Novo. Earn on your own schedule."
    >
      {errorMsg && <AuthNotice tone="error">{errorMsg}</AuthNotice>}
      {successMsg && <AuthNotice tone="ok">{successMsg}</AuthNotice>}

      {otpNotice ? (
        <OtpCodeStep email={email} password={password} initialNotice={otpNotice} onVerified={handleVerified} onBack={() => setOtpNotice(null)} />
      ) : (
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <AuthField label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" autoComplete="name" required />
          <AuthField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
          <AuthField label="Phone number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="080 1234 5678" autoComplete="tel" required />
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-slate-600 dark:text-slate-300">Vehicle</span>
              <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value as typeof vehicleType)} className="w-full h-12 px-4 rounded-2xl bg-slate-100 dark:bg-slate-900 text-[15px] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#087F5B]/35 cursor-pointer">
                <option value="motorcycle">Motorcycle</option>
                <option value="bicycle">Bicycle</option>
                <option value="car">Car / Van</option>
              </select>
            </label>
            <AuthField label="Plate number" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} placeholder="Optional" />
          </div>
          <AuthField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete="new-password" minLength={6} required />
          <div className="pt-1">
            <AuthButton type="submit" busy={isLoading}>{isLoading ? "Creating account…" : "Apply to deliver"}</AuthButton>
          </div>
          <p className="text-xs text-slate-500 text-center">We check every rider before their first delivery. You&apos;ll upload your ID next.</p>
        </form>
      )}

      {!otpNotice && (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Already a rider?{" "}
          <Link href="/rider/login" className="font-semibold text-[#087F5B] dark:text-emerald-400 hover:underline">
            Sign in
          </Link>
        </p>
      )}
    </AuthShell>
  );
}
