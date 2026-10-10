import React from "react";
import { RiderNavbar } from "@/components/rider/RiderNavbar";

export default function RiderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <RiderNavbar />
      <main className="flex-1 w-full pb-20">{children}</main>
    </div>
  );
}
