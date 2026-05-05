import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      // Include all assets needed for offline use
      includeAssets: ["icon.svg", "apple-touch-icon.png", "manifest.json"],

      manifest: {
        name: "Tally — Field Service Tracker",
        short_name: "Tally",
        description: "Track your field service hours and bible studies.",
        theme_color: "#E8845A",
        background_color: "#FFF8F3",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },

      workbox: {
        // Cache all app shell assets for offline use
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],

        // Runtime caching strategy: network first with offline fallback
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.amazonaws\.com\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "aws-api-cache",
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
    }),
  ],

  // Clean absolute imports — src/ is the root
  resolve: {
    alias: { "@": "/src" },
  },
});
