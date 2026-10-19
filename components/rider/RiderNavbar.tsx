"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bike, History, LogOut, MessageSquare, Wallet } from "lucide-react";
import { apiService } from "@/services/api";
import { usePlatform } from "@/store/PlatformContext";
import { NovoLogo } from "@/components/shared/NovoLogo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

/** Rider app chrome: glass header + bottom tabs on phones, matching the customer and merchant apps. */
export function RiderNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { riderProfile, toggleRiderOnline, logout } = usePlatform();
  const [unread, setUnread] = useState(0);
  const [toggling, setToggling] = useState(false);
  const isAuthScreen = pathname === "/rider/login" || pathname === "/rider/register";

  useEffect(() => {
    if (isAuthScreen) return;
    apiService.getMyNotifications().then((r) => setUnread(r.unread)).catch(() => {});
  }, [pathname, isAuthScreen]);

  if (isAuthScreen) return null;

  const tabs = [
    { label: "Jobs", href: "/rider", icon: Bike },
    { label: "Earnings", href: "/rider/earnings", icon: Wallet },
    { label: "History", href: "/rider/history", icon: History },
    { label: "Messages", href: "/rider/messages", icon: MessageSquare, badge: unread },
  ];
  const isActive = (href: string) => (href === "/rider" ? pathname === "/rider" : pathname.startsWith(href));
  const approved = !riderProfile.approvalStatus || riderProfile.approvalStatus === "approved";
  const online = !!riderProfile.isOnline;

  const toggle = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      await toggleRiderOnline();
    } catch {}
    setToggling(false);
  };

  const signOut = () => {
    logout();
    router.push("/rider/login");
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl shadow-[0_8px_24px_-16px_rgba(15,23,42,0.25)] pt-[env(safe-area-inset-top)]">
        <div className="max-w-5xl mx-auto h-16 px-4 sm:px-6 flex items-center gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <NovoLogo variant="rider" size="md" href="/rider" />
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold truncate max-w-[8rem] sm:max-w-[14rem] leading-tight">{riderProfile.name || "Rider"}</span>
              <span className="block text-[11px] text-slate-500 leading-tight">Rider</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1 mx-auto">
            {tabs.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={`h-9 px-4 rounded-full flex items-center gap-2 text-sm font-medium transition-colors ${
                  isActive(t.href) ? "bg-[#087F5B] text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {t.label}
                {t.badge ? (
                  <span className={`min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center ${isActive(t.href) ? "bg-white text-[#087F5B]" : "bg-amber-400 text-slate-900"}`}>
                    {t.badge}
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>

          <div className="ml-auto md:ml-0 flex items-center gap-2 shrink-0">
            {approved && (
              <button
                onClick={toggle}
                disabled={toggling}
                role="switch"
                aria-checked={online}
                title={online ? "You're getting job offers. Tap to go offline." : "Go online to get job offers."}
                className={`h-9 pl-2 pr-3.5 rounded-full flex items-center gap-2 text-[13px] font-semibold transition-colors cursor-pointer disabled:opacity-60 ${
                  online ? "bg-emerald-50 text-[#087F5B] dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                }`}
              >
                <span className={`relative w-8 h-5 rounded-full transition-colors ${online ? "bg-[#087F5B]" : "bg-slate-300 dark:bg-slate-600"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${online ? "left-3.5" : "left-0.5"}`} />
                </span>
                {online ? "Online" : "Offline"}
              </button>
            )}
            <ThemeToggle />
            <button
              onClick={signOut}
              aria-label="Sign out"
              title="Sign out"
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Phone: bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-black/85 backdrop-blur-xl shadow-[0_-8px_24px_-16px_rgba(15,23,42,0.3)] pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-4 h-16">
          {tabs.map((t) => {
            const Icon = t.icon;
            const on = isActive(t.href);
            return (
              <Link key={t.href} href={t.href} className={`relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium ${on ? "text-[#087F5B]" : "text-slate-500"}`}>
                <Icon className="w-5 h-5" />
                {t.label}
                {t.badge ? (
                  <span className="absolute top-2 left-1/2 ml-2 min-w-4 h-4 px-1 rounded-full bg-amber-400 text-slate-900 text-[10px] font-bold flex items-center justify-center">
                    {t.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
