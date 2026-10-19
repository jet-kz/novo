"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { apiService } from "@/services/api";
import { usePlatform } from "@/store/PlatformContext";
import { AppNotification } from "@/types";

const POLL_MS = 30000;

const timeAgo = (iso: string) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  return hours < 24 ? `${hours}h ago` : new Date(iso).toLocaleDateString();
};

/** Header bell: the signed-in user's alerts (order updates, messages, payouts). */
export function NotificationBell() {
  const { isAuthenticated } = usePlatform();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await apiService.getMyNotifications();
      setItems(res.items);
      setUnread(res.unread);
    } catch {}
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    load();
    const t = setInterval(() => document.visibilityState === "visible" && load(), POLL_MS);
    return () => clearInterval(t);
  }, [isAuthenticated, load]);

  if (!isAuthenticated) return null;

  const markAllRead = async () => {
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    apiService.markAllNotificationsRead().catch(() => {});
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-80 sm:w-96 max-h-[70vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl z-50 p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between pb-2">
              <h4 className="font-black text-sm text-slate-900 dark:text-slate-100">Notifications</h4>
              {unread > 0 && (
                <button type="button" onClick={markAllRead} className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 cursor-pointer">
                  <Check className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>
            {items.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No notifications yet. Order updates will show up here.</p>
            ) : (
              <ul className="flex flex-col ">
                {items.map((n) => (
                  <li key={n.id} className="py-2.5 flex gap-2.5">
                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.read_at ? "bg-transparent" : "bg-emerald-500"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{n.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{n.body}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(n.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
