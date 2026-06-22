# PRD Frontend — Albero Maestri 2.0
### Specifica di implementazione dell'esperienza

| | |
|---|---|
| **Documento** | Product Requirements Document — Frontend |
| **Companion** | [VISIONE.md](VISIONE.md) (concezione & architettura) |
| **Stack base** | Vite · React 19 · TypeScript · Tailwind CSS v4 · Zustand |
| **Stato** | Da realizzare — riscrittura completa di UX/UI |
| **Lingua prodotto** | Italiano |

---

## 1. Obiettivi e non-obiettivi

### 1.1 Obiettivi
- **G1** Una **superficie centrale** (Spazio) costruita sui clienti, da cui si
  vede e si fa tutto. Niente "dashboard per il dashboard".
- **G2** Ridurre le pagine: 4 destinazioni primarie + scheda cliente + scheda
  operatore; il resto in fogli/modali/espansioni.
- **G3** Collegare le entità: cliente ↔ lavoro ↔ operatore ↔ ore ↔ pagamenti ↔
  compensi, sempre dal contesto.
- **G4** Tabelle **stile Notion**: stati, badge, icone, modifica inline, azioni
  di riga, ordinamento, densità.
- **G5** **Mobile-first** reale: bottom-nav, bottom-sheet, carte, gesti, zone-pollice.
- **G6** Linguaggio visivo giovane e coerente, con color-coding per entità e
  micro-animazioni.
- **G7** Nuova dimensione **Squadra & Compensi**: quanto devo a chi lavora.

### 1.2 Non-obiettivi
- Backend remoto / multi-utente reale (resta store locale persistente; pronto a
  essere sostituito da API).
- Dark mode (token predisposti, ma non in questa iterazione).
- Mappa territorio / GPS / fatturazione (fasi successive).

---

## 2. Stack e librerie

| Libreria | Scopo |
|---|---|
| `framer-motion` | animazioni e gesti (sheet, carte, liste, tab) |
| `@radix-ui/react-dialog` | dialog accessibili (base modali) |
| `vaul` | bottom-sheet mobile (su Radix Dialog) |
| `@radix-ui/react-tabs` | tab/segmented control accessibili |
| `@radix-ui/react-dropdown-menu` | menù azioni di riga / profilo |
| `@radix-ui/react-tooltip` | tooltip su icone-azione (desktop) |
| `@radix-ui/react-popover` | filtri, selettori a comparsa |
| `@radix-ui/react-switch` | impostazioni / toggle |
| `lucide-react` *(già)* | iconografia |
| `clsx` *(già)* | composizione classi |
| `zustand`, `react-router-dom` *(già)* | stato e routing |

Font via Google Fonts: **Plus Jakarta Sans** (UI) + **JetBrains Mono** (codice).

---

## 3. Design system

### 3.1 Token (in `index.css`, `@theme`)
- **Neutri**: `canvas`, `surface`, `surface-2`, `elevated`, `ink`, `ink-soft`,
  `muted`, `line`, `line-strong`.
- **Brand** (smeraldo) `brand-50…700` + `lime` accent per i gradienti.
- **Tinte entità** (ognuna 50/100/500/600): `cliente`(emerald), `operatore`(teal),
  `lavoro`(violet), `preventivo`(sky), `entrata`(green), `uscita`(amber),
  `spesa`(rose), `patrimonio`(stone).
- **Semantici**: `success`, `warn`, `danger`, `info` (+ varianti soft).
- **Raggi**: `--radius-sm/md/lg/xl` (10/14/18/26 px). **Ombre**: `sm/md/lg/glow`.
- **Motion**: durate/curve standard (`--ease-spring`, `--ease-out`).

### 3.2 Tipografia
Scala: display (28/32), h1 (22), h2 (18), body (14–15), small (12–13), mono per
codice. Peso 600–800 per titoli, tracking negativo sui titoli.

### 3.3 Catalogo componenti (`src/components/ui/`)
Primitivi, tutti stilizzati e mobile-ready:
- **Button** (varianti: primary, soft, ghost, danger, outline; dim: sm/md/lg/icon;
  stato loading; supporto icona).
