"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { usePlatform } from "@/store/PlatformContext";

const PUBLIC = new Set(["/rider/login", "/rider/register"]);

/**
  * Rider pages need a signed-in rider. The route proxy already redirects when there's no token;
    * this also catches an expired session or a non-rider account.
      */
export function RiderAuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { authReady, isAuthenticated, currentRole } = usePlatform();
  const isPublic = PUBLIC.has(pathname);
  // Fall back to the role saved at sign-in if /auth/me could not be reached (e.g. flaky network).
  const savedRole = typeof window !== "undefined" ? localStorage.getItem("novo_role") : null;
  const role = currentRole === "customer" && savedRole ? savedRole : currentRole;
  const allowed = isAuthenticated && (role === "rider" || role === "admin");

  useEffect(() => {
    if (isPublic || !authReady || allowed) return;
    router.replace(`/rider/login?next=${encodeURIComponent(pathname)}`);
  }, [isPublic, authReady, allowed, pathname, router]);

  if (isPublic || allowed) return <>{children}</>;
  return (
    <div className="flex-1 flex items-center justify-center py-24">
      <Loader2 className="w-7 h-7 animate-spin text-[#087F5B]" />
    </div>
  );
}
