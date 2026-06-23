import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";

// Font self-hosted (offline-ready, canone 02 §1.1): nessuna dipendenza da CDN.
import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";

import "./index.css";
import { App } from "@/app/App";

registerSW({ immediate: true });

const root = document.getElementById("root");
if (!root) throw new Error("Elemento #root non trovato");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
