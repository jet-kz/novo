"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Store, MapPin, Check, ArrowRight } from "lucide-react";
import { apiService } from "@/services/api";
import { getUniqueStoreBanner, getUniqueStoreLogo } from "@/utils/storeImageUtils";
import { NovoLogo } from "@/components/shared/NovoLogo";

export default function MerchantRegisterPage() {
  const router = useRouter();
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
      // 1. Auth Signup with backend API
      let token = "";
      const authRes = await apiService.signUp({
        email,
        password,
        full_name: fullName,
        role: "merchant_owner",
        phone,
      });

      if (authRes && authRes.access_token) {
        token = authRes.access_token;
      } else {
        // Attempt login if token was not returned directly by signup
        const loginRes = await apiService.login({ email, password });
        if (loginRes && loginRes.access_token) {
          token = loginRes.access_token;
        } else {
          throw new Error(authRes?.detail || "Backend registration failed. Could not obtain session token.");
        }
      }

      if (!token) {
        throw new Error("Authentication token was not returned by backend.");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("access_token", token);
      }

      // 2. Merchant & Store creation with backend API
      const merch = await apiService.createMerchant({ name: businessName }, token);
      const merchantId = merch?.data?.id || merch?.id;
      if (merchantId) {
        const uniqueBanner = getUniqueStoreBanner({ name: businessName, category: businessType });
        const uniqueLogo = getUniqueStoreLogo({ name: businessName, category: businessType });
        await apiService.createStore(
          {
            merchantId,
            name: businessName,
            category: businessType as any,
            address,
            phone,
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

      router.push("/merchant");
    } catch (e: any) {
      console.error("Backend merchant creation error:", e);
      setError(e.message || "Registration failed on backend server. Please verify backend connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 font-sans text-[#17201D] dark:text-slate-100">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-none p-6 sm:p-8 flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-3">
          <NovoLogo subtitle="Merchant Registration" size="lg" href="/merchant" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Partner with Novo</h2>
          <p className="text-xs text-[#66736E] dark:text-slate-400">Register your business & start receiving customer orders</p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center leading-relaxed">
            {error}
          </div>
        )}

        {/* STEP PROGRESS */}
        <div className="flex items-center justify-center gap-3">
          <div className={`w-8 h-8 rounded-none flex items-center justify-center text-xs font-black ${step >= 1 ? "bg-[#087F5B] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
            1
          </div>
          <div className={`w-12 h-0.5 ${step >= 2 ? "bg-[#087F5B]" : "bg-slate-200 dark:bg-slate-800"}`} />
          <div className={`w-8 h-8 rounded-none flex items-center justify-center text-xs font-black ${step >= 2 ? "bg-[#087F5B] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
            2
          </div>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          {step === 1 && (
            <>
              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">Owner Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Godswill Okenrenkporo"
                  required
                  className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none rounded-none"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">Business Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@restaurant.com"
                  required
                  className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none rounded-none"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 803 123 4567"
                  required
                  className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none rounded-none"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none rounded-none"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (fullName && email && phone && password) setStep(2);
                }}
                className="w-full mt-2 py-3 bg-[#087F5B] text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer rounded-none"
              >
                <span>Continue to Business Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">Restaurant / Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Suya Kingdom & Fast Food"
                  required
                  className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none rounded-none"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">Business Category</label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none rounded-none"
                >
                  <option value="restaurant">Restaurant / Fast Food 🍲</option>
                  <option value="supermarket">Supermarket / Groceries 🛍️</option>
                  <option value="pharmacy">Pharmacy / Medical 💊</option>
                  <option value="bakery">Bakery & Pastries 🥐</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">Store Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 14 Commercial Avenue, Central District, Sapele"
                  required
                  className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none rounded-none"
                />
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer rounded-none"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-[#087F5B] text-white text-xs font-black cursor-pointer rounded-none"
                >
                  {loading ? "Creating Business Profile..." : "Complete Registration"}
                </button>
              </div>
            </>
          )}
        </form>

        <div className="text-center pt-2 text-xs">
          <span className="text-[#66736E] dark:text-slate-400">Already registered? </span>
          <Link href="/merchant/login" className="font-black text-[#087F5B] hover:underline">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
