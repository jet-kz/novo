"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, MapPin, CreditCard, Heart, LogOut, ShieldCheck, Phone, Mail, CheckCircle2, LogIn } from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

import { MobileProfileView } from "@/components/mobile/profile/MobileProfileView";

export default function CustomerProfilePage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, logout, favorites, stores, products } = usePlatform();
  const [name, setName] = useState(currentUser.name || "");
  const [phone, setPhone] = useState(currentUser.phone || "");
  const [address, setAddress] = useState(currentUser.address || "");
  const [saved, setSaved] = useState(false);
  const [loggedOut, setLoggedOut] = useState(false);

  // Unauthenticated State Handling
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center flex flex-col items-center justify-center min-h-[65vh]">
        <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 shadow-sm">
          <User className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
          Sign In to Your Profile
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-8 leading-relaxed max-w-sm">
          Log in or create a Novo account to manage your delivery address, track active orders, and view your saved stores.
        </p>
        <Link href="/auth" className="w-full">
          <Button variant="primary" size="lg" className="w-full" rightIcon={<LogIn className="w-4 h-4" />}>
            Sign In / Register
          </Button>
        </Link>
      </div>
    );
  }

  const favStores = stores.filter((s) => favorites.includes(s.id));
  const favProducts = products.filter((p) => favorites.includes(p.id));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => {
    setLoggedOut(true);
    logout();
    setTimeout(() => {
      router.push("/auth");
    }, 800);
  };

  const displayName = name || currentUser.email.split("@")[0] || "User";

  return (
    <>
      <MobileProfileView />
      <div className="hidden md:block max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full min-h-screen">
      {loggedOut && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>Logged out successfully. Redirecting to login portal...</span>
        </div>
      )}

      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">{displayName}</h1>
            <p className="text-xs font-semibold text-slate-500">{currentUser.email}</p>
          </div>
        </div>

        {/* Header Logout Button */}
        <Button
          variant="outline"
          onClick={handleLogout}
          className="text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-black cursor-pointer self-start sm:self-auto"
          leftIcon={<LogOut className="w-4 h-4" />}
        >
          Log Out
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Form Column */}
        <div className="md:col-span-8 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-6">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
              Personal Profile & Delivery Address
            </h3>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Input
                label="Primary Delivery Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <Button variant="primary" type="submit" className="mt-2 w-fit">
                {saved ? "Saved Successfully!" : "Save Changes"}
              </Button>
            </form>
          </div>

          {/* Saved Favorites Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                Your Saved Favorites ({favStores.length + favProducts.length})
              </h3>
            </div>

            {favStores.length === 0 && favProducts.length === 0 ? (
              <p className="text-xs text-slate-400">
                You haven't added any stores or items to your favorites yet. Click the heart icon on any store or dish card!
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {favStores.map((st) => (
                  <Link
                    key={st.id}
                    href={`/shop?store=${st.id}`}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img src={st.logo} alt={st.name} className="w-10 h-10 rounded-xl object-cover" />
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">{st.name}</h4>
                        <span className="text-[10px] text-slate-400 font-semibold">{st.cuisineType || "Store"} • ⭐ {st.rating}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Visit Store →</span>
                  </Link>
                ))}

                {favProducts.map((pd) => (
                  <div
                    key={pd.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60"
                  >
                    <div className="flex items-center gap-3">
                      <img src={pd.image} alt={pd.name} className="w-10 h-10 rounded-xl object-cover" />
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">{pd.name}</h4>
                        <span className="text-[10px] text-slate-400 font-semibold">₦{pd.price.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Security Column */}
        <div className="md:col-span-4 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Account Security</h4>
            
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Verified Account</span>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-400 text-xs font-black transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Novo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
