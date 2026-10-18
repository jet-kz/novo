"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Loader2, MessageSquare, ShieldCheck } from "lucide-react";
import { apiService } from "@/services/api";
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
    <div className="max-w-2xl mx-auto px-4 py-6 w-full flex flex-col gap-4">
      <h1 className="text-xl font-black text-white">Messages</h1>
      {error && <p className="text-sm text-rose-300 bg-rose-950/60 rounded-xl p-3">{error}</p>}
      {!items && !error && <Loader2 className="w-6 h-6 animate-spin text-emerald-400 mx-auto mt-10" />}
      {items && items.length === 0 && (
        <div className="rounded-2xl bg-slate-900 p-8 text-center">
          <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-400 mt-2">No messages yet. Updates from the Novo team will show up here.</p>
        </div>
      )}
      <ul className="flex flex-col gap-3">
        {items?.map((m) => (
          <li key={m.id} className={`rounded-2xl p-4 ${m.read_at ? "bg-slate-900" : "bg-slate-900 ring-1 ring-emerald-500/40"}`}>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-emerald-400 shrink-0">
                {m.kind === "approval" ? <ShieldCheck className="w-5 h-5" /> : m.read_at ? <CheckCircle2 className="w-5 h-5 text-slate-600" /> : <MessageSquare className="w-5 h-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-sm font-bold text-white">{m.title}</h2>
                  <span className="text-[11px] text-slate-500 shrink-0">{timeAgo(m.created_at)}</span>
                </div>
                <p className="text-sm text-slate-300 mt-1 whitespace-pre-line leading-relaxed">{m.body}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
