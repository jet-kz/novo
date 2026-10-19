"use client";

import React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { usePlatform, type ThemePreference } from "@/store/PlatformContext";

const OPTIONS: { id: ThemePreference; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "system", label: "System", icon: Monitor },
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
];

/** Compact header button: taps through System → Light → Dark. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { themePreference, setThemePreference } = usePlatform();
  const index = OPTIONS.findIndex((o) => o.id === themePreference);
  const current = OPTIONS[index < 0 ? 0 : index];
  const next = OPTIONS[(index + 1) % OPTIONS.length];
  const Icon = current.icon;

  return (
    <button
      type="button"
      onClick={() => setThemePreference(next.id)}
      aria-label={`Theme: ${current.label}. Switch to ${next.label}.`}
      title={`Theme: ${current.label} (tap for ${next.label})`}
      className={`w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center justify-center shrink-0 ${className}`}
    >
      <Icon className="w-4.5 h-4.5" />
    </button>
  );
}

/** Full picker for settings screens: System / Light / Dark. */
export function ThemeSwitcher({ className = "" }: { className?: string }) {
  const { themePreference, setThemePreference } = usePlatform();
  return (
    <div role="radiogroup" aria-label="Theme" className={`grid grid-cols-3 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 ${className}`}>
      {OPTIONS.map((o) => {
        const Icon = o.icon;
        const on = themePreference === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => setThemePreference(o.id)}
            className={`h-10 rounded-xl flex items-center justify-center gap-1.5 text-sm font-semibold transition-colors cursor-pointer ${
              on ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"
            }`}
          >
            <Icon className="w-4 h-4" /> {o.label}
          </button>
        );
      })}
    </div>
  );
}
