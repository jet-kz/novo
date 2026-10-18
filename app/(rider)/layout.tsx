import React from "react";
import { RiderNavbar } from "@/components/rider/RiderNavbar";
import { RiderAuthGate } from "@/components/rider/RiderAuthGate";

export default function RiderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <RiderAuthGate>
        <RiderNavbar />
        <main className="flex-1 w-full pb-20">{children}</main>
      </RiderAuthGate>
    </div>
  );
}
