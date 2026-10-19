"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { NovoLogo } from "@/components/shared/NovoLogo";

const PHOTO = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=75";

/** Calm two-panel frame for sign-in screens: photo on large screens, just the form on phones. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] w-full flex bg-white dark:bg-slate-950">
      <aside className="hidden lg:flex relative w-[46%] max-w-[640px] m-3 rounded-[32px] overflow-hidden bg-slate-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={PHOTO} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
        <div className="relative mt-auto p-10 text-white">
          <p className="text-3xl font-extrabold leading-tight tracking-tight max-w-sm">Food and everyday things, brought to your door.</p>
          <p className="mt-2 text-sm text-white/75">Warri · Asaba · Sapele</p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col items-center justify-center px-5 py-10 pt-[max(2.5rem,env(safe-area-inset-top))]">
        <div className="w-full max-w-[380px] flex flex-col gap-7">
          <div className="flex flex-col gap-5">
            <NovoLogo size="sm" href="/" />
            <div>
              <h1 className="text-[26px] font-bold tracking-tight text-slate-900 dark:text-white leading-tight">{title}</h1>
              {subtitle && <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string };

/** Filled input with a quiet label; password fields get a show/hide toggle. */
export function AuthField({ label, type = "text", className = "", ...props }: FieldProps) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-slate-600 dark:text-slate-300">{label}</span>
      <span className="relative">
        <input
          {...props}
          type={isPassword && show ? "text" : type}
          className={`w-full h-12 px-4 ${isPassword ? "pr-12" : ""} rounded-2xl bg-slate-100 dark:bg-slate-900 text-[15px] text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#087F5B]/35 transition-all ${className}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            {show ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
          </button>
        )}
      </span>
    </label>
  );
}

export function AuthButton({ busy, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean }) {
  return (
    <button
      {...props}
      disabled={busy || props.disabled}
      className="w-full h-12 rounded-2xl bg-[#087F5B] hover:bg-[#066A4C] text-white text-[15px] font-semibold flex items-center justify-center gap-2 transition-colors active:scale-[0.99] disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
    >
      {busy && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

export function AuthNotice({ tone, children }: { tone: "error" | "ok"; children: React.ReactNode }) {
  const error = tone === "error";
  return (
    <div
      role={error ? "alert" : "status"}
      className={`px-4 py-3 rounded-2xl text-sm flex items-start gap-2.5 ${
        error ? "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300" : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
      }`}
    >
      {error ? <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />}
      <span>{children}</span>
    </div>
  );
}
