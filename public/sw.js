/* Novo service worker: shows push notifications and opens the right page when tapped. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// New orders and new jobs need someone to act, so they stay on screen and buzz harder.
const URGENT = ["new_order", "job"];
const IOS = /iPhone|iPad|iPod/.test(self.navigator.userAgent || "");

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Novo", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Novo";
  const urgent = URGENT.includes(data.kind);

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      // Tell open Novo tabs so they can ring and show the alert in the app.
      windows.forEach((w) => w.postMessage({ type: "novo-push", ...data }));
      // If Novo is open and in front, the in-app alert (with sound) is enough. iOS always needs
      // a visible notification for every push, so we still show one there.
      const inFront = windows.some((w) => w.visibilityState === "visible" && w.focused);
      if (inFront && !IOS) return;
      return self.registration.showNotification(title, {
        body: data.body || "",
        icon: "/novo-logo/01_Motion_N/01-motion-n_green.png",
        badge: "/novo-logo/01_Motion_N/01-motion-n_green.png",
        tag: data.tag || undefined,
        renotify: Boolean(data.tag),
        requireInteraction: urgent,
        silent: false,
        data: { url: data.url || "/" },
        vibrate: urgent ? [400, 150, 400, 150, 400, 150, 400] : [150, 80, 150],
      });
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      // Reuse an open Novo tab if there is one.
      for (const win of windows) {
        if (win.url.startsWith(self.location.origin) && "focus" in win) {
          win.navigate(target);
          return win.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
