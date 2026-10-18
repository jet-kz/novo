"use client";

import { useEffect, useState } from "react";
import { apiService } from "@/services/api";

let cached: string[] | null = null;

/** The signed-in user's roles from /auth/me (cached for the session). */
export function useMyRoles() {
  const [roles, setRoles] = useState<string[]>(cached || []);
  useEffect(() => {
    if (cached) return;
    apiService
      .getMe()
      .then((me) => {
        cached = Array.isArray(me?.roles) ? me.roles : [];
        setRoles(cached!);
      })
      .catch(() => {});
  }, []);
  return { roles, isSuperAdmin: roles.includes("super_admin") };
}
