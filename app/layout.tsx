import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { PlatformProvider } from "@/store/PlatformContext";
import ResponsiveLayout from "@/components/shared/ResponsiveLayout";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Novo | On-Demand Delivery Express",
  description: "Order food, groceries, pharmacy & express courier delivery fast and reliably across nationwide locations.",
  icons: {
    icon: "/novo-logo/01_Motion_N/01-motion-n_green.svg",
    shortcut: "/novo-logo/01_Motion_N/01-motion-n_green.svg",
    apple: "/novo-logo/01_Motion_N/01-motion-n_green.png",
  },
};

import { HeroUIProviderWrapper } from "@/components/providers/HeroUIProviderWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={sora.variable}>
      <body className={`${sora.className} antialiased bg-slate-50 dark:bg-slate-950`}>
        <HeroUIProviderWrapper>
          <PlatformProvider>
            <ResponsiveLayout>{children}</ResponsiveLayout>
          </PlatformProvider>
        </HeroUIProviderWrapper>
      </body>
    </html>
  );
}
