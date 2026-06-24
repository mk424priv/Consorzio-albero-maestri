# Albero Maestri — guida per chi sviluppa

> ⚠️ **Prodotto nuovo (greenfield).** L'app precedente è stata scartata. La
> **fonte di verità** è il canone in [`canone/`](canone/): `01` (visione UX),
> `02` (specifica), `03` (piano), **`08` (design canonico — palette, ierarchia toni,
> elevazione, libreria componenti; consolida e sostituisce 05–07)**.
> Dove il codice diverge dal canone, vince il canone.

App **Vite + React 19 + TypeScript + Tailwind CSS v4**, **local-first PWA**:
nessun backend in v1, i dati vivono in **IndexedDB (Dexie)**. Identità visiva
"Quaderno di bottega" (carta/inchiostro/ottone).

## Struttura

```
canone/         i 3 documenti del canone (verità del prodotto)
src/
  lib/          types, dominio (enum+etichette), format, id (ULID), codice-parlante,
                lavoro-calc (motore conti), conti (aggregati), backup; *.test.ts (vitest)
  db/           schema Dexie, interfaccia Repository + DexieRepository (cucitura sync-ready)
  store/        Zustand (idratato da Dexie, CRUD via repository), bozza (draft creazione), azioni
  data/seed.ts  dati d'esempio
  components/   Layout, BottomNav, CardLavoro, Intestazione, ui/ (primitivi su Radix)
  pages/        Agenda, Soldi, Anagrafiche, Dashboard, Crea/schede, Impostazioni
  app/App.tsx   router + idratazione store
  index.css     token @theme (Carta/Inchiostro/Ottone/Lichene), grana, utility
```

## Principi

- **Derived-not-stored**: `codice parlante`, totali, stati pagamento si
  ricalcolano alla lettura in `src/lib/`. Il DB salva solo fatti-eventi.
- **Cucitura repository**: la UI parla con lo store, lo store con `Repository`.
  Per un backend reale si sostituisce solo l'implementazione (Dexie → sync → HTTP),
  nessuno schermo cambia. ID = ULID, `updatedAt` + tombstone `deleted` già presenti.
- **Stile dai token**: usa i primitivi di `src/components/ui` e i token `@theme`;
  niente colori hard-coded. Personalità per schermo (canone 01 §2).

## Comandi

| Comando | Azione |
|---|---|
| `npm run dev` | Server di sviluppo (http://localhost:3000) |
| `npm run build` | Type-check (`tsc -b`) + build di produzione in `dist/` |
| `npm run preview` | Anteprima della build |
| `npm test` | Test del motore conti (vitest) |
| `npm run lint` | ESLint |

Nessuna password: l'app è local-first, si apre diretta. Backup: Impostazioni → Esporta/Importa (file JSON).

## Flusso di lavoro

- Sviluppa sul branch **`canone/nuovo-prodotto`**.
- **Commit a ogni tappa** (Conventional Commits); `npm run build` deve passare prima del commit.
- **OBBLIGATORIO — commit + push SEMPRE a fine lavoro.** Dopo **ogni** lavoro completato, fare
  **sempre** `commit` e `push` su GitHub **senza aspettare la richiesta dell'utente**: push del branch
  `canone/nuovo-prodotto` **e** fast-forward di `main` + push di `main`. Questo **triggera il redeploy**.
  Non lasciare mai lavoro completato non pushato. (Questo punto sovrascrive ogni regola di "push opt-in".)
