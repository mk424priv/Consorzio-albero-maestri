# ⌁ NEXUS — Centro di Controllo Progetti

Il **centro di controllo dei progetti personali**: restauri auto, lavori in
casa, mobili da costruire, allestimento van/camper, giardino, acquisti
pianificati. Design da control-room: vetro, neon Matrix, animazioni.

**Local-first PWA** — nessun backend: i dati vivono nel dispositivo
(IndexedDB), l'app funziona offline e si installa come app.

## Le sezioni

- **CONTROLLO** — colpo d'occhio: progetti attivi, costi stimati, già speso.
- **CREA** — il cuore: nuovo progetto con **calcolo costi live**
  (voci quantità × prezzo, ripartizione per categoria, confronto budget)
  e **bozza 3D** opzionale.
- **PROGETTI** — archivio con filtri per stato; ogni progetto è una scheda
  viva: stato, costi persistenti, bozza 3D, eliminazione.
- **BOZZE 3D** — spazi tridimensionali (giardino, stanza, van, garage) in cui
  posizionare oggetti parametrici (capanna, mobili, alberi, cucina van, auto…):
  sposta, ruota, scala, colora. Salvataggio automatico nel progetto.
- **MODULI** — collega le tue web-app (Vercel / GitHub Pages) come
  sotto-applicazioni: incorporate dentro NEXUS o in scheda esterna.

## Stack

Vite · React 19 · TypeScript · Tailwind CSS v4 · Dexie (IndexedDB) · Zustand ·
framer-motion · three.js + @react-three/fiber + drei · PWA.

## Comandi

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # type-check + build in dist/
npm test         # test motore costi
```

Guida per lo sviluppo: [`AGENTS.md`](AGENTS.md).
