"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  Headphones,
  LayoutGrid,
  LogOut,
  Menu as MenuIcon,
  MessageSquare,
  Settings,
  ShoppingBag,
  Store as StoreIcon,
  Ticket,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";
import { apiService } from "@/services/api";
import { EnableAlertsCard } from "@/components/notifications/EnableAlertsCard";
import { NovoLogo } from "@/components/shared/NovoLogo";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { NewOrderAlert } from "@/components/merchant/NewOrderAlert";

type NavItem = { label: string; href: string; icon: React.ComponentType<{ className?: string }>; badge?: number };

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setActiveStoreId, orders, merchantStore, toggleStoreStatus } = usePlatform();
  const [moreOpen, setMoreOpen] = useState(false);
  const [togglingStore, setTogglingStore] = useState(false);
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

  useEffect(() => setMoreOpen(false), [pathname]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("merchant_session");
      localStorage.removeItem("access_token");
    }
    setIsLoggedIn(false);
    router.push("/merchant/login");
  };

  // Sign-in / sign-up pages render on their own.
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Prevent a flash of the dashboard before redirecting signed-out visitors.
  if (!isAuthChecked || !isLoggedIn) {
    return (
      <div className="min-h-[100dvh] bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-[3px] border-[#087F5B] border-t-transparent animate-spin" aria-label="Loading" />
      </div>
    );
  }

  const pendingOrdersCount = orders.filter(
    (o) => (o.status as string) === "pending" || (o.status as string) === "pending_merchant" || o.status === "preparing"
  ).length;

  // Main tabs sit in the header (desktop) and bottom bar (phone); the rest live under "More".
  const mainNav: NavItem[] = [
    { label: "Home", href: "/merchant", icon: LayoutGrid },
    { label: "Orders", href: "/merchant/orders", icon: ShoppingBag, badge: pendingOrdersCount },
    { label: "Menu", href: "/merchant/menu", icon: UtensilsCrossed },
    { label: "Earnings", href: "/merchant/earnings", icon: Wallet },
  ];
  const moreNav: NavItem[] = [
    { label: "Store profile", href: "/merchant/profile", icon: StoreIcon },
    { label: "Promotions", href: "/merchant/promotions", icon: Ticket },
    { label: "Reviews", href: "/merchant/reviews", icon: MessageSquare },
    { label: "Analytics", href: "/merchant/analytics", icon: TrendingUp },
    { label: "Settings", href: "/merchant/settings", icon: Settings },
  ];
  const isActive = (href: string) => (href === "/merchant" ? pathname === "/merchant" : pathname.startsWith(href));
  const moreActive = moreNav.some((i) => isActive(i.href));
  const storeName = merchantStore?.name || merchantProfile?.businessName || "Your store";
  const storeOpen = merchantStore?.isOpening ?? true;

  const toggleOpen = async () => {
    if (!merchantStore || togglingStore) return;
    setTogglingStore(true);
    try {
      await toggleStoreStatus(merchantStore.id);
    } catch {}
    setTogglingStore(false);
  };

  const openSwitch = (
    <button
      onClick={toggleOpen}
      disabled={!merchantStore || togglingStore}
      role="switch"
      aria-checked={storeOpen}
      title={storeOpen ? "Customers can order now. Tap to close." : "Closed to new orders. Tap to open."}
      className={`h-9 pl-2 pr-3.5 rounded-full flex items-center gap-2 text-[13px] font-semibold transition-colors cursor-pointer disabled:opacity-60 ${
        storeOpen ? "bg-emerald-50 text-[#087F5B] dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
      }`}
    >
      <span className={`relative w-8 h-5 rounded-full transition-colors ${storeOpen ? "bg-[#087F5B]" : "bg-slate-300 dark:bg-slate-600"}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${storeOpen ? "left-3.5" : "left-0.5"}`} />
      </span>
      {storeOpen ? "Open" : "Closed"}
    </button>
  );

  return (
    <div className="min-h-[100dvh] w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Glass header, same as the customer homepage */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl shadow-[0_8px_24px_-16px_rgba(15,23,42,0.25)] pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 flex items-center gap-3">
          <div className="flex items-center gap-2.5 min-w-0 shrink">
            <NovoLogo variant="icon" size="md" href="/merchant" />
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold truncate max-w-[7.5rem] sm:max-w-[16rem] leading-tight">{storeName}</span>
              <span className="block text-[11px] text-slate-500 leading-tight">Merchant</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1 mx-auto">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`h-9 px-4 rounded-full flex items-center gap-2 text-sm font-medium transition-colors ${
                  isActive(item.href) ? "bg-[#087F5B] text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {item.label}
                {item.badge ? (
                  <span
                    className={`min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                      isActive(item.href) ? "bg-white text-[#087F5B]" : "bg-amber-400 text-slate-900"
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            ))}
            <div className="relative">
              <button
                onClick={() => setMoreOpen((o) => !o)}
                aria-expanded={moreOpen}
                className={`h-9 px-4 rounded-full flex items-center gap-1 text-sm font-medium cursor-pointer ${
                  moreActive ? "bg-[#087F5B] text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                More <ChevronDown className="w-4 h-4" />
              </button>
              {moreOpen && <MoreMenu items={moreNav} isActive={isActive} onClose={() => setMoreOpen(false)} onLogout={handleLogout} />}
            </div>
          </nav>

          <div className="ml-auto md:ml-0 flex items-center gap-2 shrink-0">
            {openSwitch}
            <NotificationBell />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 pb-28 md:pb-12">
        <NewOrderAlert />
        <div className="mb-5 empty:hidden">
          <EnableAlertsCard
            storageKey="merchant"
            title="Never miss an order"
            body="Get a notification on this phone or computer the moment a customer orders, even when Novo isn't open."
          />
        </div>
        {children}
      </main>

      {/* Phone: bottom tab bar, same as the customer app */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-black/85 backdrop-blur-xl shadow-[0_-8px_24px_-16px_rgba(15,23,42,0.3)] pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 h-16">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const on = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium ${on ? "text-[#087F5B]" : "text-slate-500"}`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
                {item.badge ? (
                  <span className="absolute top-2 left-1/2 ml-2 min-w-4 h-4 px-1 rounded-full bg-amber-400 text-slate-900 text-[10px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium cursor-pointer ${moreActive ? "text-[#087F5B]" : "text-slate-500"}`}
          >
            <MenuIcon className="w-5 h-5" />
            More
          </button>
        </div>
      </nav>

      {/* Phone: "More" sheet */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-slate-950/50" onClick={() => setMoreOpen(false)} />
          <div className="relative w-full bg-white dark:bg-slate-900 rounded-t-[28px] p-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <span className="block mx-auto mb-3 mt-1 w-10 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
            <MoreLinks items={moreNav} isActive={isActive} onPick={() => setMoreOpen(false)} onLogout={handleLogout} large />
          </div>
        </div>
      )}
    </div>
  );
}

function MoreLinks({
  items,
  isActive,
  onPick,
  onLogout,
  large,
}: {
  items: NavItem[];
  isActive: (href: string) => boolean;
  onPick: () => void;
  onLogout: () => void;
  large?: boolean;
}) {
  const row = `flex items-center gap-3 ${large ? "px-4 h-12 text-[15px]" : "px-3 h-10 text-sm"} rounded-2xl font-medium`;
  const icon = large ? "w-5 h-5" : "w-4 h-4";
  return (
    <>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onPick}
            className={`${row} ${
              isActive(item.href) ? "bg-emerald-50 text-[#087F5B] dark:bg-emerald-950/40" : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Icon className={icon} /> {item.label}
          </Link>
        );
      })}
      <a href="mailto:info@novong.com" className={`${row} text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800`}>
        <Headphones className={icon} /> Help &amp; support
      </a>
      <button onClick={onLogout} className={`${row} w-full text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer`}>
        <LogOut className={icon} /> Sign out
      </button>
    </>
  );
}

function MoreMenu({ items, isActive, onClose, onLogout }: { items: NavItem[]; isActive: (href: string) => boolean; onClose: () => void; onLogout: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute z-50 top-11 left-1/2 -translate-x-1/2 w-56 p-1.5 rounded-2xl bg-white dark:bg-slate-900 shadow-[0_16px_48px_-12px_rgba(15,23,42,0.3)]">
        <MoreLinks items={items} isActive={isActive} onPick={onClose} onLogout={onLogout} />
      </div>
    </>
  );
}
