"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import foodSpread from "@/public/hero1.png";

const SEEN_KEY = "novo_mobile_onboarding_done";

/**
  * One-time welcome for first visits on mobile. Renders nothing until we know the visitor
    * hasn't seen it, so returning visitors never get a flash of it.
      */
export function MobileSplashOnboarding() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(SEEN_KEY) !== "true") setOpen(true);
    } catch {
      // Storage blocked (private mode): skip the welcome rather than show it every time.
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const close = () => {
    try {
      localStorage.setItem(SEEN_KEY, "true");
    } catch {}
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      className="md:hidden fixed inset-0 z-[60] flex flex-col bg-white dark:bg-slate-950 animate-in fade-in duration-500"
    >
      <div className="relative flex-1 min-h-0">
        <Image
          src={foodSpread}
          alt="A table of dishes from local restaurants"
          fill
          sizes="100vw"
          placeholder="blur"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
        <Image
          src="/novo-logo/01_Motion_N/01-motion-n_white.svg"
          alt="Novo"
          width={40}
          height={40}
          className="absolute top-[max(env(safe-area-inset-top),20px)] left-5 drop-shadow"
        />
      </div>

      <div className="relative -mt-6 rounded-t-[28px] bg-white dark:bg-slate-950 px-6 pt-7 pb-[max(env(safe-area-inset-bottom),24px)] animate-in slide-in-from-bottom-6 duration-500">
        <h1 id="welcome-title" className="text-[26px] leading-[1.15] font-black tracking-tight text-slate-900 dark:text-white">
          Food and everyday things, brought to your door.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Order from restaurants, supermarkets and pharmacies near you in Warri, Asaba and Sapele.
        </p>

        <button
          type="button"
          onClick={close}
          className="mt-7 w-full py-4 rounded-2xl bg-[#087F5B] active:bg-[#066a4c] text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
        >
          Start ordering
          <ArrowRight className="w-4 h-4" />
        </button>
        <Link
          href="/auth"
          onClick={close}
          className="mt-3 block w-full py-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300"
        >
          I already have an account
        </Link>

        <p className="mt-4 text-center text-xs text-slate-400">
          Run a shop?{" "}
          <Link href="/merchant/register" onClick={close} className="font-semibold text-[#087F5B] dark:text-emerald-400">
            Sell on Novo
          </Link>
          {" · "}
          Have a bike?{" "}
          <Link href="/rider/register" onClick={close} className="font-semibold text-[#087F5B] dark:text-emerald-400">
            Ride with us
          </Link>
        </p>
      </div>
    </div>
  );
}
