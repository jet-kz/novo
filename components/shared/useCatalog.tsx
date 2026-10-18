"use client";

import React, { useEffect, useState } from "react";
import {
  Coffee,
  Cookie,
  DeviceMobile,
  ForkKnife,
  Pill,
  ShoppingCartSimple,
  Sparkle,
  SquaresFour,
  Storefront,
} from "@phosphor-icons/react";
import { apiService } from "@/services/api";
import { HomeCollection, PlatformCategory } from "@/types";

// Shown until the API answers (or if it can't be reached). Mirrors the seeded categories.
const FALLBACK: PlatformCategory[] = [
  ["restaurant", "Food"],
  ["supermarket", "Groceries"],
  ["pharmacy", "Pharmacy"],
  ["drinks", "Drinks"],
  ["bakery", "Bakery"],
  ["beauty", "Beauty"],
  ["electronics", "Electronics"],
].map(([slug, name], i) => ({ id: slug, slug, name, display_order: i + 1, is_active: true }));

let cache: { categories: PlatformCategory[]; collections: HomeCollection[] } | null = null;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function load(force = false) {
  if (inflight && !force) return inflight;
  inflight = Promise.all([apiService.getPlatformCategories(), apiService.getHomeCollections()])
    .then(([categories, collections]) => {
      cache = { categories, collections };
      listeners.forEach((fn) => fn());
    })
    .catch(() => {})
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Call after an admin edits categories/collections so open pages pick it up. */
export const refreshCatalog = () => load(true);

/** Admin-managed homepage categories and featured collections (active only). */
export function useCatalog() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    listeners.add(fn);
    if (!cache) load();
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return {
    categories: cache?.categories ?? FALLBACK,
    collections: cache?.collections ?? [],
    loaded: !!cache,
  };
}

const ICONS: Record<string, React.ComponentType<any>> = {
  restaurant: ForkKnife,
  supermarket: ShoppingCartSimple,
  pharmacy: Pill,
  drinks: Coffee,
  bakery: Cookie,
  beauty: Sparkle,
  electronics: DeviceMobile,
  all: SquaresFour,
};

/** Built-in icon for known categories; otherwise the admin's emoji or image; otherwise a shop icon. */
export function CategoryIcon({ category, size = 28 }: { category: Pick<PlatformCategory, "slug" | "icon" | "name">; size?: number }) {
  const icon = category.icon?.trim();
  if (icon && /^https?:\/\//.test(icon)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={icon} alt="" width={size} height={size} className="object-contain" style={{ width: size, height: size }} />;
  }
  const Builtin = ICONS[category.slug];
  if (Builtin) return <Builtin size={size} weight="duotone" className="shrink-0" />;
  if (icon) return <span style={{ fontSize: size * 0.85, lineHeight: 1 }} aria-hidden>{icon}</span>;
  return <Storefront size={size} weight="duotone" className="shrink-0" />;
}