- **IconButton**, **Fab** (azione flottante mobile).
- **Field / Input / NumberField / Select / Textarea / DatePicker(input date) / Switch**.
- **Card** (+ `CardHeader/Body/Footer`, varianti elevata/hover/colorata per entità).
- **Badge / StatusChip** (mappa stato→tinta+icona) per pagamento, lavoro, compenso, attrezzo.
- **Avatar** (iniziali, colore per entità/persona, dimensioni).
- **Metric / StatPill** (micro-indicatore tappabile).
- **Tabs / Segmented** (indicatore animato, scrollabile su mobile).
- **DataTable** (header sticky, ordinamento, riga con azioni hover/menu, modifica
  inline, densità, scroll orizzontale con prima colonna fissa).
- **Sheet** (responsivo: vaul bottom-sheet su mobile, Radix Dialog centrato su
  desktop) — base di tutte le creazioni/modifiche.
- **DropdownMenu**, **Popover**, **Tooltip**.
- **EmptyState**, **Skeleton/Loader**, **Toaster** (rinnovato), **ConfirmDialog**.
- **PageHeader**, **SectionHeader**, **FilterBar**, **SearchInput**.

### 3.4 Layout & navigazione
- **AppShell**: AppBar in alto (logo, ricerca, profilo) + contenuto + **BottomNav**
  fissa su mobile / **SideRail** su desktop.
- **BottomNav**: `[Spazio] [Agenda] [＋] [Soldi] [Squadra]` — il `＋` apre il
  foglio "Crea". Safe-area iOS, indicatore attivo animato.
- **SideRail** (≥ lg): icone+etichette, profilo in fondo, collassabile.
- Transizioni di pagina con framer-motion (fade/slide leggero).

---

## 4. Architettura informativa & routing

| Rotta | Superficie | Note |
|---|---|---|
| `/login` | Accesso | redesign, password `albero` |
| `/` | **Spazio** (bacheca clienti) | home |
| `/cliente/:id` | **Scheda cliente** | tab: panoramica/lavori/pagamenti/ore/spese |
| `/squadra` | **Squadra** (operatori) | |
| `/operatore/:id` | **Scheda operatore** | libro mastro |
| `/soldi` | **Soldi** | tab: movimenti/storico/patrimonio |
| `/agenda` | **Agenda** | settimana/giorno |
| `*` | redirect a `/` | |

Le creazioni/modifiche non hanno rotte proprie: sono **sheet** sopra la rotta
corrente (lo stato del foglio è locale, con default dal contesto).

---

## 5. Modello dati — adattamento del backend (store)

Si estende lo store Zustand mantenendo la logica esistente.

### 5.1 Rinomina e nuovi campi
- **Persona → Operatore**: `{ id, nome, ruolo: 'titolare'|'collaboratore',
  tariffaOraria (costo €/h riconosciuto), telefono?, colore?, attivo, note?, creatoIl }`.
- `RegistrazioneOre.personaId → operatoreId`; `Lavoro.personaId → operatoreId`.

### 5.2 Nuova entità — CompensoOperatore (soldi in uscita verso la squadra)
`{ id, operatoreId, importo, data, periodo? ('YYYY-MM'), metodo? ('contanti'|'bonifico'), note? }`.

### 5.3 Selettori derivati (in `lib/conti.ts` / nuovi `lib/squadra.ts`, `lib/movimenti.ts`)
- **libroOperatore(db, operatoreId, periodo?)** → `{ ore, dovuto (Σ ore×tariffa),
  pagato (Σ compensi), saldo, stato, perCliente[], compensi[] }`.
- **statoCompenso(dovuto, pagato)** → `da_pagare | parziale | saldato`.
- **movimenti(db, periodo)** → lista unificata `{tipo: incasso|compenso|spesa,
  importo, segno, data, controparte, stato?}` ordinata, per la vista Soldi.
- **riepilogoMese(db, anno, mese)** → `{ incassato, spese, compensi, uscite,
  saldo, daIncassare, daPagareSquadra }`.
- **feedCliente(db, clienteId)** → eventi (lavoro/ore/pagamento/spesa) ordinati
  per la Panoramica.
- Si conservano: `codiceCliente`, `riepilogoCliente`, `cruscotto`, `storicoMensile`
  (esteso: uscite = spese + compensi).

### 5.4 Azioni store nuove/aggiornate
- `creaOperatore/aggiornaOperatore/eliminaOperatore`.
- `pagaOperatore(operatoreId, {importo, data, periodo?, metodo?, note?})` → crea
  CompensoOperatore.
- `eliminaCompenso(id)`.
- ore/lavori usano `operatoreId`.
- `generaCompensoMese` (incasso cliente a ore) resta.

