"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Moon, Shield, Smartphone, ChevronRight } from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";
import { ThemeSwitcher } from "@/components/shared/ThemeToggle";
import { AlertSettings } from "@/components/notifications/AlertSettings";

export default function CustomerSettingsPage() {
  const router = useRouter();
  const [emailNotifs, setEmailNotifs] = useState(true);

  return (
    <div className="w-full min-h-screen bg-[#F7FAF8] dark:bg-slate-950 text-[#101714] dark:text-slate-100 pb-24 font-sans">
      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-[#E3EAE6] dark:border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-full bg-[#F7FAF8] dark:bg-slate-800 text-[#101714] dark:text-white cursor-pointer hover:bg-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-black text-[#101714] dark:text-white">App Settings</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-black text-slate-900 dark:text-white">Preferences & Experience</h2>
          <p className="text-xs text-[#66736D] dark:text-slate-400">Configure theme and notification channels.</p>
        </div>

        {/* FLAT BORDERLESS HERO UI LIST */}
        <div className="flex flex-col bg-white dark:bg-slate-900 border-[#E3EAE6] dark:border-slate-800">
          <div className="py-4 px-3 flex flex-col gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-full bg-[#E8F7EF] dark:bg-slate-800 text-[#008A4C] flex items-center justify-center shrink-0">
                <Moon className="w-4 h-4" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-black text-[#101714] dark:text-white">Appearance</span>
                <span className="text-xs text-[#66736D] dark:text-slate-400 font-medium">Follow your phone, or always light or dark</span>
              </div>
            </div>
            <ThemeSwitcher className="w-full sm:max-w-sm" />
          </div>

          <div className="py-4 px-3 flex flex-col gap-3">
            <span className="text-xs font-black text-[#101714] dark:text-white">Order alerts</span>
            <AlertSettings ringLabel="important updates" />
          </div>

          <div className="py-4 px-3 flex items-center justify-between border-[#E3EAE6]/70 dark:border-slate-800/70">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-full bg-[#E8F7EF] dark:bg-slate-800 text-[#008A4C] flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-black text-[#101714] dark:text-white">App Version</span>
                <span className="text-xs text-[#66736D] dark:text-slate-400 font-medium">Novo Marketplace v2.4.0 (Latest)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
