# 🌳 Albero Maestri

Il **taccuino del maestro**: un'app per chi fa lavori nel verde (potatura,
giardini, manutenzione) sull'Isola d'Elba. Non un CRM — un quaderno di bottega
in cui registri il lavoro (fatto o da fare), i clienti, gli operai e i soldi.
Pensato per il telefono, **local-first**: funziona offline, i dati vivono nel
dispositivo.

> Questo è un **prodotto nuovo**. La verità del prodotto vive in
> [`canone/`](canone/): visione UX (`01`), specifica (`02`), piano (`03`).

## L'esperienza

- **Agenda** — la home: feed mensile dei lavori, con la *targhetta* di ottone
  della data che segue lo scroll. Card `svolto` (ricevuta calda) vs `programmato`
  (copia a matita), con incasso al volo.
- **Crea registrazione** — il cuore: scegli il carattere (`svolto`/`programmato`)
  e la modalità (`preventivo`/`ore`/`giornate`/`totale`); cliente, spese,
  collaborazione, "Già incassato?". Tutto cresce dal basso, niente campi vuoti.
- **Cliente** — la scheda-dossier: `codice parlante` (`MR-03-12-05`), riepilogo,
  stati separati (pagato / da incassare / da fare), chiusura pagamenti inline.
- **Operaio** — statistica minima + azioni; `Paga operaio`. Le *mie* ore sono
  profitto, non costo.
- **Soldi** — il centro: `da incassare` ⇄ `da pagare`, `Incasso Subito`, prelievo,
  e tre dashboard (guadagnato / incassato / da incassare) che aprono la Dashboard.

Il **codice parlante** riassume ogni cliente (iniziali, giorni medi per
incassare, spesa media a lavoro, anni insieme), ricalcolato dai dati.

## Stack

**Vite · React 19 · TypeScript · Tailwind CSS v4** · **Dexie (IndexedDB)** ·
Zustand · React Router · Framer Motion · Radix UI · Lucide · font self-hosted
(Fraunces / Inter / IBM Plex Mono) · PWA (Workbox). Local-first: nessun backend
in v1; la cucitura repository permette di aggiungere un sync senza riscrivere la UI.

## Avvio

Serve Node 20+.

```bash
npm install
npm run dev        # http://localhost:3000
```

L'app si apre diretta (nessuna password). Allo start carica dati d'esempio.

## Script

| Comando | Azione |
|---|---|
| `npm run dev` | Server di sviluppo |
| `npm run build` | Type-check + build (`dist/`) |
| `npm run preview` | Anteprima della build |
| `npm test` | Test del motore conti (vitest) |
| `npm run lint` | ESLint |

## Dati & backup

Vivono nel browser via **Dexie/IndexedDB** (local-first). Da **Impostazioni**
puoi **esportare/importare** un file JSON (backup e trasferimento) o **ricaricare
i dati d'esempio**.
