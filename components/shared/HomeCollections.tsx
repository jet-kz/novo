"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Store } from "@/types";
import { useCatalog } from "@/components/shared/useCatalog";
import { getUniqueStoreBanner } from "@/utils/storeImageUtils";

const PER_ROW = 8;

/**
 * Admin-curated homepage strips ("Popular near you", "Groceries & household", ...).
 * Each shows open stores from its target category; empty strips are hidden.
 */
export function HomeCollections({ stores }: { stores: Store[] }) {
  const { collections } = useCatalog();
  const rows = collections
    .map((c) => {
      const matching = stores.filter((s) => c.target_category === "all" || s.category === c.target_category);
      // Open stores first, then the rest.
      const sorted = [...matching].sort((a, b) => Number(b.isOpening !== false) - Number(a.isOpening !== false));
      return { collection: c, stores: sorted.slice(0, PER_ROW) };
    })
    .filter((row) => row.stores.length > 0);

  if (rows.length === 0) return null;

  return (
    <div className="flex flex-col gap-8">
      {rows.map(({ collection, stores: rowStores }) => (
        <section key={collection.id} className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base md:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                {collection.title}
                {collection.badge && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-[10px] font-bold text-[#087F5B] dark:text-emerald-300">
                    {collection.badge}
                  </span>
                )}
              </h2>
              {collection.subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{collection.subtitle}</p>}
            </div>
            <Link
              href={collection.target_category === "all" ? "/shop" : `/shop?category=${collection.target_category}`}
              className="shrink-0 text-xs font-bold text-[#087F5B] dark:text-emerald-400 flex items-center gap-1"
            >
              See all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0 snap-x">
            {rowStores.map((store) => (
              <Link
                key={store.id}
                href={`/shop?store=${store.id}`}
                className="snap-start shrink-0 w-[68%] sm:w-56 rounded-2xl overflow-hidden bg-white dark:bg-slate-900"
              >
                <div className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getUniqueStoreBanner(store)} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                  {store.isOpening === false && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold">Closed</span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{store.name}</p>
                  <p className="text-xs text-slate-500 truncate">{store.address || store.city || ""}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
