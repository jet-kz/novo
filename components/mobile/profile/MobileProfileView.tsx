"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
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
  Sparkles,
} from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";

export function MobileProfileView() {
  const router = useRouter();
  const { currentUser, logout, isAuthenticated } = usePlatform();

  const menuGroups = [
    {
      title: "Account",
      items: [
        { label: "My Orders", icon: ShoppingBag, href: "/orders" },
        { label: "Delivery Addresses", icon: MapPin, href: "/profile/addresses" },
        { label: "Payment Methods", icon: CreditCard, href: "/profile/payments" },
        { label: "Wallet & Earnings", icon: Wallet, href: "/wallet" },
      ],
    },
    {
      title: "Preferences & Support",
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
    <div className="md:hidden flex flex-col w-full min-h-screen bg-[#F7FAF8] dark:bg-slate-950 text-[#101714] dark:text-slate-100 pb-28">
      {/* 1. TOP GREEN PROFILE HEADER (Screen 12 reference) */}
      <div className="bg-[#008A4C] text-white p-6 rounded-b-3xl shadow-md flex items-center gap-4">
        <div className="relative w-16 h-16 rounded-full bg-white/20 border-2 border-white flex items-center justify-center text-white text-xl font-black shrink-0 overflow-hidden shadow-md">
          {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "G"}
        </div>

        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black text-white truncate">
              {currentUser?.name || "Guest User"}
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-900/60 backdrop-blur-md text-emerald-200 text-[9px] font-extrabold flex items-center gap-1 border border-emerald-400/30">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Premium</span>
            </span>
          </div>
          <p className="text-xs text-emerald-100/90 truncate font-medium">
            {currentUser?.email || "Log in to view complete profile"}
          </p>
        </div>
      </div>

      {/* 2. MENU OPTIONS */}
      <div className="p-4 flex flex-col gap-4">
        {menuGroups.map((group) => (
          <div
            key={group.title}
            className="p-2 rounded-2xl bg-white dark:bg-slate-900 border border-[#E3EAE6] dark:border-slate-800 shadow-xs flex flex-col"
          >
            <span className="px-3 pt-2 pb-1 text-[10px] font-black uppercase text-[#66736D] dark:text-slate-400 tracking-wider">
              {group.title}
            </span>

            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F7FAF8] dark:hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#E8F7EF] dark:bg-slate-800 text-[#008A4C] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-[#101714] dark:text-slate-200">
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>
              );
            })}
          </div>
        ))}

        {/* LOGOUT / AUTH BUTTON */}
        <div className="mt-2">
          {isAuthenticated ? (
            <button
              onClick={logout}
              className="w-full py-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-400 font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer hover:bg-rose-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          ) : (
            <Link
              href="/auth"
              className="w-full py-3.5 rounded-2xl bg-[#008A4C] hover:bg-[#006B3C] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <span>Log In or Sign Up</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
