"use client";

/**
 * Alert sounds, made in the browser (no audio files). Each device picks a style:
 *  - "chime": musical chime for updates, a repeating ring for things that need action
 *  - "voice": the phone reads the alert out loud, OPay-style ("New order! 7,600 naira...")
 *
 * Browsers only allow sound after the user has tapped the page once, so the audio engine and
 * the speech voice are unlocked on the first tap/key press.
 *
 *  chime(force?, text?)            one-off update; speaks `text` in voice mode
 *  startRing(key, maxMs?, force?, text?)
 *                                  repeats until stopRing(key) (new order, new job); the same key
 *                                  never runs twice at once; in voice mode it repeats `text`
 */

export type AlertStyle = "chime" | "voice";

const SOUND_KEY = "novo_sound";
const STYLE_KEY = "novo_alert_style";
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

function notify() {
  listeners.forEach((fn) => fn());
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
  notify();
}

export function voiceSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

export function alertStyle(): AlertStyle {
  try {
    const v = localStorage.getItem(STYLE_KEY);
    return v === "voice" && voiceSupported() ? "voice" : "chime";
  } catch {
    return "chime";
  }
}

export function setAlertStyle(style: AlertStyle) {
  try {
    localStorage.setItem(STYLE_KEY, style);
  } catch {}
  notify();
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

/** Call once on app start: unlocks audio and speech on the first user gesture. */
export function installAudioUnlock() {
  if (typeof window === "undefined") return;
  const unlock = () => {
    // iOS only lets speech play later if it was started once inside a tap.
    if (voiceSupported()) {
      try {
        const u = new SpeechSynthesisUtterance(" ");
        u.volume = 0;
        window.speechSynthesis.speak(u);
      } catch {}
    }
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
        notify();
      })
      .catch(() => {});
  };
  ["pointerdown", "keydown", "touchstart"].forEach((ev) => window.addEventListener(ev, unlock, { passive: true }));
}

// ── Voice ────────────────────────────────────────────────────────────────────

/** "New order · ₦7,600" -> "New order, 7,600 naira" so it reads naturally. */
export function speakable(text: string): string {
  return text
    // Match "7,600" or "850" but not a comma that follows the amount ("₦7,600, 3 items").
    .replace(/₦\s?(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)/g, "$1 naira")
    .replace(/\bNGN\s?(\d{1,3}(?:,\d{3})+|\d+)/gi, "$1 naira")
    .replace(/\s*→\s*/g, " to ")
    .replace(/\s*[·•|]\s*/g, ", ")
    .replace(/#?\bORD-[A-Z0-9]+\b/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const prefer = ["en-NG", "en-GB", "en-US", "en"];
  for (const lang of prefer) {
    const matches = voices.filter((v) => v.lang?.toLowerCase().startsWith(lang.toLowerCase()));
    if (matches.length) return matches.find((v) => /google|natural|enhanced|premium/i.test(v.name)) || matches[0];
  }
  return voices[0];
}

/** Read text out loud. A soft lead-in chime gets attention first, like payment-app alerts. */
export function speak(text: string, force = false) {
  if (!voiceSupported() || (!force && !soundEnabled())) return;
  const line = speakable(text);
  if (!line) return;
  const synth = window.speechSynthesis;
  softPing();
  setTimeout(() => {
    try {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(line);
      const voice = pickVoice();
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      } else {
        u.lang = "en-GB";
      }
      u.rate = 0.98;
      u.pitch = 1;
      u.volume = 1;
      synth.speak(u);
    } catch {}
  }, 350);
}

// ── Tones ────────────────────────────────────────────────────────────────────

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

function softPing() {
  const c = audio();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => {});
  tone(1046, c.currentTime + 0.02, 0.28, 0.18);
}

function playChime() {
  const c = audio();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => {});
  const t = c.currentTime + 0.02;
  tone(880, t, 0.45, 0.25);
  tone(1320, t + 0.2, 0.55, 0.25);
}

/** Update alert: a chime, or the text read out in voice mode. */
export function chime(force = false, text?: string, style: AlertStyle = alertStyle()) {
  if (!force && !soundEnabled()) return;
  if (style === "voice" && text && voiceSupported()) return speak(text, force);
  playChime();
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
}

/**
 * Repeat until stopRing(key) or maxMs passes. Chime style rings every few seconds; voice
 * style reads `text` again every ~10 seconds so it doesn't talk over itself.
 */
export function startRing(key: string, maxMs = 120_000, force = false, text?: string, style: AlertStyle = alertStyle()) {
  if (rings.has(key) || (!force && !soundEnabled())) return;
  const useVoice = style === "voice" && !!text && voiceSupported();
  const play = () => {
    if (useVoice) speak(text!, force);
    else ringBurst();
    if ("vibrate" in navigator) navigator.vibrate?.([300, 120, 300, 120, 300]);
  };
  play();
  const timer = setInterval(play, useVoice ? 10_000 : 3500);
  const until = setTimeout(() => stopRing(key), maxMs);
  rings.set(key, { timer, until });
}

export function stopRing(key: string) {
  const r = rings.get(key);
  if (!r) return;
  clearInterval(r.timer);
  clearTimeout(r.until);
  rings.delete(key);
  if (rings.size === 0 && voiceSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

export function stopAllRings() {
  Array.from(rings.keys()).forEach(stopRing);
}

export function isRinging(key: string) {
  return rings.has(key);
}
