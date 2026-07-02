import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

// NEXUS — centro di controllo progetti. Local-first PWA: i dati vivono in
// IndexedDB (Dexie), nessun backend. Il service worker rende l'app offline.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["nexus.svg"],
      manifest: {
        name: "NEXUS — Centro di Controllo",
        short_name: "NEXUS",
        description: "Centro di controllo dei progetti personali: costi, bozze 3D, integrazioni.",
        lang: "it",
        theme_color: "#04070a",
        background_color: "#04070a",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "nexus.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,woff,woff2,svg,png}"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: { port: 3000, host: true },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          motion: ["framer-motion"],
          db: ["dexie", "dexie-react-hooks"],
          three: ["three", "@react-three/fiber", "@react-three/drei"],
        },
      },
    },
  },
});
