"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldAlert,
  BarChart3,
  Store,
  Bike,
  Users,
  ShoppingBag,
  LogOut,
  Percent,
  Layers,
  CreditCard,
  Menu,
  X,
  UserCheck,
} from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";
import { NovoLogo } from "@/components/shared/NovoLogo";
import { Button } from "@/components/ui/Button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentRole, currentUser, authReady, isAuthenticated, setCurrentRole, logout } = usePlatform();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!authReady) return;

    const isAdmin = currentRole === "admin" || currentUser?.role === "admin";
    if (!isAuthenticated || !isAdmin) {
      router.replace("/auth?next=/admin");
      setIsAuthorized(false);
      setIsChecking(false);
      return;
    }

    setIsAuthorized(true);
    setIsChecking(false);
  }, [authReady, isAuthenticated, currentRole, currentUser, router]);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("novo_role");
      localStorage.removeItem("user_email");
      localStorage.removeItem("user_id");
    }
    logout();
    router.push("/auth");
  };

  const navItems = [
    { label: "Executive Overview", href: "/admin", icon: <BarChart3 className="w-5 h-5" /> },
    { label: "Financial Settlements", href: "/admin/settlements", icon: <CreditCard className="w-5 h-5" /> },
    { label: "Pricing & Commissions", href: "/admin/pricing", icon: <Percent className="w-5 h-5" /> },
    { label: "Categories & Highlights", href: "/admin/categories", icon: <Layers className="w-5 h-5" /> },
    { label: "Store Approvals", href: "/admin/stores", icon: <Store className="w-5 h-5" /> },
    { label: "Rider Fleet Verification", href: "/admin/riders", icon: <Bike className="w-5 h-5" /> },
    { label: "Live Orders Monitor", href: "/admin/orders", icon: <ShoppingBag className="w-5 h-5" /> },
    { label: "User Management", href: "/admin/users", icon: <Users className="w-5 h-5" /> },
  ];

  if (isChecking) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white p-6 font-sans">
        <div className="w-10 h-10 border-4 border-[#087F5B] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-slate-400">Verifying Platform Admin Permissions...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen w-full flex bg-[#F8FAF9] dark:bg-slate-950 font-sans">
      {/* DESKTOP ADMIN SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-950 text-white shrink-0">
        <div className="p-6 flex items-center justify-between">
          <NovoLogo variant="white" subtitle="Admin Control" size="md" href="/admin" />
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-none ${
                  isActive
                    ? "bg-[#087F5B] text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 flex flex-col gap-2 border-t border-slate-900">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCurrentRole("customer");
              router.push("/shop");
            }}
            className="w-full justify-start text-xs text-slate-400 hover:text-white rounded-none"
          >
            <UserCheck className="w-4 h-4 mr-2 text-emerald-400" />
            Switch to Customer View
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-none font-bold"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out Admin Account
          </Button>
        </div>
      </aside>

      {/* MOBILE SLIDE-OVER DRAWER MENU */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Dark Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Slide Drawer Content */}
          <div className="relative flex-1 max-w-xs w-full bg-slate-950 text-white flex flex-col justify-between h-full p-6 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <NovoLogo variant="white" subtitle="Admin Mobile" size="sm" href="/admin" />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="flex flex-col gap-1.5">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-none ${
                        isActive
                          ? "bg-[#087F5B] text-white"
                          : "text-slate-400 hover:text-white hover:bg-slate-900"
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-900 flex flex-col gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setCurrentRole("customer");
                  router.push("/shop");
                }}
                className="w-full justify-start text-xs text-slate-400 hover:text-white rounded-none"
              >
                <UserCheck className="w-4 h-4 mr-2 text-emerald-400" />
                Switch to Customer View
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-none font-bold"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log Out Admin Account
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER BAR */}
        <header className="h-16 bg-white dark:bg-slate-900 px-4 sm:px-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-1 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 truncate">
              Platform Master Administration
            </span>
            <span className="hidden sm:inline-block px-2.5 py-0.5 text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-[#087F5B] dark:text-emerald-300">
              SUPERADMIN
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500 font-medium text-[11px] sm:text-xs">
              {currentUser.name || "Admin"}
            </span>

            {/* Quick Header Logout Button */}
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-none bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 font-bold hover:bg-rose-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Log Out Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </header>

        {/* MAIN BODY CONTENT */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
