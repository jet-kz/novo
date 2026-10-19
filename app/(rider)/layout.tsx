import React from "react";
import { RiderNavbar } from "@/components/rider/RiderNavbar";
import { RiderAuthGate } from "@/components/rider/RiderAuthGate";

export default function RiderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <RiderAuthGate>
        <RiderNavbar />
        <main className="flex-1 w-full pb-24 md:pb-10">{children}</main>
      </RiderAuthGate>
    </div>
  );
}
