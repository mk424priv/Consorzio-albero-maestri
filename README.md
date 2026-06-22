# 🌳 Albero Maestri

Spazio di lavoro per un'attività nel verde (potatura, abbattimento,
manutenzione giardini). **Non un cruscotto: un workspace** costruito attorno ai
clienti, dove lavori, ore, incassi, squadra e compensi vivono collegati tra
loro — pensato prima per lo smartphone.

- **Visione & architettura**: [docs/VISIONE.md](docs/VISIONE.md)
- **PRD frontend**: [docs/PRD-FRONTEND.md](docs/PRD-FRONTEND.md)
- **Concezione originale**: [Presentazione-Concezione.md](Presentazione-Concezione.md)

## L'esperienza

| Superficie | Cosa offre |
|---|---|
| 🌱 **Spazio** | La bacheca dei clienti (carte o tabella stile Notion). Carte espandibili, codice parlante, saldi, azioni rapide. Il pilota di comando. |
| 🌿 **Scheda cliente** | L'hub di ogni cliente: panoramica con feed attività, lavori, pagamenti, ore, spese — tutto collegato, con creazione contestuale. |
| 🧑‍🌾 **Squadra** | Gli operatori e il loro libro mastro: ore → dovuto, pagato, **da pagare**. Registri i compensi alla squadra. |
| 💶 **Soldi** | Il flusso del denaro: movimenti (incassi/compensi/spese), storico mensile con micro-grafici, patrimonio attrezzi. |
| 📅 **Agenda** | I lavori nel tempo, per giorno e per operatore, con azioni rapide. |

Ogni entità ha la sua **tinta-guida** (cliente, operatore, lavoro, preventivo,
incasso, compenso, spesa, patrimonio): l'occhio riconosce *cosa* sta guardando.
Creazione e modifica avvengono in **fogli** (bottom-sheet su telefono, dialog su
desktop). Navigazione a **bottom-nav** su mobile, **rail laterale** su desktop.

Il **codice parlante** (`MR-03-14-01`) riassume ogni cliente — iniziali, giorni
medi per incassare, spesa media a lavoro, anni insieme — ricalcolato dai dati.

## Stack

**Vite · React 19 · TypeScript · Tailwind CSS v4 · Zustand · React Router ·
Framer Motion · Radix UI · Lucide.** SPA che gira nel browser: i dati sono
persistiti in `localStorage` (con dati d'esempio pronti), nessun backend
richiesto. Lo store è progettato per essere sostituito da un'API reale senza
toccare l'interfaccia.

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
| `npm run lint` | ESLint |

## Dati

Vivono nel browser (`localStorage`, chiave `albero-maestri`). Allo start trovi
uno scenario d'esempio (clienti dell'Isola d'Elba, una squadra di due operatori
con compensi saldati e in sospeso). Dal menù profilo puoi **ricaricare gli
esempi** o **svuotare tutto**.

## Struttura

```
docs/             VISIONE.md (concezione) · PRD-FRONTEND.md (specifica)
src/lib/          dominio, format, codice-parlante, conti, squadra, movimenti, entità (tinte), motion
src/data/seed.ts  dati d'esempio
src/store/        store dati (Zustand) · store UI (fogli/conferme) · toast
src/components/ui/ libreria UI (Button, Field, Sheet, Tabs, Table, Menu, …)
src/components/   Shell (nav) · sheets (creazioni/modifiche globali)
src/pages/        Spazio · ClienteScheda · Squadra · OperatoreScheda · Soldi · Agenda · Login
```
