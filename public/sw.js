/* Novo service worker: shows push notifications and opens the right page when tapped. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Novo", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Novo";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/novo-logo/01_Motion_N/01-motion-n_green.png",
      badge: "/novo-logo/01_Motion_N/01-motion-n_green.png",
      tag: data.tag || undefined,
      renotify: Boolean(data.tag),
      data: { url: data.url || "/" },
      vibrate: [120, 60, 120],
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
