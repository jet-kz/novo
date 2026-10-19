"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bike,
  CreditCard,
  ImageIcon,
  Layers,
  LogOut,
  Menu,
  Percent,
  ShoppingBag,
  Store,
  UserCog,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";
import { NovoLogo } from "@/components/shared/NovoLogo";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { apiService } from "@/services/api";

type Badges = { orders: number; riders: number; stores: number; refunds: number };
type NavItem = { label: string; href: string; icon: React.ReactNode; badge?: keyof Badges };

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Operations",
    items: [
      { label: "Overview", href: "/admin", icon: <BarChart3 className="w-4 h-4" /> },
      { label: "Orders", href: "/admin/orders", icon: <ShoppingBag className="w-4 h-4" />, badge: "orders" },
      { label: "Riders", href: "/admin/riders", icon: <Bike className="w-4 h-4" />, badge: "riders" },
      { label: "Stores & merchants", href: "/admin/stores", icon: <Store className="w-4 h-4" />, badge: "stores" },
      { label: "Users", href: "/admin/users", icon: <Users className="w-4 h-4" /> },
    ],
  },
  {
    group: "Money",
    items: [
      { label: "Payments & refunds", href: "/admin/payments", icon: <CreditCard className="w-4 h-4" />, badge: "refunds" },
      { label: "Settlements", href: "/admin/settlements", icon: <Wallet className="w-4 h-4" /> },
      { label: "Pricing & promotions", href: "/admin/pricing", icon: <Percent className="w-4 h-4" /> },
    ],
  },
  {
    group: "Storefront",
    items: [
      { label: "Ad banners", href: "/admin/banners", icon: <ImageIcon className="w-4 h-4" /> },
      { label: "Homepage categories", href: "/admin/categories", icon: <Layers className="w-4 h-4" /> },
    ],
  },
  {
    group: "Admin",
    items: [
      { label: "Activity log", href: "/admin/activity", icon: <Activity className="w-4 h-4" /> },
      { label: "My account & admins", href: "/admin/account", icon: <UserCog className="w-4 h-4" /> },
    ],
  },
];

const TITLES: Record<string, string> = Object.fromEntries(NAV.flatMap((g) => g.items.map((i) => [i.href, i.label])));

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, currentRole, isAuthenticated, authReady, logout } = usePlatform();
  const [menuOpen, setMenuOpen] = useState(false);
  const [badges, setBadges] = useState<Badges>({ orders: 0, riders: 0, stores: 0, refunds: 0 });

  const isAdmin = currentRole === "admin" || currentUser?.role === "admin";
  const authorized = authReady && isAuthenticated && isAdmin;

  useEffect(() => {
    if (authReady && !(isAuthenticated && isAdmin)) router.replace("/auth?next=/admin");
  }, [authReady, isAuthenticated, isAdmin, router]);

  useEffect(() => setMenuOpen(false), [pathname]);

  // Attention counts for the menu, refreshed every minute.
  const loadBadges = useCallback(async () => {
    try {
      const o = await apiService.adminOverview();
      setBadges({
        orders: o.attention.orders_not_accepted + o.attention.orders_waiting_for_rider,
        riders: o.attention.riders_to_review,
        stores: o.attention.stores_to_approve,
        refunds: o.attention.refunds_to_handle,
      });
    } catch {}
  }, []);
  useEffect(() => {
    if (!authorized) return;
    loadBadges();
    const t = setInterval(() => document.visibilityState === "visible" && loadBadges(), 60000);
    return () => clearInterval(t);
  }, [authorized, loadBadges, pathname]);

  if (!authorized) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white p-6">
        <div className="w-10 h-10 border-4 border-[#087F5B] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-slate-400">Checking admin access…</p>
      </div>
    );
  }

  const signOut = () => {
    logout();
    router.push("/auth");
  };

  const title =
    TITLES[pathname] ||
    Object.entries(TITLES).find(([href]) => href !== "/admin" && pathname.startsWith(href))?.[1] ||
    "Admin";

  const nav = (
    <nav className="flex-1 overflow-y-auto scrollbar-thin-dark px-3 py-2 flex flex-col gap-6">
      {NAV.map((group) => (
        <div key={group.group} className="flex flex-col gap-0.5">
          <p className="px-3 pb-1.5 text-[11px] font-medium text-slate-500">{group.group}</p>
          {group.items.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            const count = item.badge ? badges[item.badge] : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-medium transition-colors ${
                  active ? "bg-white/[0.08] text-white" : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-emerald-400" />}
                <span className={active ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"}>{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {count > 0 && (
                  <span className="min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center bg-amber-400 text-slate-950">
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  const footer = (
    <div className="p-3">
      <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.04]">
        <Link href="/admin/account" className="flex items-center gap-3 min-w-0 flex-1">
          <span className="w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center text-sm font-semibold shrink-0">
            {(currentUser.name || currentUser.email || "A").slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-white truncate">{currentUser.name || "Admin"}</span>
            <span className="block text-xs text-slate-500 truncate">{currentUser.email}</span>
          </span>
        </Link>
        <button onClick={signOut} aria-label="Sign out" title="Sign out" className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer shrink-0">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex bg-[#F5F7F6] dark:bg-slate-950">
      <aside className="hidden lg:flex flex-col w-64 bg-[#0B1220] dark:bg-black text-white shrink-0 sticky top-0 h-screen">
        <div className="px-6 py-5">
          <NovoLogo variant="white" subtitle="Admin" size="md" href="/admin" />
        </div>
        {nav}
        {footer}
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="relative w-72 max-w-[85%] h-full bg-[#0B1220] dark:bg-black text-white flex flex-col">
            <div className="px-5 py-4 flex items-center justify-between">
              <NovoLogo variant="white" subtitle="Admin" size="sm" href="/admin" />
              <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="p-2 text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            {nav}
            {footer}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-white/85 dark:bg-black/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between gap-3 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.25)]">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className="lg:hidden p-2 -ml-2 text-slate-700 dark:text-slate-200 cursor-pointer">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
