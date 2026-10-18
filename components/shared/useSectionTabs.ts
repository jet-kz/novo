"use client";

import { useEffect, useState } from "react";
import { apiService } from "@/services/api";
import { Product } from "@/types";

export const OTHER_SECTION = "Other";

/**
 * Tab labels for a store page: "All", then the merchant's menu sections in their chosen order,
 * then "Other" for items without a section. Only sections that have items are shown.
 */
export function useSectionTabs(storeId: string | undefined, storeProducts: Product[]): string[] {
  const [order, setOrder] = useState<string[]>([]);

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    apiService
      .getMenuSections(storeId)
      .then((sections) => !cancelled && setOrder(sections.map((s) => s.name)))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const present = new Set(storeProducts.map((p) => sectionOf(p)));
  const ordered = order.filter((name) => present.has(name));
  const extra = [...present].filter((name) => !ordered.includes(name) && name !== OTHER_SECTION).sort();
  return ["All", ...ordered, ...extra, ...(present.has(OTHER_SECTION) ? [OTHER_SECTION] : [])];
}

/** The section a product is listed under. */
export const sectionOf = (p: Product) => (p.category && p.category.trim()) || OTHER_SECTION;
