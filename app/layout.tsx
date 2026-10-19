import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { PlatformProvider } from "@/store/PlatformContext";
import ResponsiveLayout from "@/components/shared/ResponsiveLayout";
import { ProductSheetHost } from "@/components/product/ProductSheetHost";

// Variable font (200–800): one file covers every weight.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Novo | On-Demand Delivery Express",
  description: "Order food, groceries, pharmacy & express courier delivery fast and reliably across nationwide locations.",
  icons: {
    icon: "/novo-logo/01_Motion_N/01-motion-n_green.svg",
    shortcut: "/novo-logo/01_Motion_N/01-motion-n_green.svg",
    apple: "/novo-logo/01_Motion_N/01-motion-n_green.png",
  },
  // Home-screen launches on iPhone open without Safari's bars.
  appleWebApp: { capable: true, title: "Novo", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Draw under the notch / home indicator; layouts pad with env(safe-area-inset-*).
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

import { HeroUIProviderWrapper } from "@/components/providers/HeroUIProviderWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className={`${jakarta.className} antialiased bg-slate-50 dark:bg-slate-950`}>
        <HeroUIProviderWrapper>
          <PlatformProvider>
            <ResponsiveLayout>{children}</ResponsiveLayout>
            <ProductSheetHost />
          </PlatformProvider>
        </HeroUIProviderWrapper>
      </body>
    </html>
  );
}
