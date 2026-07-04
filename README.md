# ⌁ NEXUS — Bozze 3D

Un **configuratore di bozze 3D**: disegna uno spazio e posiziona oggetti
parametrici per vederne la forma in anteprima — una capanna in giardino, un
mobile in una stanza, l'allestimento di un van. Design da control-room:
vetro, neon Matrix, animazioni.

**Local-first PWA** — nessun backend: i dati vivono nel dispositivo
(IndexedDB), l'app funziona offline e si installa come app.

## Come funziona

- **BOZZE 3D** — l'elenco delle tue bozze, un tap per riaprirle nell'editor.
- **CREA** — dai un nome allo spazio e scegli l'ambiente (giardino, stanza,
  van/camper, garage): si apre subito l'editor 3D.
- **Editor 3D** — catalogo di oggetti parametrici (capanna, alberi, mobili,
  cucina van, auto…): aggiungi, sposta, ruota, scala, colora. Salvataggio
  automatico a ogni modifica.

## Stack

Vite · React 19 · TypeScript · Tailwind CSS v4 · Dexie (IndexedDB) · Zustand ·
framer-motion · three.js + @react-three/fiber + drei · PWA.

## Comandi

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # type-check + build in dist/
npm test         # test
```

Guida per lo sviluppo: [`AGENTS.md`](AGENTS.md).
