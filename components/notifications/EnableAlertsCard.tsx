"use client";

import React, { useEffect, useState } from "react";
import { BellRing, Loader2, Share, X } from "lucide-react";
import { enablePush, GuestFollow, pushState, PushState } from "@/utils/push";

interface Props {
  /** Remembered per place so dismissing on one screen doesn't hide it everywhere. */
  storageKey: string;
  title: string;
  body: string;
  guest?: GuestFollow;
  tone?: "light" | "dark";
}

/** Asks for notification permission at a moment it's obviously useful (never on first load). */
export function EnableAlertsCard({ storageKey, title, body, guest, tone = "light" }: Props) {
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setState(pushState());
    try {
      setHidden(localStorage.getItem(`novo_alerts_dismissed_${storageKey}`) === "1");
    } catch {
      setHidden(false);
    }
  }, [storageKey]);

  // Already allowed: make sure this order/user is linked, silently.
  useEffect(() => {
    if (state === "granted") enablePush(guest).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, guest?.orderId]);

  if (hidden || !state || state === "granted" || state === "unsupported") return null;

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(`novo_alerts_dismissed_${storageKey}`, "1");
    } catch {}
  };

  const turnOn = async () => {
    setBusy(true);
    setError(null);
    try {
      setState(await enablePush(guest));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const dark = tone === "dark";
  return (
    <div className={`relative rounded-2xl p-4 flex items-start gap-3 ${dark ? "bg-slate-900 text-white" : "bg-emerald-50 dark:bg-emerald-950/40 text-slate-900 dark:text-white"}`}>
      <BellRing className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1 pr-5">
        <p className="text-sm font-bold">{title}</p>
        {state === "ios-needs-install" ? (
          <p className={`text-xs mt-1 leading-relaxed ${dark ? "text-slate-300" : "text-slate-600 dark:text-slate-300"}`}>
            On iPhone, tap <Share className="inline w-3.5 h-3.5 -mt-0.5" /> <strong>Share</strong> → <strong>Add to Home Screen</strong>, open Novo
            from your Home Screen, then turn on alerts here.
          </p>
        ) : state === "denied" ? (
          <p className={`text-xs mt-1 ${dark ? "text-slate-300" : "text-slate-600 dark:text-slate-300"}`}>
            Notifications are blocked for this site. Allow them in your browser&apos;s site settings to get alerts.
          </p>
        ) : (
          <>
            <p className={`text-xs mt-1 ${dark ? "text-slate-300" : "text-slate-600 dark:text-slate-300"}`}>{body}</p>
            <button
              onClick={turnOn}
              disabled={busy}
              className="mt-3 px-4 py-2 rounded-xl bg-[#087F5B] text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
            >
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Turn on alerts
            </button>
          </>
        )}
        {error && <p className="text-xs text-rose-500 mt-2">{error}</p>}
      </div>
      <button onClick={dismiss} aria-label="Dismiss" className={`absolute top-2.5 right-2.5 p-1 cursor-pointer ${dark ? "text-slate-500" : "text-slate-400"}`}>
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
