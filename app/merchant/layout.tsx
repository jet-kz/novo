"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  Calendar,
  Grid,
  Ticket,
  Wallet,
  MessageSquare,
  Store as StoreIcon,
  Settings,
  Headphones,
  Bell,
  CheckCircle2,
  ChevronDown,
  Menu as MenuIcon,
  X,
  TrendingUp,
  LogOut,
} from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";
import { apiService } from "@/services/api";
import { NovoLogo } from "@/components/shared/NovoLogo";

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { stores, activeStore, setActiveStoreId, orders } = usePlatform();
  const myStore = activeStore || stores[0];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const isAuthPage =
    pathname === "/merchant/login" ||
    pathname === "/merchant/signup" ||
    pathname === "/merchant/register";

  const [merchantProfile, setMerchantProfile] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const session = localStorage.getItem("merchant_session");
      const token = localStorage.getItem("access_token");
      const hasAuth = !!session || !!token;
      setIsLoggedIn(hasAuth);
      setIsAuthChecked(true);

      const rawProfile = localStorage.getItem("merchant_profile");
      if (rawProfile) {
        try { setMerchantProfile(JSON.parse(rawProfile)); } catch(e) {}
      }

      if (token) {
        apiService.getMerchantMe(token).then((res) => {
          if (res) {
            const merch = res.merchant || res;
            const store = res.stores?.[0];
            const bName = store?.name || merch?.name;
            const bAddr = store?.address || merch?.address;
            if (bName) {
              const profile = {
                fullName: merch?.owner_name || merch?.full_name || bName,
                businessName: bName,
                address: bAddr || "Store Address",
                businessType: store?.store_type || "Restaurant",
              };
              setMerchantProfile((prev: any) => {
                if (prev && prev.businessName && prev.businessName !== "Merchant A" && prev.businessName !== "Merchant A Gourmet Kitchen") {
                  return prev;
                }
                localStorage.setItem("merchant_profile", JSON.stringify(profile));
                return profile;
              });
            }
            if (store?.id) {
              setActiveStoreId(store.id);
            }
          }
        }).catch(() => {});
      }

      if (!hasAuth && !isAuthPage) {
        router.push("/merchant/login");
      }
    }
  }, [pathname, isAuthPage, router, setActiveStoreId]);

  // Handle Logout
  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("merchant_session");
      localStorage.removeItem("access_token");
    }
    setIsLoggedIn(false);
    router.push("/merchant/login");
  };

  // If on Auth/Signup/Register page, render standalone page directly
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Prevent flash of dashboard before redirecting unauthenticated users
  if (!isAuthChecked || (!isLoggedIn && !isAuthPage)) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-[#087F5B] border-t-transparent animate-spin" />
          <span className="text-xs font-black text-[#087F5B]">Verifying Merchant Session...</span>
        </div>
      </div>
    );
  }

  const pendingOrdersCount =
    orders.filter(
      (o) =>
        (o.status as string) === "pending" ||
        (o.status as string) === "pending_merchant" ||
        o.status === "preparing"
    ).length;

  const navItems = [
    { label: "Dashboard", href: "/merchant", icon: LayoutGrid },
    { label: "Orders", href: "/merchant/orders", icon: Calendar, badge: pendingOrdersCount },
    { label: "Menu", href: "/merchant/menu", icon: Grid },
    { label: "Promotions", href: "/merchant/promotions", icon: Ticket },
    { label: "Earnings", href: "/merchant/earnings", icon: Wallet },
    { label: "Reviews", href: "/merchant/reviews", icon: MessageSquare },
    { label: "Store Profile", href: "/merchant/profile", icon: StoreIcon },
    { label: "Analytics", href: "/merchant/analytics", icon: TrendingUp },
    { label: "Settings", href: "/merchant/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen w-full flex bg-[#F8FAF9] dark:bg-slate-950 font-sans text-[#17201D] dark:text-slate-100">
      {/* MOBILE DRAWER BACKDROP */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* LEFT SIDEBAR (EXACT MATCH TO MOCKUP) */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between p-5 transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div>
          {/* LOGO AREA */}
          <div className="flex items-center justify-between pb-6 mb-2">
            <NovoLogo subtitle="Merchant Portal" size="md" href="/merchant" />

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* NAVIGATION LINKS */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-extrabold transition-all ${
                    isActive
                      ? "bg-[#E6F7F2] text-[#087F5B] dark:bg-emerald-950/60 dark:text-emerald-300 font-black shadow-sm"
                      : "text-[#66736E] dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-[#087F5B] dark:text-emerald-300" : "text-[#66736E] dark:text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge ? (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                        isActive
                          ? "bg-[#087F5B] text-white"
                          : "bg-emerald-100 text-[#087F5B] dark:bg-emerald-900/60 dark:text-emerald-300"
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM NEED HELP CARD */}
        <div className="mt-8 p-4 rounded-3xl bg-[#E6F7F2] dark:bg-slate-800/80 border border-emerald-100 dark:border-slate-700/60 flex flex-col items-center text-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#087F5B]/15 text-[#087F5B] dark:bg-emerald-400/20 dark:text-emerald-300 flex items-center justify-center">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white">Need Help?</h4>
            <p className="text-[11px] text-[#66736E] dark:text-slate-400 font-medium mt-0.5">Contact our support team</p>
          </div>
          <a
            href="mailto:support@novo.ng"
            className="w-full py-2.5 rounded-xl bg-[#087F5B] text-white text-xs font-extrabold hover:bg-[#065A43] transition-colors shadow-md shadow-[#087F5B]/20 text-center cursor-pointer"
          >
            Get Help
          </a>
        </div>
      </aside>

      {/* RIGHT MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER BAR */}
        <header className="h-20 bg-[#F8FAF9] dark:bg-slate-950 px-4 sm:px-8 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            >
              <MenuIcon className="w-5 h-5" />
            </button>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[#66736E] dark:text-slate-400 hidden sm:inline">Welcome back,</span>
                <h1 className="text-base sm:text-xl font-black text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                  <span>{merchantProfile?.businessName || activeStore?.name || "Your Business Store"}</span>
                  <CheckCircle2 className="w-4 h-4 text-[#087F5B] fill-[#087F5B] text-white shrink-0" />
                </h1>
              </div>
              <p className="text-[11px] sm:text-xs text-[#66736E] dark:text-slate-400 font-medium truncate">
                {merchantProfile?.address ? `📍 ${merchantProfile.address}` : "Let's grow your business today!"}
              </p>
            </div>
          </div>

          {/* TOP RIGHT PROFILE & NOTIFICATIONS & LOGOUT */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <button className="relative p-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-all shadow-sm">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950">
                0
              </span>
            </button>

            <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-slate-200 dark:border-slate-800">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#087F5B] text-white font-black text-xs flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm">
                {(merchantProfile?.fullName || "M").charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  {merchantProfile?.fullName || "Store Owner"}
                </span>
                <span className="text-[10px] font-semibold text-[#66736E] dark:text-slate-400 capitalize">
                  {merchantProfile?.businessType || "Merchant Partner"}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-1 cursor-pointer"
                title="Sign Out of Merchant Account"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* MAIN BODY DASHBOARD ROUTE VIEWS */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
