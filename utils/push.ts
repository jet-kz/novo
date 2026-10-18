/**
 * Web push for order alerts. Works in Chrome/Edge/Firefox/Samsung on Android and desktop, and on
 * iPhone (iOS 16.4+) only after Novo is added to the Home Screen.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://novobackend.onrender.com/api/v1";

export type PushState = "unsupported" | "ios-needs-install" | "denied" | "default" | "granted";

const isIOS = () =>
  typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true);

export function pushState(): PushState {
  if (typeof window === "undefined") return "unsupported";
  if (isIOS() && !isStandalone()) return "ios-needs-install";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  return Notification.permission as PushState;
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function registration() {
  return (await navigator.serviceWorker.getRegistration("/")) || navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

export interface GuestFollow {
  orderId: string;
  token: string;
  openUrl: string;
}

/**
 * Ask permission (if needed), subscribe this device and register it with the backend.
 * Signed-in users get all their alerts; pass `guest` to follow one guest order.
 */
export async function enablePush(guest?: GuestFollow): Promise<PushState> {
  const state = pushState();
  if (state === "unsupported" || state === "ios-needs-install" || state === "denied") return state;
  const permission = state === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") return permission as PushState;

  const keyRes = await fetch(`${API_BASE_URL}/notifications/push/key`).then((r) => r.json()).catch(() => null);
  const publicKey = keyRes?.data?.public_key;
  if (!publicKey) throw new Error("Notifications aren't set up on the server yet.");

  const reg = await registration();
  await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ||
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) }));

  const token = localStorage.getItem("access_token");
  const res = await fetch(`${API_BASE_URL}/notifications/push/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({
      subscription: sub.toJSON(),
      user_agent: navigator.userAgent.slice(0, 250),
      ...(guest ? { guest_order_id: guest.orderId, guest_token: guest.token, open_url: guest.openUrl } : {}),
    }),
  });
  if (!res.ok) throw new Error("Couldn't turn on notifications. Try again.");
  return "granted";
}

/** If this device already allowed notifications, quietly (re)link it — e.g. right after sign-in. */
export async function relinkPushIfGranted(guest?: GuestFollow) {
  try {
    if (pushState() === "granted") await enablePush(guest);
  } catch {}
}
