"use client";

import React from "react";
import { HeroUIProvider } from "@heroui/system";

export function HeroUIProviderWrapper({ children }: { children: React.ReactNode }) {
  return <HeroUIProvider>{children}</HeroUIProvider>;
}
