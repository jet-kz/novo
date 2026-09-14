"use client";

import React, { Suspense } from "react";
import { MobileSupportView } from "@/components/mobile/support/MobileSupportView";

function DesktopSupportContent() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col gap-6">
      <h1 className="text-3xl font-black text-slate-900 dark:text-white">Help & Support</h1>
      <p className="text-sm text-slate-500">Contact our 24/7 Novo Customer Support team or browse FAQs.</p>
    </div>
  );
}

export default function SupportPage() {
  return (
    <>
      <MobileSupportView />
      <div className="hidden md:block">
        <Suspense fallback={<div className="p-12 text-center">Loading Support...</div>}>
          <DesktopSupportContent />
        </Suspense>
      </div>
    </>
  );
}
