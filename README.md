# 🌳 Albero Maestri

Centro di Comando del lavoro per un'attività nel verde (potatura, abbattimento,
manutenzione giardini). Clienti, lavori, preventivi, ore, pagamenti, spese e
quadro economico — tutto in un posto solo, che vive nei dati.

Interfaccia moderna, curata in ogni dettaglio: ogni campo, pulsante, badge,
dashboard e icona è parte di un unico design system coerente.

## Cosa fa

| Stanza | Funzione |
|---|---|
| 📊 Cruscotto | Incassato, speso, quanto resta, chi deve pagare |
| 📅 Calendario | Lavori per giorno, pianificazione della settimana |
| 🌱 Clienti | Anagrafica + **codice parlante** calcolato dai dati |
| 🧾 Preventivi | Cifra unica o acconto + saldo → pagamenti attesi |
| ⏱️ Ore | Ore giorno per giorno → compenso a fine mese |
| 💶 Pagamenti | Stati (in attesa / pagato / in ritardo), incassi |
| 🗓️ Storico | Mese per mese: atteso, incassato, uscite, saldo |
| 🔧 Officina | Attrezzi e loro valore |
| ⛽ Spese | Benzina, materiali e altre uscite |

Il **codice parlante** (es. `MR-03-14-01`) riassume ogni cliente: iniziali,
giorni medi per incassare, spesa media a lavoro (×50 €), anni insieme — sempre
ricalcolato dai dati reali.

## Stack

**Vite · React 19 · TypeScript · Tailwind CSS v4 · Zustand · React Router ·
Lucide.** SPA che gira interamente nel browser: i dati sono persistiti in
`localStorage` (con dati d'esempio già pronti), nessun backend richiesto.

## Avvio

Serve Node 20+.

```bash
npm install
npm run dev        # http://localhost:3000
```

Accesso: password predefinita `albero`.

## Script

| Comando | Azione |
|---|---|
| `npm run dev` | Server di sviluppo |
| `npm run build` | Type-check + build di produzione (`dist/`) |
| `npm run preview` | Anteprima della build |

## Dati

I dati vivono nel browser (`localStorage`, chiave `albero-maestri`). Allo
start trovi uno scenario d'esempio (quattro clienti dell'Isola d'Elba con
storie diverse). Per ripartire da zero puoi svuotare i dati del sito dal
browser, oppure richiamare le azioni `reseed()` / `svuota()` dello store.

## Struttura

```
src/lib/          dominio, format, codice-parlante, conti (motore), types
src/data/seed.ts  dati d'esempio
src/store/        store Zustand (dati + CRUD) e toast
src/components/   Layout, UI, Modal, Toaster, modifica inline
src/pages/        le stanze (una pagina ciascuna)
src/App.tsx       rotte + accesso
```
