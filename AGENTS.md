# Albero Maestri — guida per chi sviluppa

App **Vite + React 19 + TypeScript + Tailwind CSS v4**. SPA che gira
interamente nel browser: i dati vivono in `localStorage` tramite uno store
**Zustand**, con dati d'esempio precaricati. Nessun backend richiesto.

## Struttura

```
src/
  lib/            dominio (enum + etichette), format, codice-parlante, conti (motore), types, id
  data/seed.ts    dati d'esempio (clienti, lavori, preventivi, ore, pagamenti, spese, attrezzi)
  store/          store Zustand (CRUD + persistenza) e store dei toast
  components/     Layout, UI (ui.tsx), Modal, Toaster, RigaEditabile (modifica inline)
  pages/          una pagina per "stanza" (Cruscotto, Calendario, Clienti, …)
  App.tsx         rotte + guardia d'accesso
  index.css       design system (token, componenti, animazioni)
```

## Principi

- **I dati derivati si calcolano, non si duplicano**: codice parlante, totali,
  stato dei pagamenti e storico vivono in `src/lib/` e si ricalcolano alla
  lettura. Le pagine non memorizzano valori aggregati.
- **Logica nello store**: ogni mutazione passa per un'azione di `useStore`.
  Per collegare un vero backend basta sostituire l'implementazione delle
  azioni con chiamate HTTP — l'interfaccia resta identica.
- **Stile coerente**: usa le classi del design system (`.btn`, `.field`,
  `.am-card`, `.badge`, `.codice`, `.am-table`) e i componenti di
  `components/ui.tsx`. I colori passano sempre dai token in `index.css`.

## Comandi

| Comando | Azione |
|---|---|
| `npm run dev` | Server di sviluppo (http://localhost:3000) |
| `npm run build` | Type-check + build di produzione in `dist/` |
| `npm run preview` | Anteprima della build |

Accesso: password predefinita `albero`.
