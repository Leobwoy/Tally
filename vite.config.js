import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const base = process.env.VITE_BASE_URL || "/";

export default defineConfig({
  base,
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        maximumFileSizeToCacheInBytes: 5000000,
      },
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
    }),
  ],

  resolve: {
    alias: { "@": "/src" },
  },
});
