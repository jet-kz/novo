"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, User, Clock } from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
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
  const { isCartOpen, setIsCartOpen, isAuthenticated } = usePlatform();

  // Determine active view mode
  const isMerchant = pathname.startsWith("/merchant");
  const isRider = pathname.startsWith("/rider");
  const isAdmin = pathname.startsWith("/admin");
  // Hide main outer header on home page ("/") because header is integrated in hero banner
  const isCustomerHeaderVisible = !isMerchant && !isRider && !isAdmin && pathname !== "/";
  const isCustomerNavVisible = !isMerchant && !isRider && !isAdmin;

  const customerNavItems = [
    { label: "Home", href: "/", icon: <Home className="w-5 h-5" /> },
    { label: "Shop", href: "/shop", icon: <Search className="w-5 h-5" /> },
    { label: "Orders", href: "/orders", icon: <Clock className="w-5 h-5" /> },
    { label: "Profile", href: "/profile", icon: <User className="w-5 h-5" /> },
  ];

  const isHomePage = pathname === "/";

  return (
    <div
      className={`flex flex-col min-h-screen w-full pb-20 sm:pb-0 font-sans ${
        isHomePage
          ? "bg-[#0b0f19] text-slate-100"
          : "bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
      }`}
    >
      {/* GLOBAL HEADER (For Customer View except Home Page) */}
      {isCustomerHeaderVisible && (
        <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 border-b border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo */}
            <NovoLogo subtitle="Delivery Express" size="md" />

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {customerNavItems.map((item) => {
                const isActive = pathname === item.href;
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
              <NotificationBell />

              {!isAuthenticated && (
                <Link
                  href="/auth"
                  className="hidden sm:inline-flex px-4 py-2 rounded-xl text-xs font-extrabold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors"
                >
                  Account
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

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* 24/7 Customer Support Floating Assistant */}
      <SupportChatWidget />
    </div>
  );
}
