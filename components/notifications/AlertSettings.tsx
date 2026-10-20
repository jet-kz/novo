"use client";

import React, { useEffect, useState } from "react";
import { Bell, BellOff, Loader2, Smartphone, Volume2, VolumeX } from "lucide-react";
import { enablePush, pushState, type PushState } from "@/utils/push";
import { audioUnlocked, chime, onSoundChange, setSoundEnabled, soundEnabled, startRing, stopRing } from "@/utils/alertSound";

const PUSH_TEXT: Record<PushState, string> = {
  granted: "On. You'll get alerts on this device even when Novo is closed.",
  default: "Off on this device. Turn on to get alerts when Novo is closed.",
  denied: "Blocked in your browser settings. Allow notifications for this site, then come back.",
  unsupported: "This browser can't show notifications. Try Chrome, or add Novo to your home screen.",
  "ios-needs-install": "On iPhone: tap Share → Add to Home Screen, open Novo from there, then turn alerts on.",
};

/** Notifications + sound controls with a test button. Used on every role's settings screen. */
export function AlertSettings({ ringLabel = "new orders and jobs" }: { ringLabel?: string }) {
  const [push, setPush] = useState<PushState | null>(null);
  const [sound, setSound] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPush(pushState());
    setSound(soundEnabled());
    return onSoundChange(() => setSound(soundEnabled()));
  }, []);

  const turnOn = async () => {
    setBusy(true);
    setError(null);
    try {
      setPush(await enablePush());
    } catch (e: any) {
      setError(e?.message || "Couldn't turn on notifications.");
    } finally {
      setBusy(false);
    }
  };

  const test = () => {
    chime(true);
    setTimeout(() => {
      startRing("test", 3600, true);
      setTimeout(() => stopRing("test"), 3600);
    }, 900);
    if (push === "granted" && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((reg) =>
          reg.showNotification("Novo test alert", {
            body: "This is how alerts look on this device.",
            icon: "/novo-logo/01_Motion_N/01-motion-n_green.png",
            tag: "novo-test",
          })
        )
        .catch(() => {});
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Row
        icon={push === "granted" ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        title="Phone notifications"
        body={push ? PUSH_TEXT[push] : "Checking…"}
        action={
          push === "default" ? (
            <button onClick={turnOn} disabled={busy} className="h-9 px-4 rounded-full bg-[#087F5B] text-white text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shrink-0">
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Turn on
            </button>
          ) : push === "granted" ? (
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-[#087F5B] dark:bg-emerald-950/50 dark:text-emerald-300 text-[11px] font-semibold shrink-0">On</span>
          ) : push === "ios-needs-install" ? (
            <Smartphone className="w-5 h-5 text-slate-400 shrink-0" />
          ) : null
        }
      />
      <Row
        icon={sound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        title="Alert sound"
        body={sound ? `Rings for ${ringLabel}, chimes for updates, while Novo is open.` : "Muted. You'll still see alerts."}
        action={
          <button
            role="switch"
            aria-checked={sound}
            aria-label="Alert sound"
            onClick={() => setSoundEnabled(!sound)}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${sound ? "bg-[#087F5B]" : "bg-slate-300 dark:bg-slate-700"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${sound ? "left-[22px]" : "left-0.5"}`} />
          </button>
        }
      />
      {error && <p role="alert" className="text-sm text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-2xl px-4 py-3">{error}</p>}
      <button onClick={test} className="self-start h-10 px-4 rounded-full bg-slate-100 dark:bg-slate-800 text-[13px] font-semibold cursor-pointer">
        Test alert
      </button>
    </div>
  );
}

function Row({ icon, title, body, action }: { icon: React.ReactNode; title: string; body: string; action: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 p-3.5">
      <span className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-[#087F5B] flex items-center justify-center shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{body}</p>
      </div>
      {action}
    </div>
  );
}

/**
 * Browsers only play sound after the page has been tapped once. On screens that must ring
 * (merchant, rider), show a nudge until that happens.
 */
export function SoundUnlockHint({ label = "Tap anywhere to turn on order sounds" }: { label?: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const update = () => setShow(soundEnabled() && !audioUnlocked());
    update();
    return onSoundChange(update);
  }, []);
  if (!show) return null;
  return (
    <button
      onClick={() => chime()}
      className="fixed z-[60] left-1/2 -translate-x-1/2 bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-6 h-10 px-4 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[13px] font-semibold shadow-lg flex items-center gap-2 cursor-pointer"
    >
      <Volume2 className="w-4 h-4" /> {label}
    </button>
  );
}
