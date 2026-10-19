"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bike, Wallet, FileCheck, TrendingUp, Menu, X, LogOut, ArrowRight, MessageSquare } from "lucide-react";
import { apiService } from "@/services/api";
import { NovoLogo } from "@/components/shared/NovoLogo";

export function RiderNavbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const isAuthScreen = pathname === "/rider/login" || pathname === "/rider/register";

  useEffect(() => {
    if (isAuthScreen) return;
    apiService.getMyNotifications().then((r) => setUnread(r.unread)).catch(() => {});
  }, [pathname, isAuthScreen]);

  // Don't render navigation on auth / login / register pages
  if (isAuthScreen) {
    return null;
  }

  return (
    <>
      {/* GLOBAL RIDER TOP HEADER BAR */}
      <header className="w-full bg-slate-900 border-slate-800 sticky top-0 z-30 px-4 sm:px-6 py-3 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <NovoLogo variant="rider" subtitle="Courier Partner Hub" size="md" href="/rider" />

          {/* DESKTOP NAV LINKS */}
          <nav className="hidden sm:flex items-center gap-2 text-xs font-bold">
            <Link
              href="/rider"
              className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
                pathname === "/rider"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Bike className="w-4 h-4 text-emerald-400" />
              <span>Active Dispatches</span>
            </Link>

            <Link
              href="/rider/earnings"
              className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
                pathname === "/rider/earnings"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Earnings</span>
            </Link>

            <Link
              href="/rider/history"
              className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
                pathname === "/rider/history"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <FileCheck className="w-4 h-4 text-slate-400" />
              <span>History</span>
            </Link>
          </nav>

          <Link
            href="/rider/messages"
            aria-label={unread ? `Messages, ${unread} unread` : "Messages"}
            className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <MessageSquare className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center">
                {unread}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* POPUP DRAWER: EXPANDABLE MOBILE MENU SHEET */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col justify-end p-4 animate-in fade-in duration-200 select-none">
          <div className="w-full max-w-md mx-auto bg-slate-900 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-white">
            <div className="flex items-center justify-between border-slate-800 pb-3">
              <NovoLogo variant="rider" subtitle="Partner Portal Nav" size="sm" href="/rider" />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer border border-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* RIDER NAVIGATION LINKS */}
            <div className="flex flex-col gap-2">
              <Link
                href="/rider"
                onClick={() => setMobileMenuOpen(false)}
                className={`p-3.5 rounded-2xl flex items-center justify-between font-bold text-xs border ${
                  pathname === "/rider"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : "bg-slate-800/80 text-slate-200 border-slate-700/60 hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Bike className="w-5 h-5 text-emerald-400" />
                  <span>Active Dispatches & GPS Map</span>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </Link>

              <Link
                href="/rider/earnings"
                onClick={() => setMobileMenuOpen(false)}
                className={`p-3.5 rounded-2xl flex items-center justify-between font-bold text-xs border ${
                  pathname === "/rider/earnings"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : "bg-slate-800/80 text-slate-200 border-slate-700/60 hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-amber-400" />
                  <span>Earnings & Wallet</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/rider/history"
                onClick={() => setMobileMenuOpen(false)}
                className={`p-3.5 rounded-2xl flex items-center justify-between font-bold text-xs border ${
                  pathname === "/rider/history"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : "bg-slate-800/80 text-slate-200 border-slate-700/60 hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileCheck className="w-5 h-5 text-sky-400" />
                  <span>Completed Delivery History</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/rider/messages"
                onClick={() => setMobileMenuOpen(false)}
                className={`p-3.5 rounded-2xl flex items-center justify-between font-bold text-xs border ${
                  pathname === "/rider/messages"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : "bg-slate-800/80 text-slate-200 border-slate-700/60 hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                  <span>Messages from Novo{unread > 0 ? ` (${unread} new)` : ""}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>

            {/* SIGN OUT */}
            <Link
              href="/rider/login"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-2xl bg-rose-950/40 text-rose-300 border border-rose-800/50 flex items-center justify-center gap-2 font-bold text-xs hover:bg-rose-950/70"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Rider Account</span>
            </Link>
          </div>
        </div>
      )}

      {/* FLOATING MOBILE BOTTOM NAVIGATION BAR FOR ALL RIDER PAGES */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-full px-6 py-2.5 shadow-2xl flex items-center gap-6 select-none">
        <Link
          href="/rider"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-extrabold ${
            pathname === "/rider" ? "text-emerald-400" : "text-slate-400 hover:text-white"
          }`}
        >
          <Bike className="w-5 h-5" />
          <span>Jobs</span>
        </Link>

        {/* CENTER FLOATING MENU BUTTON */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all -mt-4 border-2 border-slate-950 cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        <Link
          href="/rider/earnings"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-extrabold ${
            pathname === "/rider/earnings" ? "text-emerald-400" : "text-slate-400 hover:text-white"
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span>Earnings</span>
        </Link>
      </div>
    </>
  );
}
