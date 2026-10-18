"use client";

import React, { useState } from "react";
import { Settings, Shield, Bell, Lock, Check } from "lucide-react";

export default function MerchantSettingsPage() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [orderSound, setOrderSound] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Account Settings</h1>
        <p className="text-xs text-[#66736E] font-medium mt-1">Manage notification sounds, email alerts and account security</p>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-100 text-[#087F5B] text-xs font-black flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Preferences updated successfully!</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm flex flex-col gap-6">
        <h3 className="text-base font-black text-slate-900 dark:text-white">Notification Preferences</h3>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-black text-slate-900 dark:text-white block">Order Alert Chime</span>
            <span className="text-[11px] text-slate-400">Play sound notification when a new customer order arrives</span>
          </div>
          <input
            type="checkbox"
            checked={orderSound}
            onChange={(e) => setOrderSound(e.target.checked)}
            className="w-5 h-5 accent-[#087F5B]"
          />
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
          <div>
            <span className="text-xs font-black text-slate-900 dark:text-white block">Email Receipts & Summaries</span>
            <span className="text-[11px] text-slate-400">Receive daily order summaries and payout receipts</span>
          </div>
          <input
            type="checkbox"
            checked={emailNotifs}
            onChange={(e) => setEmailNotifs(e.target.checked)}
            className="w-5 h-5 accent-[#087F5B]"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-fit px-8 py-3 rounded-2xl bg-[#087F5B] text-white text-xs font-black hover:bg-[#065A43] transition-all cursor-pointer shadow-md shadow-[#087F5B]/20 mt-2"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
}
