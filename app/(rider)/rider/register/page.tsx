"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bike, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";
import { NovoLogo } from "@/components/shared/NovoLogo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
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
    setSuccessMsg("Welcome to the Novo Delivery Network! Opening Rider Hub...");
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
      setSuccessMsg("Email verified! Sign in to open the Rider Hub.");
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
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 px-4 py-8 text-white">
      <div className="w-full max-w-md flex flex-col gap-5 bg-slate-900 p-8 rounded-3xl shadow-2xl">
        {/* BRAND HEADER */}
        <div className="flex flex-col items-center text-center gap-2">
          <NovoLogo variant="rider" subtitle="Courier Partner Portal" size="md" />
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Register as a Courier Rider
          </h2>
          <p className="text-xs text-slate-400">
            Earn money delivering orders for top merchants in your city.
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

        {/* REGISTRATION FORM */}
        {otpNotice ? (
          <OtpCodeStep
            email={email}
            password={password}
            tone="dark"
            initialNotice={otpNotice}
            onVerified={handleVerified}
            onBack={() => setOtpNotice(null)}
          />
        ) : (
        <form onSubmit={handleRegister} className="flex flex-col gap-3">
          <Input
            label="Full Name *"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Tunde Bakare"
            required
            className="bg-slate-950 border-slate-700 text-white"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email Address *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rider@domain.com"
              required
              className="bg-slate-950 border-slate-700 text-white"
            />

            <Input
              label="Phone Number *"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234 800 000 0000"
              required
              className="bg-slate-950 border-slate-700 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300">Vehicle Type *</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="motorcycle">Motorcycle</option>
                <option value="bicycle">Bicycle</option>
                <option value="car">Car / Van</option>
              </select>
            </div>

            <Input
              label="Vehicle Plate Number"
              type="text"
              value={vehiclePlate}
              onChange={(e) => setVehiclePlate(e.target.value)}
              placeholder="e.g. LSD-458-XY"
              className="bg-slate-950 border-slate-700 text-white"
            />
          </div>

          <Input
            label="Password *"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="•••••••• (Min 6 chars)"
            required
            className="bg-slate-950 border-slate-700 text-white"
          />

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
            {isLoading ? "Creating Courier Account..." : "Complete Rider Sign Up"}
          </Button>
        </form>
        )}

        {/* FOOTER */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-slate-800">
          <Link href="/rider/login" className="hover:text-emerald-400 font-bold">
            Already a Partner? Sign In →
          </Link>
        </div>
      </div>
    </div>
  );
}