### 5.5 Persistenza
Bump `version` del persist; `migrate` ripopola con il nuovo seed (Persona→Operatore,
compensi d'esempio) per evitare stati incoerenti dalla versione precedente.

---

## 6. Specifiche per superficie

### 6.1 Spazio (`/`)
**Contenuto**: AppBar (ricerca globale, toggle vista, profilo) · striscia
micro-indicatori · FilterBar (chip: *Tutti / Da incassare / In ritardo / A ore /
A preventivo*; ordina per: nome, saldo, ultimo lavoro) · bacheca clienti · Fab/＋.

**Carta cliente** (mobile default):
- Header: Avatar(iniziali, smeraldo) · nome cognome · codice parlante (mono chip).
- Tre mini-stat con icona dal codice: *paga in N gg* · *spesa media* · *anni*.
- Riga saldo: badge verde "in pari" oppure ambra/rosa "€ X da incassare".
- Prossimo lavoro: data + titolo + avatar operatore, o "nessun lavoro".
- Azioni rapide: **Apri** · **＋Ore** · **＋Preventivo** · **Chiama** (tel:) · **espandi**.
- **Espansione** (framer-motion height): ultimi 2–3 pagamenti con StatusChip +
  ultimi lavori + CTA "Apri scheda".

**Tabella** (desktop default, opzionale mobile): DataTable con
`Cliente · Codice · Accordo · Prossimo lavoro · Saldo · Stato`; ordinabile; chip
di stato; azioni a hover (menù); modifica inline su luogo/accordo.

**Requisiti**: RF-SP-1 ricerca live; RF-SP-2 filtri+ordina; RF-SP-3 toggle vista
persistito; RF-SP-4 ＋ apre sheet "Nuovo cliente"; RF-SP-5 micro-indicatori
tappabili che portano alla vista filtrata pertinente.

### 6.2 Scheda cliente (`/cliente/:id`)
- **Hero**: back · Avatar grande · nome · codice decodificato · accordo badge ·
  contatti azionabili (Chiama/Email/Mappa) · menù (Modifica/Elimina).
- **Banda stat**: Saldo da incassare · Incassato · Lavori · Ore (color-coded).
- **Segmented sticky**: Panoramica · Lavori · Pagamenti · Ore · Spese.
  - *Panoramica*: feed attività + azioni rapide (＋Lavoro/Preventivo/Ore/Spesa) +
    riquadro "accordo & tariffa".
  - *Lavori*: lista con StatusChip, avatar operatore, cambia stato inline, ＋Lavoro.
  - *Pagamenti*: DataTable (origine, atteso, incassato, stato), **Registra incasso**,
    ＋Preventivo.
  - *Ore*: raggruppate per operatore (avatar teal) con totale e costo;
    **Genera compenso del mese** (incasso a ore); ＋Ore.
  - *Spese*: spese attribuite al cliente; ＋Spesa.
- **Requisiti**: RF-CL-1 tutte le sezioni leggono dati derivati live; RF-CL-2 ogni
  creazione è contestuale (cliente preselezionato); RF-CL-3 elimina con conferma.

### 6.3 Squadra (`/squadra`) e Operatore (`/operatore/:id`)
- **Squadra**: carte/tabella operatori → avatar teal, ruolo badge, tariffa, e per
  il mese: *ore · dovuto · pagato · da pagare* (badge ambra). Azioni: **Paga**,
  **Apri**. ＋ Nuovo operatore (sheet).
- **Scheda operatore**: hero (avatar, ruolo, tariffa, modifica) · banda stat
  (dovuto/pagato/saldo/ore) · sezioni: *Libro mastro* (ore per cliente, importi),
  *Compensi pagati* (lista + elimina), *Lavori assegnati*. Azione **Paga operatore**
  (sheet: importo predefinito = saldo, data, periodo, metodo, nota).
- **Requisiti**: RF-SQ-1 libroOperatore live; RF-SQ-2 statoCompenso calcolato;
  RF-SQ-3 pagamento riduce il saldo ovunque.

### 6.4 Soldi (`/soldi`)
- Header: selettore mese · riepilogo (Incassato · Uscite · Saldo · Da incassare ·
  Da pagare squadra), color-coded.
- **Movimenti**: registro unificato (incassi +, compensi −, spese −) con chip tipo,
  importi colorati, filtro per tipo, DataTable; azioni ＋Incasso/＋Spesa/＋Compenso.
- **Storico**: tabella mensile (atteso/incassato/uscite/saldo) + micro-barre CSS
  (incassato vs uscite).
- **Patrimonio**: attrezzi (DataTable, modifica inline, valore totale, ＋Attrezzo).
- **Requisiti**: RF-SO-1 uscite = spese + compensi; RF-SO-2 mese navigabile;
  RF-SO-3 movimenti filtrabili.

### 6.5 Agenda (`/agenda`)
- Settimana con navigazione (← oggi →); **mobile** = sezioni-giorno verticali con
  *oggi* evidenziato; filtro per operatore.
- Tocca giorno → sheet "Nuovo lavoro" (data precompilata). Tocca lavoro → sheet
  rapido: cambia stato, assegna operatore, ＋Ore, Apri cliente.
- **Requisiti**: RF-AG-1 lavori per data; RF-AG-2 stato ciclabile; RF-AG-3 azioni
  contestuali via sheet.

### 6.6 Creazioni (sheet responsivi)
Nuovo/Modifica per: Cliente, Lavoro, Preventivo, Ore, Spesa, Operatore, Incasso,
Compenso. Ogni sheet: titolo+sottotitolo, campi validati, default dal contesto,
azioni Annulla/Salva, toast di esito. Bottom-sheet su mobile, dialog su desktop.

---

## 7. Comportamenti mobile-first

- **BottomNav** fissa con safe-area; `＋` centrale prominente.
- **Sheet** dal basso con maniglia, snap, scroll interno, chiusura a trascinamento.
- Tabelle → su mobile diventano **liste di carte** o tabella con scroll orizz. e
  prima colonna fissa (scelta per superficie).
- Bersagli ≥ 44px; azioni primarie nella zona-pollice; sticky header di sezione.
- Animazioni: comparsa liste a cascata, pressione carte (scale), molla sui fogli,
  indicatore tab scorrevole; rispetto di `prefers-reduced-motion`.

---

## 8. Accessibilità & qualità
- Primitivi Radix per focus-trap, ruoli ARIA, tastiera (dialog, tabs, menu).
- Contrasto AA sui testi; focus-visible su tutti gli interattivi.
- `npm run build` (type-check) e `npm run lint` verdi a ogni fase.

---

## 9. Piano di implementazione a fasi

| Fase | Contenuto | Esito |
|---|---|---|
| **F0 — Fondamenta** | dipendenze, font, token & reset, motion presets, primitivi UI (Button, Field, Card, Badge/StatusChip, Avatar, Sheet, Tabs, DataTable, DropdownMenu, Tooltip, EmptyState, Toaster, BottomNav/SideRail/AppBar/Fab) | libreria UI pronta |
| **F1 — Dati** | estensione store/types (Operatore, CompensoOperatore, rename), selettori (libroOperatore, movimenti, riepilogoMese, feed), nuovo seed, migrate persist | dominio pronto |
| **F2 — Shell** | AppShell + BottomNav/SideRail + AppBar + routing + ricerca + foglio "Crea" + login | navigazione viva |
| **F3 — Spazio** | bacheca clienti (carte + tabella), filtri, espansione, micro-indicatori | home operativa |
| **F4 — Scheda cliente** | hero, banda stat, tab e sotto-viste, creazioni contestuali | hub cliente |
| **F5 — Squadra** | operatori (carte/tabella), scheda operatore, libro mastro, paga operatore | dimensione compensi |
| **F6 — Soldi** | movimenti, storico+micro-grafici, patrimonio | flusso denaro |
| **F7 — Agenda** | settimana/giorno, sheet lavoro | tempo |
| **F8 — Rifinitura** | animazioni, empty states, QA responsive, a11y, build/lint, README/docs, commit & push | progetto al 100% |

---

## 10. Definizione di "fatto"
1. Tutte le superfici di §6 realizzate, collegate e navigabili da mobile e desktop.
2. Operatori e compensi pienamente funzionanti (dovuto/pagato/saldo coerenti).
3. Tabelle stile Notion con stati/badge/icone, modifica inline e azioni.
4. Creazioni/modifiche via sheet responsivi per tutte le entità.
5. Color-coding per entità applicato ovunque; animazioni fluide; `prefers-reduced-motion`.
6. Nessuna traccia visiva del vecchio layout a nove pagine.
7. `npm run build` e `npm run lint` verdi; codice committato e pushato.
