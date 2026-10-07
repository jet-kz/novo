"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  MapPin,
  CreditCard,
  Wallet,
  Bell,
  HelpCircle,
  Settings,
  ShieldCheck,
  FileText,
  LogOut,
  ChevronRight,
  ChevronDown,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";

export function MobileProfileView() {
  const router = useRouter();
  const { currentUser, logout, isAuthenticated } = usePlatform();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Account: true,
    "Preferences & Support": true,
  });

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const storedEmail =
    typeof window !== "undefined" ? localStorage.getItem("user_email") || "" : "";
  const userEmail = currentUser?.email || storedEmail;
  const rawName = currentUser?.name || (userEmail ? userEmail.split("@")[0] : "");
  
  const formattedName = rawName
    ? rawName.charAt(0).toUpperCase() + rawName.slice(1)
    : "";

  const displayName = isAuthenticated
    ? formattedName || "Novo Member"
    : "Guest User";
  const displaySubtext = isAuthenticated
    ? userEmail || "Logged In Member Account"
    : "Log in to view complete profile";

  const menuGroups = [
    {
      title: "ACCOUNT",
      items: [
        { label: "My Orders", icon: ShoppingBag, href: "/orders" },
        { label: "Delivery Addresses", icon: MapPin, href: "/profile/addresses" },
        { label: "Payment Methods", icon: CreditCard, href: "/profile/payments" },
        { label: "Wallet & Earnings", icon: Wallet, href: "/wallet" },
      ],
    },
    {
      title: "PREFERENCES & SUPPORT",
      items: [
        { label: "Notifications", icon: Bell, href: "/notifications" },
        { label: "Help & Support", icon: HelpCircle, href: "/support" },
        { label: "App Settings", icon: Settings, href: "/profile/settings" },
        { label: "Privacy Policy", icon: ShieldCheck, href: "/support?tab=privacy" },
        { label: "Terms & Conditions", icon: FileText, href: "/support?tab=terms" },
      ],
    },
  ];

  return (
    <div className="md:hidden flex flex-col w-full min-h-screen bg-[#F7FAF8] dark:bg-slate-950 text-[#101714] dark:text-slate-100 pb-28 font-sans">
      {/* 1. TOP GREEN PROFILE HEADER */}
      <div className="bg-[#008A4C] text-white p-6 rounded-b-3xl shadow-md flex items-center gap-4">
        <div className="relative w-16 h-16 rounded-full bg-white/20 border-2 border-white flex items-center justify-center text-white text-xl font-black shrink-0 overflow-hidden shadow-sm">
          {displayName.charAt(0).toUpperCase()}
        </div>

        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black text-white truncate">
              {displayName}
            </h1>
            {isAuthenticated ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-900/60 backdrop-blur-md text-emerald-200 text-[9px] font-extrabold flex items-center gap-1 border border-emerald-400/30">
                <UserCheck className="w-2.5 h-2.5" />
                <span>Verified</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-emerald-900/60 backdrop-blur-md text-emerald-200 text-[9px] font-extrabold flex items-center gap-1 border border-emerald-400/30">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Guest</span>
              </span>
            )}
          </div>
          <p className="text-xs text-emerald-100/90 truncate font-medium">
            {displaySubtext}
          </p>
        </div>
      </div>

      {/* 2. FLAT BORDERLESS HERO UI LIST (NO CARDS, NO BOX SHADOWS) */}
      <div className="flex flex-col gap-6 py-4">
        {menuGroups.map((group) => {
          const isOpen = openSections[group.title] ?? true;
          return (
            <div key={group.title} className="flex flex-col">
              {/* Flat Section Header */}
              <button
                type="button"
                onClick={() => toggleSection(group.title)}
                className="w-full px-5 py-2.5 flex items-center justify-between bg-transparent cursor-pointer text-left"
              >
                <span className="text-[11px] font-black uppercase text-[#66736D] dark:text-slate-400 tracking-wider">
                  {group.title}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Flush List Items with Bottom Line Separators */}
              {isOpen && (
                <div className="flex flex-col bg-white dark:bg-slate-900 border-y border-[#E3EAE6]/80 dark:border-slate-800/80">
                  {group.items.map((item, idx) => {
                    const Icon = item.icon;
                    const isLast = idx === group.items.length - 1;
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={`flex items-center justify-between px-5 py-4 hover:bg-[#F7FAF8] dark:hover:bg-slate-800/50 transition-colors ${
                          !isLast ? "border-b border-[#E3EAE6]/70 dark:border-slate-800/70" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-8 h-8 rounded-full bg-[#E8F7EF] dark:bg-slate-800 text-[#008A4C] flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-[#101714] dark:text-slate-100">
                            {item.label}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* LOGOUT / AUTH BUTTON (FLAT BORDERLESS BUTTON) */}
        <div className="px-5 mt-2">
          {isAuthenticated ? (
            <button
              onClick={logout}
              className="w-full py-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer hover:bg-rose-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          ) : (
            <Link
              href="/auth"
              className="w-full py-3.5 rounded-2xl bg-[#008A4C] hover:bg-[#006B3C] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <span>Log In or Sign Up</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
