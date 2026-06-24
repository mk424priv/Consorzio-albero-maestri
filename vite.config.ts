import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

// Albero Maestri — local-first PWA. Nessun backend in v1: i dati vivono in
// IndexedDB (Dexie). Il service worker rende l'app installabile e offline.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["albero.svg"],
      manifest: {
        name: "Albero Maestri",
        short_name: "Albero",
        description: "Il taccuino del maestro: lavori, clienti, soldi.",
        lang: "it",
        theme_color: "#f4efe6",
        background_color: "#f4efe6",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "albero.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,woff,woff2,svg,png}"],
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
        },
      },
    },
  },
});
