"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/** Opens the shared store in the app (the server part of this page set the link preview). */
export function OpenStore({ slug, name }: { slug: string; name: string | null }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(name ? `/shop?store=${encodeURIComponent(slug)}` : "/shop");
  }, [router, slug, name]);
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-500">
      <Loader2 className="w-6 h-6 animate-spin text-[#087F5B]" />
      <p className="text-sm">{name ? `Opening ${name}…` : "That store isn't available. Opening all stores…"}</p>
    </div>
  );
}
