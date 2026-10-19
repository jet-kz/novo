"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiService } from "@/services/api";
import { usePlatform } from "@/store/PlatformContext";
import { getUniqueStoreBanner, getUniqueStoreLogo } from "@/utils/storeImageUtils";
import { AuthButton, AuthField, AuthNotice, AuthShell, PARTNER_PHOTOS } from "@/components/auth/AuthShell";
import { useCatalog } from "@/components/shared/useCatalog";
import { StoreLocationField } from "@/components/location/StoreLocationField";
import { OtpCodeStep } from "@/components/auth/OtpCodeStep";

export default function MerchantRegisterPage() {
  const router = useRouter();
  const { loginUser, refreshMerchantStore } = usePlatform();
  const { categories: platformCategories } = useCatalog();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Step 2
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("restaurant");
  const [address, setAddress] = useState("");
  const [storeCoords, setStoreCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Email verification
  const [otpNotice, setOtpNotice] = useState<string | null>(null);

  /** Runs once we hold a session token: creates the merchant + store and opens the dashboard. */
  const finishSetup = async (token: string) => {
    const profileData = {
      fullName,
      email,
      phone,
      businessName,
      businessType,
      address,
      isVerified: true,
      isOpen: true,
      createdAt: new Date().toISOString(),
    };

    try {
      loginUser(token, email, "merchant");

      // 2. Merchant & Store creation with backend API
      const merch = await apiService.createMerchant({ name: businessName }, token);
      const merchantId = merch?.data?.id || merch?.id;
      if (!merchantId) throw new Error("Merchant account could not be created.");
      {
        const uniqueBanner = getUniqueStoreBanner({ name: businessName, category: businessType });
        const uniqueLogo = getUniqueStoreLogo({ name: businessName, category: businessType });
        await apiService.createStore(
          {
            merchantId,
            name: businessName,
            category: businessType as any,
            address,
            phone,
            ...(storeCoords ? { location: { latitude: storeCoords.lat, longitude: storeCoords.lon } } : {}),
            banner: uniqueBanner,
            logo: uniqueLogo,
          } as any,
          token
        );
      }

      // Save dynamic merchant profile only on successful backend response
      if (typeof window !== "undefined") {
        localStorage.setItem("merchant_profile", JSON.stringify(profileData));
        localStorage.setItem("merchant_session", "true");
        if (!localStorage.getItem("merchant_products")) {
          localStorage.setItem("merchant_products", JSON.stringify([]));
        }
      }

      await refreshMerchantStore().catch(() => {});
      router.push("/merchant");
    } catch (e: any) {
      console.error("Backend merchant creation error:", e);
      setOtpNotice(null);
      setError(e.message || "Registration failed on backend server. Please verify backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeCoords) {
      setError("Pin your store on the map so riders can find it.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const authRes = await apiService.signUp({
        email,
        password,
        full_name: fullName,
        role: "merchant_owner",
        phone,
      });
      if (authRes?.access_token) {
        await finishSetup(authRes.access_token);
        return;
      }
      setOtpNotice(authRes?.message || `We've sent a 6-digit code to ${email}.`);
    } catch (e: any) {
      setError(e.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerified = async (token: string | null) => {
    setLoading(true);
    let session = token;
    if (!session) {
      try {
        session = (await apiService.login({ email, password }))?.access_token || null;
      } catch {}
    }
    if (!session) {
      setLoading(false);
      setOtpNotice(null);
      setError("Email verified, but we couldn't sign you in. Sign in to finish setting up your store.");
      return;
    }
    await finishSetup(session);
  };

  return (
    <AuthShell
      title={otpNotice ? "Check your email" : step === 1 ? "List your store on Novo" : "About your store"}
      subtitle={otpNotice ? "We'll set up your store as soon as you verify." : step === 1 ? "Step 1 of 2 · Your account" : "Step 2 of 2 · Where customers and riders find you"}
      badge="For stores"
      home="/merchant"
      photo={PARTNER_PHOTOS.merchant}
      tagline="Reach more customers. We handle the delivery."
    >
      {error && <AuthNotice tone="error">{error}</AuthNotice>}

      {!otpNotice && (
        <div className="grid grid-cols-2 gap-2" aria-hidden="true">
          <span className="h-1.5 rounded-full bg-[#087F5B]" />
          <span className={`h-1.5 rounded-full ${step >= 2 ? "bg-[#087F5B]" : "bg-slate-200 dark:bg-slate-800"}`} />
        </div>
      )}

      {otpNotice ? (
        <OtpCodeStep
          email={email}
          password={password}
          initialNotice={otpNotice}
          onVerified={handleVerified}
          onBack={() => setOtpNotice(null)}
          submitLabel={loading ? "Setting up your store…" : "Verify & create store"}
        />
      ) : (
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          {step === 1 && (
            <>
              <AuthField label="Your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" autoComplete="name" required />
              <AuthField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourstore.com" autoComplete="email" required />
              <AuthField label="Phone number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="080 1234 5678" autoComplete="tel" required />
              <AuthField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete="new-password" minLength={6} required />
              <div className="pt-1">
                <AuthButton
                  type="button"
                  onClick={() => {
                    if (fullName && email && phone && password.length >= 6) {
                      setError(null);
                      setStep(2);
                    } else setError("Fill in all the fields to continue (password at least 6 characters).");
                  }}
                >
                  Continue
                </AuthButton>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <AuthField label="Store name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Mama Put Kitchen" required />
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-slate-600 dark:text-slate-300">What do you sell?</span>
                <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} className="w-full h-12 px-4 rounded-2xl bg-slate-100 dark:bg-slate-900 text-[15px] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#087F5B]/35 cursor-pointer">
                  {platformCategories.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </label>
              <AuthField label="Store address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, area, city" autoComplete="street-address" required />
              <StoreLocationField
                coords={storeCoords}
                onChange={({ address: picked, coords }) => {
                  setStoreCoords(coords);
                  if (!address.trim()) setAddress(picked);
                }}
              />
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="h-12 px-5 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-[15px] font-semibold cursor-pointer"
                >
                  Back
                </button>
                <div className="flex-1">
                  <AuthButton type="submit" busy={loading}>{loading ? "Creating your store…" : "Create my store"}</AuthButton>
                </div>
              </div>
            </>
          )}
        </form>
      )}

      {!otpNotice && (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Already on Novo?{" "}
          <Link href="/merchant/login" className="font-semibold text-[#087F5B] dark:text-emerald-400 hover:underline">
            Sign in
          </Link>
        </p>
      )}
    </AuthShell>
  );
}
