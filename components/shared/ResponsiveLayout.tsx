"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, User, Clock } from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartBar } from "@/components/cart/CartBar";
import { Footer } from "@/components/shared/Footer";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { SupportChatWidget } from "@/components/shared/SupportChatWidget";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { NovoLogo } from "@/components/shared/NovoLogo";

import { MobileBottomNav } from "@/components/mobile/navigation/MobileBottomNav";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export default function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const pathname = usePathname();
  const { isAuthenticated, currentUser } = usePlatform();

  // Merchant, rider and admin portals bring their own chrome; auth screens stay bare.
  const isPortal = ["/merchant", "/rider", "/admin"].some((p) => pathname.startsWith(p));
  const isAuthScreen = pathname === "/auth" || pathname.startsWith("/auth/");
  const isCustomerChrome = !isPortal && !isAuthScreen;
  // One header for every customer page on desktop. On mobile each screen has its own
  // title bar and the bottom nav handles navigation, so a second global bar is not shown.
  const isCustomerHeaderVisible = isCustomerChrome;
  const isCustomerNavVisible = isCustomerChrome;

  const customerNavItems = [
    { label: "Home", href: "/", icon: <Home className="w-5 h-5" /> },
    { label: "Shop", href: "/shop", icon: <Search className="w-5 h-5" /> },
    { label: "Orders", href: "/orders", icon: <Clock className="w-5 h-5" /> },
    { label: "Profile", href: "/profile", icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div
      className={`flex flex-col min-h-screen w-full font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 ${isCustomerNavVisible ? "pb-20 md:pb-0" : ""}`}
    >
      {/* GLOBAL CUSTOMER HEADER (desktop) */}
      {isCustomerHeaderVisible && (
        <header className="hidden md:block sticky top-0 z-40 w-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl shadow-[0_8px_24px_-16px_rgba(15,23,42,0.25)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo */}
            <NovoLogo subtitle="Delivery Express" size="md" />

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {customerNavItems.map((item) => {
                const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      isActive
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {isAuthenticated && <NotificationBell />}

              {isAuthenticated ? (
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-extrabold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors"
                >
                  <User className="w-4 h-4 text-[#087F5B] dark:text-emerald-400" />
                  <span className="max-w-[120px] truncate">{currentUser?.name || "Account"}</span>
                </Link>
              ) : (
                <Link
                  href="/auth"
                  className="inline-flex px-4 py-2 rounded-xl text-xs font-extrabold bg-[#087F5B] hover:bg-[#066a4c] text-white transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </header>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full flex flex-col">{children}</main>

      {/* FOOTER */}
      {isCustomerNavVisible && <Footer />}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      {isCustomerNavVisible && <MobileBottomNav />}

      {/* Floating basket bar + cart sheet */}
      <CartBar />
      <CartDrawer />

      {/* 24/7 Customer Support Floating Assistant */}
      {isCustomerChrome && <SupportChatWidget />}
    </div>
  );
}
