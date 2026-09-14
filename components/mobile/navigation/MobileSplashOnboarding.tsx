"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Bike, ShoppingBag, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { NovoLogo } from "@/components/shared/NovoLogo";

export function MobileSplashOnboarding() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    // Check if onboarding was completed in localStorage
    if (typeof window !== "undefined") {
      const completed = localStorage.getItem("novo_mobile_onboarding_done");
      if (completed === "true") {
        setShowSplash(false);
        setShowOnboarding(false);
        return;
      }
    }

    // Auto-dismiss splash screen after 2.5s to show Onboarding
    const timer = setTimeout(() => {
      setShowSplash(false);
      setShowOnboarding(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const slides = [
    {
      title: "Everything You Need, In One Place",
      subtitle: "Fresh food, quality products, trusted merchants — delivered right to your door.",
      tagline: "Food • Groceries • Pharmacy • More",
      image: "https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=800&q=80",
      badgeIcon: Bike,
    },
    {
      title: "Order From Your Favorite Stores",
      subtitle: "Browse local restaurants, supermarkets, and pharmacies near you with fast dispatch.",
      tagline: "Your City. Your Choice.",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
      badgeIcon: ShoppingBag,
    },
    {
      title: "Fast & Secure Delivery To Your Door",
      subtitle: "Track your rider in real time and enjoy 100% verified merchant quality.",
      tagline: "Live GPS Tracking",
      image: "https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?auto=format&fit=crop&w=800&q=80",
      badgeIcon: ShieldCheck,
    },
  ];

  const handleFinish = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("novo_mobile_onboarding_done", "true");
    }
    setShowOnboarding(false);
  };

  // 1. SPLASH SCREEN VIEW (Reference Screen 1)
  if (showSplash) {
    return (
      <div className="md:hidden fixed inset-0 z-50 bg-[#008A4C] text-white flex flex-col items-center justify-between p-8 text-center animate-in fade-in duration-500">
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          {/* Animated Brand Logo Icon */}
          <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl animate-pulse">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg">
              <span className="text-[#008A4C] font-black text-3xl tracking-tighter">novo</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <h1 className="text-4xl font-black tracking-tight text-white">novo</h1>
            <p className="text-xs font-bold text-emerald-100 uppercase tracking-widest">
              Food • Groceries • Pharmacy • More
            </p>
          </div>

          <div className="max-w-xs mt-4">
            <h2 className="text-xl font-bold text-white leading-tight">
              Everything You Need, In One Place
            </h2>
            <p className="text-xs text-emerald-100/90 mt-2 leading-relaxed">
              Fresh food, quality products, trusted merchants — delivered to your door.
            </p>
          </div>
        </div>

        {/* Footer Loader */}
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-100/80">
          <div className="w-2 h-2 rounded-full bg-white animate-bounce" />
          <div className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:0.2s]" />
          <div className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:0.4s]" />
        </div>
      </div>
    );
  }

  // 2. ONBOARDING SLIDES VIEW (Reference Screen 2)
  if (showOnboarding) {
    const current = slides[slideIndex];
    const BadgeIcon = current.badgeIcon;

    return (
      <div className="md:hidden fixed inset-0 z-50 bg-[#F7FAF8] dark:bg-slate-950 text-[#101714] dark:text-white flex flex-col justify-between p-6 animate-in slide-in-from-right duration-300">
        {/* Top Header Actions */}
        <div className="flex items-center justify-between pt-2">
          <NovoLogo subtitle="Delivery Express" size="sm" />
          <button
            onClick={handleFinish}
            className="text-xs font-extrabold text-[#66736D] dark:text-slate-400 hover:text-[#008A4C] px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-[#E3EAE6] dark:border-slate-800 shadow-xs cursor-pointer"
          >
            Skip
          </button>
        </div>

        {/* Main Hero Card */}
        <div className="flex-1 flex flex-col items-center justify-center my-6 gap-6">
          <div className="relative w-full max-w-sm h-64 sm:h-72 rounded-3xl overflow-hidden shadow-xl bg-white border border-[#E3EAE6]">
            <img
              src={current.image}
              alt={current.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-[#008A4C]/90 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1.5">
              <BadgeIcon className="w-3.5 h-3.5" />
              <span>{current.tagline}</span>
            </div>
          </div>

          <div className="text-center max-w-xs flex flex-col items-center gap-2">
            <h2 className="text-2xl font-black text-[#101714] dark:text-white tracking-tight leading-tight">
              {current.title}
            </h2>
            <p className="text-xs text-[#66736D] dark:text-slate-400 leading-relaxed font-medium">
              {current.subtitle}
            </p>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center gap-2 mt-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlideIndex(i)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  slideIndex === i ? "w-7 bg-[#008A4C]" : "w-2 bg-[#E3EAE6] dark:bg-slate-800"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Bottom CTA Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-sm mx-auto pb-4">
          {slideIndex < slides.length - 1 ? (
            <button
              onClick={() => setSlideIndex((prev) => prev + 1)}
              className="w-full py-3.5 rounded-2xl bg-[#008A4C] hover:bg-[#006B3C] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="w-full py-3.5 rounded-2xl bg-[#008A4C] hover:bg-[#006B3C] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center justify-center gap-1 text-xs font-semibold text-[#66736D]">
            <span>Already have an account?</span>
            <Link href="/auth" onClick={handleFinish} className="text-[#008A4C] font-extrabold hover:underline">
              Log In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
