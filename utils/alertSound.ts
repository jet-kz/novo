"use client";

/**
 * Alert sounds made in the browser (no audio files). Browsers only allow sound after the user
 * has tapped the page once, so we unlock the audio engine on the first tap/key press.
 *
 *  chime()            short two-note sound for updates
 *  startRing(key)     repeating ring for things that need action (new order, new job);
 *                     the same key never rings twice at once; stopRing(key) ends it
 */

const SOUND_KEY = "novo_sound";
let ctx: AudioContext | null = null;
const rings = new Map<string, { timer: ReturnType<typeof setInterval>; until: ReturnType<typeof setTimeout> }>();
const listeners = new Set<() => void>();

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
  }
  return ctx;
}

export function soundEnabled(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundEnabled(on: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, on ? "on" : "off");
  } catch {}
  if (!on) stopAllRings();
  listeners.forEach((fn) => fn());
}

/** True once the browser lets us play sound (after the first tap). */
export function audioUnlocked(): boolean {
  return !!ctx && ctx.state === "running";
}

export function onSoundChange(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Call once on app start: unlocks audio on the first user gesture. */
export function installAudioUnlock() {
  if (typeof window === "undefined") return;
  const unlock = () => {
    const c = audio();
    if (!c) return;
    c.resume()
      .then(() => {
        // A silent blip finishes the unlock on iOS Safari.
        const o = c.createOscillator();
        const g = c.createGain();
        g.gain.value = 0;
        o.connect(g).connect(c.destination);
        o.start();
        o.stop(c.currentTime + 0.01);
        listeners.forEach((fn) => fn());
      })
      .catch(() => {});
  };
  ["pointerdown", "keydown", "touchstart"].forEach((ev) => window.addEventListener(ev, unlock, { passive: true }));
}

function tone(freq: number, start: number, length: number, volume: number) {
  const c = audio();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + length + 0.05);
}

/** Gentle two-note chime for updates. */
export function chime(force = false) {
  if (!force && !soundEnabled()) return;
  const c = audio();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => {});
  const t = c.currentTime + 0.02;
  tone(880, t, 0.45, 0.25);
  tone(1320, t + 0.2, 0.55, 0.25);
}

/** One burst of the attention ring: three quick rising notes, twice. */
function ringBurst() {
  const c = audio();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => {});
  const t = c.currentTime + 0.02;
  [0, 0.75].forEach((offset) => {
    tone(784, t + offset, 0.18, 0.35);
    tone(988, t + offset + 0.18, 0.18, 0.35);
    tone(1319, t + offset + 0.36, 0.3, 0.35);
  });
  if ("vibrate" in navigator) navigator.vibrate?.([300, 120, 300, 120, 300]);
}

/** Ring every few seconds until stopRing(key) or maxMs passes. */
export function startRing(key: string, maxMs = 120_000, force = false) {
  if (rings.has(key) || (!force && !soundEnabled())) return;
  ringBurst();
  const timer = setInterval(ringBurst, 3500);
  const until = setTimeout(() => stopRing(key), maxMs);
  rings.set(key, { timer, until });
}

export function stopRing(key: string) {
  const r = rings.get(key);
  if (!r) return;
  clearInterval(r.timer);
  clearTimeout(r.until);
  rings.delete(key);
}

export function stopAllRings() {
  Array.from(rings.keys()).forEach(stopRing);
}

export function isRinging(key: string) {
  return rings.has(key);
}
