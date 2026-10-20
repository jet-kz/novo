"use client";

import React from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { AlertSettings } from "@/components/notifications/AlertSettings";
import { ThemeSwitcher } from "@/components/shared/ThemeToggle";

export default function MerchantSettingsPage() {
  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Alerts, appearance and your password.</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold tracking-tight">Order alerts</h2>
        <p className="text-sm text-slate-500 -mt-1">
          Turn these on for every phone or tablet you take orders on. New orders ring until someone taps them.
        </p>
        <AlertSettings ringLabel="new orders" />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold tracking-tight">Appearance</h2>
        <ThemeSwitcher className="max-w-sm" />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold tracking-tight">Security</h2>
        <Link
          href="/auth/forgot-password?portal=merchant"
          className="flex items-center gap-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 p-3.5 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <span className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-[#087F5B] flex items-center justify-center shrink-0">
            <KeyRound className="w-4 h-4" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold">Change password</span>
            <span className="block text-xs text-slate-500">We&apos;ll email you a code to set a new one.</span>
          </span>
        </Link>
      </section>
    </div>
  );
}
