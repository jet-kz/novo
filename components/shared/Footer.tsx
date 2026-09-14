"use client";

import React from "react";
import Link from "next/link";
import { Globe, ChevronDown } from "lucide-react";

import { NovoLogo } from "@/components/shared/NovoLogo";

export function Footer() {
  return (
    <footer className="hidden md:block w-full bg-[#051d16] text-slate-300 relative overflow-hidden">
      {/* TOP SVG WAVE DIVIDER */}
      <div className="w-full overflow-hidden leading-none text-slate-50 dark:text-slate-950 pointer-events-none">
        <svg
          className="relative block w-full h-12 sm:h-20 lg:h-24"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,50 L1200,0 L0,0 Z"></path>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-8 pb-28 md:pb-20 flex flex-col gap-14 relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-10 border-b border-emerald-900/40">
          <NovoLogo variant="white" subtitle="Delivery Express" size="lg" />

          {/* Language Picker Pill */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/10 border border-white/15 text-xs font-extrabold text-white cursor-pointer hover:bg-white/20 transition-all">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>English</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        {/* 4 Main Footer Link Columns (Generously Spread Out) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 lg:gap-16">
          
          {/* Column 1: Let's do it together */}
          <div className="flex flex-col gap-5">
            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest">
              Let&apos;s do it together
            </h4>
            <ul className="flex flex-col gap-3 text-sm font-semibold text-slate-300">
              <li>
                <Link href="/auth" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/auth?role=rider" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  Couriers
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Links of interest */}
          <div className="flex flex-col gap-5">
            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest">
              Links of interest
            </h4>
            <ul className="flex flex-col gap-3 text-sm font-semibold text-slate-300">
              <li>
                <Link href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  About us
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  Contact us
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  Security
                </Link>
              </li>
              <li>
                <Link href="/auth" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  Log in
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Store links */}
          <div className="flex flex-col gap-5">
            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest">
              Store links
            </h4>
            <ul className="flex flex-col gap-3 text-sm font-semibold text-slate-300">
              <li>
                <Link href="/shop" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  Top Restaurants
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  Supermarkets &amp; Groceries
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  Pharmacy &amp; Meds
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  Express Suya &amp; Grills
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Policies */}
          <div className="flex flex-col gap-5">
            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest">
              Legal &amp; Compliance
            </h4>
            <ul className="flex flex-col gap-3 text-sm font-semibold text-slate-300">
              <li>
                <Link href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  Cookies Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  Compliance
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  Configure the cookies
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  Digital Services Act
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  European Accessibility Act
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* BOTTOM SVG WAVE DIVIDER */}
        <div className="w-full overflow-hidden leading-none text-[#093529] my-2 pointer-events-none">
          <svg
            className="relative block w-full h-8 sm:h-12"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path d="M0,0 C300,90 600,-40 900,45 C1050,90 1150,20 1200,60 L1200,120 L0,120 Z"></path>
          </svg>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-400">
          <p>© 2026 Novo Delivery Express. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-white transition-colors cursor-pointer">Nigeria</span>
            <span className="hover:text-white transition-colors cursor-pointer">Novo Delivery Platform</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
