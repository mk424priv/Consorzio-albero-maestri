# NEXUS — guida per chi sviluppa

> ⚠️ **Prodotto nuovo (greenfield), seconda generazione.** L'app precedente
> ("Albero Maestri", gestionale artigiani) è stata **scartata del tutto**:
> nuovo scopo, nuovo design, nuovo database. Non recuperare codice o concetti
> dalla storia git se non esplicitamente richiesto.

**NEXUS** è il centro di controllo dei **progetti personali** dell'utente:
restauri auto, lavori in casa, costruzione mobili, allestimento van/camper,
giardino, acquisti pianificati. App **Vite + React 19 + TypeScript +
Tailwind CSS v4**, **local-first PWA**: nessun backend, i dati vivono in
**IndexedDB (Dexie, database `nexus`)**.

## Identità visiva

Centro di controllo d'impatto: fondo **void** quasi nero, pannelli **vetro**
(`glass` / `glass-strong`), neon **Matrix** (`--color-neon`), font mono
(JetBrains Mono), pioggia di glifi sullo sfondo (`MatrixRain`), animazioni
framer-motion. Tutti i colori passano dai token `@theme` in `src/index.css` —
niente colori hard-coded nella UI (nelle scene 3D i colori sono contenuto, ok).

## Struttura

```
src/
  lib/          types, dominio (etichette), costi (motore, + test vitest), format, id (ULID)
  db/db.ts      schema Dexie (progetti, integrazioni) — tombstone `deleted`, updatedAt
  store/        Zustand idratato da Dexie, CRUD
  components/   Shell (HUD+nav), MatrixRain, ui.tsx (primitivi vetro), CalcolatoreCosti,
                editor3d/ (Editor3D, Oggetto3D parametrici, catalogo)
  pages/        Dashboard (CONTROLLO), Progetti, NuovoProgetto (CREA), DettaglioProgetto,
                Bozza3D, Bozze, Integrazioni (MODULI, iframe/link)
  app/App.tsx   router + idratazione
```

## Principi

- **Derived-not-stored**: totali costi e scostamenti budget si ricalcolano
  alla lettura (`src/lib/costi.ts`); il DB salva solo fatti.
- **Sync-ready**: ID = ULID, `updatedAt` + tombstone `deleted` su ogni riga.
- **Bozze 3D**: scene `Scena3D` (ambiente + oggetti parametrici) salvate nel
  progetto; editor con three.js / @react-three/fiber / drei.
- **Moduli**: le web-app dell'utente (Vercel/GitHub Pages) si collegano come
  sotto-applicazioni, incorporate (iframe) o in scheda esterna.

## Comandi

| Comando | Azione |
|---|---|
| `npm run dev` | Server di sviluppo (http://localhost:3000) |
| `npm run build` | Type-check (`tsc -b`) + build di produzione in `dist/` |
| `npm test` | Test del motore costi (vitest) |
| `npm run lint` | ESLint |

## Flusso di lavoro

- Commit a ogni tappa (Conventional Commits); `npm run build` deve passare prima del commit.
- A fine lavoro: commit + push del branch di lavoro corrente.
