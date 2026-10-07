"use client";

import React, { useState, useEffect } from "react";
import { usePlatform } from "@/store/PlatformContext";
import { Store as StoreIcon, Clock, MapPin, Phone, Upload, Check, Loader2, Image as ImageIcon, Sparkles } from "lucide-react";
import { apiService } from "@/services/api";

const BANNER_PRESETS = [
  { id: "b1", title: "Gourmet & Restaurant", url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80" },
  { id: "b2", title: "Burgers & Fast Food", url: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80" },
  { id: "b3", title: "Local & African Cuisine", url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80" },
  { id: "b4", title: "Supermarket & Groceries", url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80" },
  { id: "b5", title: "Pharmacy & Wellness", url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80" },
];

const LOGO_PRESETS = [
  { id: "l1", title: "Chef / Dining", url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80" },
  { id: "l2", title: "Grill / Burger", url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80" },
  { id: "l3", title: "Groceries", url: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=300&q=80" },
  { id: "l4", title: "Health / Rx", url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=300&q=80" },
];

export default function MerchantProfilePage() {
  const { stores, activeStore, updateStore } = usePlatform();
  const myStore = activeStore || stores[0];

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cuisineType, setCuisineType] = useState("Fast Food • Local Foods");
  const [deliveryFee, setDeliveryFee] = useState("450");
  const [minOrder, setMinOrder] = useState("1500");
  const [logo, setLogo] = useState(BANNER_PRESETS[0].url);
  const [banner, setBanner] = useState(BANNER_PRESETS[0].url);
  const [storeId, setStoreId] = useState<string | null>(myStore?.id || null);
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMerchantBackendProfile() {
      try {
        setIsLoading(true);
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
        const merchantMe = await apiService.getMerchantMe(token || undefined);

        if (merchantMe && merchantMe.stores && merchantMe.stores.length > 0) {
          const backendStore = merchantMe.stores[0];
          setStoreId(backendStore.id);
          setName(backendStore.name || "");
          setAddress(backendStore.address || "");
          setPhone(backendStore.phone || "");
          setCuisineType(backendStore.store_type || backendStore.settings?.cuisine_type || "restaurant");
          if (backendStore.logo) setLogo(backendStore.logo);
          if (backendStore.banner) setBanner(backendStore.banner);
          if (backendStore.settings?.email) setEmail(backendStore.settings.email);
          if (backendStore.settings?.delivery_fee) setDeliveryFee(String(backendStore.settings.delivery_fee));
          if (backendStore.settings?.min_order) setMinOrder(String(backendStore.settings.min_order));
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.warn("Could not load backend merchant profile:", e);
      }

      // Fallback to local storage or activeStore
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("merchant_profile");
        if (raw) {
          try {
            const profile = JSON.parse(raw);
            if (profile.businessName) setName(profile.businessName);
            if (profile.address) setAddress(profile.address);
            if (profile.phone) setPhone(profile.phone);
            if (profile.email) setEmail(profile.email);
            if (profile.businessType) setCuisineType(profile.businessType);
            if (profile.deliveryFee) setDeliveryFee(String(profile.deliveryFee));
            if (profile.minOrder) setMinOrder(String(profile.minOrder));
            if (profile.logo) setLogo(profile.logo);
            if (profile.banner) setBanner(profile.banner);
          } catch (e) {}
        } else if (myStore) {
          setName(myStore.name || "");
          setAddress(myStore.address || "");
          setPhone(myStore.phone || "");
          setCuisineType(myStore.cuisineType || "Fast Food");
          if (myStore.logo) setLogo(myStore.logo);
          if (myStore.banner) setBanner(myStore.banner);
          setStoreId(myStore.id);
        }
      }
      setIsLoading(false);
    }

    loadMerchantBackendProfile();
  }, [myStore]);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setLogo(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setBanner(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const updatedProfile = {
      fullName: name + " Owner",
      businessName: name,
      address,
      phone,
      email,
      businessType: cuisineType,
      deliveryFee: Number(deliveryFee),
      minOrder: Number(minOrder),
      logo,
      banner,
      isVerified: true,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("merchant_profile", JSON.stringify(updatedProfile));
    }

    let targetStoreId = storeId || myStore?.id;

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      if (token) {
        const meRes = await apiService.getMerchantMe(token);
        if (meRes?.stores?.[0]?.id) {
          targetStoreId = meRes.stores[0].id;
        }
      }

      if (targetStoreId) {
        await apiService.updateStore(
          targetStoreId,
          {
            name,
            address,
            phone,
            logo,
            banner,
            store_type: cuisineType.toLowerCase().includes("pharmacy")
              ? "pharmacy"
              : cuisineType.toLowerCase().includes("supermarket") || cuisineType.toLowerCase().includes("grocery")
              ? "supermarket"
              : "restaurant",
            settings: {
              email,
              cuisine_type: cuisineType,
              delivery_fee: Number(deliveryFee),
              min_order: Number(minOrder),
            },
          },
          token || undefined
        );
      }
    } catch (e) {
      console.warn("Error updating store profile via API:", e);
    }

    if (targetStoreId) {
      updateStore(targetStoreId, {
        name,
        address,
        phone,
        cuisineType,
        logo,
        banner,
        deliveryFee: Number(deliveryFee),
        minOrder: Number(minOrder),
      });
    }

    setIsSubmitting(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12 font-sans text-[#17201D] dark:text-slate-100">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Store Profile & Settings</h1>
        <p className="text-xs text-[#66736E] dark:text-slate-400 font-medium mt-1">
          Manage store branding, profile photos, delivery rules and operational details
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-[#087F5B] dark:text-emerald-300 text-xs font-black flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Store settings and profile images updated successfully!</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-12 text-center text-xs text-[#66736E] font-bold flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#087F5B]" />
          <span>Loading store profile...</span>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-8"
        >
          {/* SECTION 1: STORE BRANDING & IMAGES */}
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#087F5B]" />
              <span>Store Branding & Photos</span>
            </h3>

            {/* STORE BANNER PREVIEW & SELECTOR */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300">Store Cover Banner</label>
              <div className="h-44 w-full rounded-2xl overflow-hidden relative border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                <img src={banner} alt="Store Cover Banner" className="w-full h-full object-cover" />
                <label className="absolute bottom-3 right-3 px-4 py-2 rounded-xl bg-slate-900/80 text-white text-xs font-extrabold backdrop-blur-md cursor-pointer hover:bg-slate-900 transition-all flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Custom Banner</span>
                  <input type="file" accept="image/*" onChange={handleBannerFileUpload} className="hidden" />
                </label>
              </div>

              {/* Banner Presets */}
              <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1">
                <span className="text-[11px] font-bold text-slate-400 shrink-0">Preset Banners:</span>
                {BANNER_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setBanner(p.url)}
                    className={`h-12 w-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      banner === p.url ? "border-[#087F5B] scale-105 shadow-md" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={p.url} alt={p.title} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* STORE LOGO PREVIEW & SELECTOR */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="w-20 h-20 rounded-2xl overflow-hidden relative border-2 border-[#087F5B] bg-slate-100 dark:bg-slate-800 shrink-0 shadow-sm">
                <img src={logo} alt="Store Logo" className="w-full h-full object-cover" />
              </div>

              <div className="flex flex-col gap-2 flex-1 w-full">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300">Store Logo Photo</label>
                  <label className="text-xs font-extrabold text-[#087F5B] hover:underline cursor-pointer flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Custom Logo</span>
                    <input type="file" accept="image/*" onChange={handleLogoFileUpload} className="hidden" />
                  </label>
                </div>

                <input
                  type="text"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  placeholder="Paste image URL (https://...)"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none text-slate-900 dark:text-white"
                />

                {/* Logo Presets */}
                <div className="flex items-center gap-2 overflow-x-auto pt-1">
                  <span className="text-[11px] font-bold text-slate-400 shrink-0">Presets:</span>
                  {LOGO_PRESETS.map((lp) => (
                    <button
                      key={lp.id}
                      type="button"
                      onClick={() => setLogo(lp.url)}
                      className={`w-8 h-8 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        logo === lp.url ? "border-[#087F5B] scale-105" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={lp.url} alt={lp.title} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: BUSINESS DETAILS */}
          <div className="flex flex-col gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Business Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">Store Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Suya Kingdom"
                  required
                  className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none text-slate-900 dark:text-white"
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
                  className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">Business Category / Tags</label>
                <input
                  type="text"
                  value={cuisineType}
                  onChange={(e) => setCuisineType(e.target.value)}
                  placeholder="e.g. Restaurant, Fast Food, Suya"
                  required
                  className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">Business Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="store@restaurant.com"
                  className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-black text-slate-700 dark:text-slate-300">Store Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 14 Commercial Avenue, Sapele"
                required
                className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">Delivery Fee (₦)</label>
                <input
                  type="number"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">Minimum Order (₦)</label>
                <input
                  type="number"
                  value={minOrder}
                  onChange={(e) => setMinOrder(e.target.value)}
                  className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-fit px-8 py-3 rounded-2xl bg-[#087F5B] text-white text-xs font-black hover:bg-[#065A43] transition-all cursor-pointer shadow-md shadow-[#087F5B]/20 flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Save Store Profile</span>
          </button>
        </form>
      )}
    </div>
  );
}
