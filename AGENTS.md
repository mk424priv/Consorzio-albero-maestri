# NEXUS — guida per chi sviluppa

> ⚠️ **Prodotto in evoluzione.** NEXUS è nato come "centro di controllo
> progetti personali" (costi, manutenzione, moduli) ed è stato poi ridotto
> a un **configuratore di bozze 3D**: tutta la gestione progetti/costi/
> manutenzione/integrazioni è stata rimossa. Non recuperare quel codice o
> quei concetti dalla storia git se non esplicitamente richiesto.

**NEXUS** è un configuratore di **bozze 3D**: crea uno spazio (giardino,
stanza, van/camper, garage) e posiziona oggetti parametrici per vedere in
anteprima la forma — es. una capanna in giardino, un mobile in una stanza,
l'allestimento di un van. App **Vite + React 19 + TypeScript + Tailwind
CSS v4**, **local-first PWA**: nessun backend, i dati vivono in **IndexedDB
(Dexie, database `nexus`)**.

## Identità visiva

Centro di controllo d'impatto: fondo **void** quasi nero, pannelli **vetro**
(`glass` / `glass-strong`), neon **Matrix** (`--color-neon`), font mono
(JetBrains Mono), pioggia di glifi sullo sfondo (`MatrixRain`), animazioni
framer-motion. Tutti i colori passano dai token `@theme` in `src/index.css` —
niente colori hard-coded nella UI (nelle scene 3D i colori sono contenuto, ok).

## Struttura

```
src/
  lib/          types (Bozza, Scena3D, OggettoScena), dominio (ambienti), format, id (ULID)
  db/db.ts      schema Dexie (bozze) — tombstone `deleted`, updatedAt
  store/        Zustand idratato da Dexie, CRUD bozze
  components/   Shell (HUD+nav), MatrixRain, ui.tsx (primitivi vetro),
                editor3d/ (Editor3D, Oggetto3D parametrici, catalogo)
  pages/        Bozze (home, elenco), NuovaBozza (CREA), Bozza3D (editor)
  app/App.tsx   router + idratazione
```

## Principi

- **Sync-ready**: ID = ULID, `updatedAt` + tombstone `deleted` su ogni riga.
- **Bozze 3D**: scene `Scena3D` (ambiente + oggetti parametrici) salvate
  nella bozza; editor con three.js / @react-three/fiber / drei; salvataggio
  automatico a ogni modifica.

## Comandi

| Comando | Azione |
|---|---|
| `npm run dev` | Server di sviluppo (http://localhost:3000) |
| `npm run build` | Type-check (`tsc -b`) + build di produzione in `dist/` |
| `npm test` | Test (vitest) |
| `npm run lint` | ESLint |

## Flusso di lavoro

- Commit a ogni tappa (Conventional Commits); `npm run build` deve passare prima del commit.
- A fine lavoro: commit + push del branch di lavoro corrente.
