"use client";

import React, { Suspense } from "react";
import { MobileNotificationsView } from "@/components/mobile/notifications/MobileNotificationsView";

function DesktopNotificationsContent() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col gap-6">
      <h1 className="text-3xl font-black text-slate-900 dark:text-white">Notifications</h1>
      <p className="text-sm text-slate-500">View real-time updates on your active orders and promotions.</p>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <>
      <MobileNotificationsView />
      <div className="hidden md:block">
        <Suspense fallback={<div className="p-12 text-center">Loading Notifications...</div>}>
          <DesktopNotificationsContent />
        </Suspense>
      </div>
    </>
  );
}
