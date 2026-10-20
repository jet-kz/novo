"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Loader2, MessageSquare, ShieldCheck } from "lucide-react";
import { apiService } from "@/services/api";
import { AlertSettings } from "@/components/notifications/AlertSettings";
import { AppNotification } from "@/types";

const timeAgo = (iso: string) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
};

/** Messages from the Novo team (approvals, announcements, direct notes). */
export default function RiderMessagesPage() {
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiService
      .getMyNotifications()
      .then((res) => {
        setItems(res.items);
        if (res.unread > 0) apiService.markAllNotificationsRead().catch(() => {});
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 w-full flex flex-col gap-6">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Messages</h1>
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-slate-500">Job alerts</h2>
        <AlertSettings ringLabel="new jobs" />
      </section>
      {error && <p className="text-sm text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-2xl px-4 py-3">{error}</p>}
      {!items && !error && <Loader2 className="w-6 h-6 animate-spin text-[#087F5B] mx-auto mt-10" />}
      {items && items.length === 0 && (
        <div className="py-12 text-center">
          <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm text-slate-500 mt-2">No messages yet. Updates from the Novo team will show up here.</p>
        </div>
      )}
      <ul className="flex flex-col gap-2">
        {items?.map((m) => (
          <li key={m.id} className={`rounded-3xl p-4 ${m.read_at ? "bg-slate-50 dark:bg-slate-900/60" : "bg-emerald-50 dark:bg-emerald-950/30"}`}>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-[#087F5B] shrink-0">
                {m.kind === "approval" ? <ShieldCheck className="w-5 h-5" /> : m.read_at ? <CheckCircle2 className="w-5 h-5 text-slate-400" /> : <MessageSquare className="w-5 h-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-[15px] font-semibold">{m.title}</h2>
                  <span className="text-xs text-slate-400 shrink-0">{timeAgo(m.created_at)}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-line leading-relaxed">{m.body}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
