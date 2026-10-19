"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ArrowRight } from "lucide-react";
import { apiService } from "@/services/api";
import type { PromoBanner } from "@/types";

const CACHE_KEY = "novo_banners_v1";

// Shown until an admin uploads banners (or if they can't be loaded).
const FALLBACK: PromoBanner = {
  id: "novo-default",
  title: "Good food, delivered fast",
  subtitle: "Meals, groceries & essentials across Warri, Asaba & Sapele.",
  image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=75",
  cta_label: "Order now",
  link_url: "/shop",
  placement: "home",
  show_text: true,
  display_order: 0,
  is_active: true,
};

function readCache(placement: string): PromoBanner[] | null {
  try {
    const raw = sessionStorage.getItem(`${CACHE_KEY}:${placement}`);
    return raw ? (JSON.parse(raw) as PromoBanner[]) : null;
  } catch {
    return null;
  }
}

/** Admin-managed promo banners, auto-rotating. Swipe on phones, arrows-free and dot-paged. */
export function PromoCarousel({
  placement = "home",
  variant = "compact",
  fallback = true,
}: {
  placement?: "home" | "shop";
  variant?: "compact" | "hero";
  /** Show the default Novo banner when none are live. Off = render nothing. */
  fallback?: boolean;
}) {
  const [banners, setBanners] = useState<PromoBanner[] | null>(null);

  useEffect(() => {
    const cached = readCache(placement);
    if (cached) setBanners(cached);
    apiService
      .getBanners(placement)
      .then((rows) => {
        setBanners(rows);
        try {
          sessionStorage.setItem(`${CACHE_KEY}:${placement}`, JSON.stringify(rows));
        } catch {}
      })
      .catch(() => setBanners((prev) => prev ?? []));
  }, [placement]);

  const slides = banners === null ? null : banners.length ? banners : fallback ? [FALLBACK] : [];
  const multi = (slides?.length || 0) > 1;

  const [emblaRef, embla] = useEmblaCarousel(
    { loop: multi, align: "center", containScroll: false, active: multi },
    multi ? [Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })] : []
  );
  const [selected, setSelected] = useState(0);
  const onSelect = useCallback(() => embla && setSelected(embla.selectedScrollSnap()), [embla]);
  useEffect(() => {
    if (!embla) return;
    onSelect();
    embla.on("select", onSelect).on("reInit", onSelect);
    return () => {
      embla.off("select", onSelect).off("reInit", onSelect);
    };
  }, [embla, onSelect]);

  const ratio = variant === "hero" ? "aspect-[2/1] md:aspect-[3/1] xl:aspect-[16/5]" : "aspect-[2/1] sm:aspect-[5/2]";

  if (slides === null) {
    return fallback ? <div className={`w-full ${ratio} rounded-[28px] bg-slate-100 dark:bg-slate-800 animate-pulse`} /> : null;
  }
  if (slides.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5" aria-roledescription="carousel" aria-label="Offers">
      <div className="overflow-hidden rounded-[28px]" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {slides.map((b, i) => (
            <div key={b.id} className="min-w-0 shrink-0 grow-0 basis-full" aria-roledescription="slide" aria-label={`${i + 1} of ${slides.length}`}>
              <Slide banner={b} ratio={ratio} eager={i === 0} />
            </div>
          ))}
        </div>
      </div>
      {multi && (
        <div className="flex items-center justify-center gap-1.5">
          {slides.map((b, i) => (
            <button
              key={b.id}
              type="button"
              aria-label={`Show offer ${i + 1}`}
              onClick={() => embla?.scrollTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                i === selected ? "w-6 bg-[#087F5B]" : "w-1.5 bg-slate-300 dark:bg-slate-700"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Slide({ banner, ratio, eager }: { banner: PromoBanner; ratio: string; eager: boolean }) {
  const inner = (
    <div className={`relative w-full ${ratio} bg-slate-900 overflow-hidden`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={banner.image}
        alt={banner.show_text ? "" : banner.title || "Offer"}
        loading={eager ? "eager" : "lazy"}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      {banner.show_text && (banner.title || banner.subtitle || banner.cta_label) && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/45 to-transparent" />
          <div className="relative h-full flex flex-col justify-center gap-1.5 p-5 sm:p-7 max-w-[70%] sm:max-w-[55%]">
            {banner.title && <h3 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-white leading-tight tracking-tight">{banner.title}</h3>}
            {banner.subtitle && <p className="text-xs sm:text-sm text-white/85 leading-snug line-clamp-2">{banner.subtitle}</p>}
            {banner.cta_label && banner.link_url && (
              <span className="mt-2 inline-flex w-fit items-center gap-1.5 h-9 px-4 rounded-full bg-white text-slate-900 text-xs sm:text-sm font-bold shadow-sm">
                {banner.cta_label} <ArrowRight className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );

  if (!banner.link_url) return inner;
  if (banner.link_url.startsWith("/")) {
    return (
      <Link href={banner.link_url} draggable={false} className="block">
        {inner}
      </Link>
    );
  }
  return (
    <a href={banner.link_url} target="_blank" rel="noopener noreferrer" draggable={false} className="block">
      {inner}
    </a>
  );
}
