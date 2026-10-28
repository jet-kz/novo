"use client";

import type { Store } from "@/types";

/** Share a store as /s/<slug>, which shows the shop's name and banner in link previews. */
export async function shareStore(store: Pick<Store, "name" | "slug" | "id">): Promise<"shared" | "copied" | "failed"> {
  const url = `${window.location.origin}/s/${encodeURIComponent(store.slug || store.id)}`;
  const text = `Order from ${store.name} on Novo`;
  try {
    if (navigator.share) {
      await navigator.share({ title: store.name, text, url });
      return "shared";
    }
  } catch (e: any) {
    if (e?.name === "AbortError") return "failed";
  }
  try {
    await navigator.clipboard.writeText(`${text}: ${url}`);
    return "copied";
  } catch {
    return "failed";
  }
}
