/* eslint-disable no-restricted-globals */
/**
 * Custom service worker — precaches app shell + shows reminder notifications.
 * vite-plugin-pwa injectManifest replaces self.__WB_MANIFEST at build time.
 */
import { precacheAndRoute } from "workbox-precaching";

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "SHOW_REMINDER") return;

  self.registration.showNotification(data.title || "Tally", {
    body: data.body || "",
    icon: data.icon || "/icon-192.png",
    badge: "/icon-192.png",
    tag: "daily-reminder",
  });
});
