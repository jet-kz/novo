import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { PlatformProvider } from "@/store/PlatformContext";
import ResponsiveLayout from "@/components/shared/ResponsiveLayout";
import { ProductSheetHost } from "@/components/product/ProductSheetHost";
import { LiveAlerts } from "@/components/notifications/LiveAlerts";

// Variable font (200–800): one file covers every weight.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.novong.com"),
  title: "Novo | On-Demand Delivery Express",
  description: "Order food, groceries, pharmacy & express courier delivery fast and reliably across nationwide locations.",
  // Icons come from app/favicon.ico, app/icon.png and app/apple-icon.png (the Novo N).
  // Home-screen launches on iPhone open without Safari's bars.
  appleWebApp: { capable: true, title: "Novo", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Draw under the notch / home indicator; layouts pad with env(safe-area-inset-*).
  viewportFit: "cover",
  // Browser bar colour is set from the app theme (not the OS) by THEME_SCRIPT and PlatformContext.
};

import { HeroUIProviderWrapper } from "@/components/providers/HeroUIProviderWrapper";

const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("novo_theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}var d=document.documentElement,c=t==="dark"?"#000000":"#ffffff";if(t==="dark")d.classList.add("dark");d.style.backgroundColor=t==="dark"?"#000000":"";var m=document.createElement("meta");m.name="theme-color";m.content=c;document.head.appendChild(m)}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jakarta.variable} suppressHydrationWarning>
      <head>
        {/* THEME_SCRIPT also adds the browser/status-bar colour tag (black in dark mode). */}
        {/* Apply the theme before first paint so dark mode never flashes white. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className={`${jakarta.className} antialiased bg-slate-50 dark:bg-black`}>
        <HeroUIProviderWrapper>
          <PlatformProvider>
            <ResponsiveLayout>{children}</ResponsiveLayout>
            <ProductSheetHost />
            <LiveAlerts />
          </PlatformProvider>
        </HeroUIProviderWrapper>
      </body>
    </html>
  );
}
