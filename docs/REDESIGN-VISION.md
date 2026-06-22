# Redesign 3.0 — Visione & costruzione UX/UI
### Non "campi in colonna", ma finestre-scena individuali

> Documento di ispirazione **operativa**: non l'atmosfera, ma *come* costruisco
> e compongo i blocchi. È la guida che la realizzazione segue alla lettera.

---

## 0. Il difetto da superare

Finora ogni modale era la stessa cosa: intestazione colorata + campi impilati.
Cambiava la tinta, non la **struttura**. Il risultato: tutto si somiglia.

La svolta: ogni finestra di inserimento diventa una **scena progettata**, con
una **composizione a due zone** e un **protagonista** diverso a seconda del dato
che cattura. Inserire un cliente ≠ segnare ore ≠ pagare un operatore: tre azioni
diverse → tre finestre diverse.

---

## 1. L'architettura della modale: "Scena" (2 zone)

Ogni modale di creazione è costruita su due zone, non su una lista di campi.

```
DESKTOP (≥ lg)                          MOBILE
┌───────────┬────────────────────┐      ┌────────────────────┐
│  ASIDE    │   FORM              │      │  SCENA (banner)     │
│  (scena)  │   (campi rilevanti) │      │  preview viva       │
│           │                     │      ├────────────────────┤
│ • tinta   │  blocchi composti   │      │  FORM               │
│ • motivo  │  in griglia, non    │      │  (campi rilevanti)  │
│ • preview │  in colonna piatta  │      │                     │
│ • copy    │                     │      │                     │
└───────────┴────────────────────┘      └────────────────────┘
```

- **ASIDE (zona-scena)**: pannello colorato con gradiente d'entità, texture,
  filigrana grande e — soprattutto — una **anteprima viva** del record che stai
  creando (biglietto cliente, badge operatore, ricevuta, contatore ore…). È la
  parte "presentazionale". Su mobile diventa un banner in alto.
- **FORM (zona-input)**: i campi *rilevanti per quel dato*, composti in griglia
  (non sempre uno sotto l'altro), con il **protagonista** in evidenza.

---

## 2. Concept per ogni finestra (protagonista + composizione)

| Finestra | Protagonista | Anteprima/scena | Composizione form |
|---|---|---|---|
| **Cliente** | biglietto da visita vivo | avatar + codice `XX-00-00-00` + accordo che si aggiornano mentre scrivi | nome/cognome in coppia, contatti in coppia, accordo a tessere, tariffa |
| **Operatore** | badge identità | avatar teal + ruolo + tariffa | ruolo a tessere (corona/persona), tariffa+telefono in coppia |
| **Lavoro** | giornata d'agenda | mini-day con data grande + cliente | cliente a chip, titolo, data rapida, tipo a tessere, operatore a chip |
| **Ore** | **contatore gigante** | "orologio" con le ore correnti enormi | stepper protagonista, cliente/operatore a chip, giorno rapido |
| **Preventivo** | **ricevuta dal vivo** | foglietto che mostra Totale → Acconto/Saldo | cliente, formato a 2 tessere, importo a tastierino, date |
| **Incasso** | banconota in entrata | freccia ↘ + importo grande verde | cliente, importo a **tastierino**, scadenza |
| **Compenso** | **barra di estinzione debito** | gauge che si riempie pagando | operatore a chip, saldo, importo a tastierino + "Salda tutto", metodo |
| **Spesa** | scontrino | categoria illustrata + importo | categoria a tessere illustrate, importo a **tastierino**, data, cliente |
| **Attrezzo** | scheda attrezzo | icona attrezzo + stato | nome, costo a tastierino, data, stato a tessere |

**Tastierino numerico (NumberPad)** = il nuovo modo di inserire importi/ore:
tattile, da "cassa", con tasti grandi, virgola e cancella. Niente più digitare
in un campo sottile. È il cuore gamificato delle finestre economiche.

---

## 3. Sistema di design (token unici)

### 3.1 Tipografia (font diversi, gerarchia forte)
- **Display** — *Space Grotesk*: titoli, numeri grandi, importi, contatori.
  Carattere geometrico, "tech", dà personalità.
- **Testo** — *Plus Jakarta Sans*: corpo, etichette, campi.
- **Mono** — *JetBrains Mono*: codice parlante.
- Scala display: 40/32/26/22; testo: 15/13/12; numeri-eroe fino a 44px.

### 3.2 Colore — gerarchia tonale per entità (già ampia 50→700)
Cliente smeraldo · Operatore teal · Lavoro viola · Preventivo azzurro ·
Entrata verde · Uscita ambra · Spesa rosa · Patrimonio pietra. Ogni entità usa
la sua famiglia per avatar, accenti, gauge, gradienti, tessere selezionate.

### 3.3 Forma & spazio
Raggi 10/14/18/26/32. Ombre sm/md/lg + glow d'entità. Vetro (blur) su barre e
scene. Densità compatta. Bordi sottili `line`; superfici `surface`.

### 3.4 Movimento (sistema)
- Ingresso modale: scena scorre da sinistra (desktop) / sale (mobile); campi a
  cascata. Niente "scale" che fa zoom.
- Micro: tessere e chip reagiscono con colore + lieve sollevamento; tasti del
  pad con pressione (translate); numeri animati (NumberFlow).
- Ricompensa: coriandoli (canvas-confetti) al salvataggio, tema d'entità; doppio
  scoppio per i pagamenti.
- Gauge/anelli/sparkline si "disegnano" all'apparire.

### 3.5 Iconografia
Lucide come base, ma **usata con intenzione**: icona-filigrana grande nella
scena, icone nelle tessere (corona/persona, fuel/box/wrench/tag, banca/portafogli),
motivi diversi (dots/grid/rings/diagonal) come texture per distinguere i tipi.

---

## 4. Le carte (lavorate in dettaglio)

- **Carta cliente** (Spazio): biglietto con avatar, codice, 3 micro-stat dal
  codice, **barra "incassato vs atteso"**, prossimo lavoro con avatar operatore,
  azioni rapide, espansione con ultimi movimenti. Gerarchia chiara: nome > codice
  > saldo > resto.
- **Carta operatore** (Squadra): badge con avatar, ruolo, tariffa, mini-stat
  (ore/dovuto/pagato), **barra "% saldato"**, stato compenso, azioni.
- **Righe-movimento / lavoro / pagamento**: icona d'entità a sinistra, gerarchia
  titolo/sottotitolo, importo o badge a destra, azioni a hover/menu.

---

## 5. Dashboard (ogni dato una forma)
Numeri animati ovunque; anello % (incassi, saldo squadra); donut composizione
movimenti; sparkline andamento; barre comparate; schede con striscia d'accento.
Mai quattro scatole identiche: un dato-primario grande + secondari diversi.

---

## 6. Piano di realizzazione (in ordine)
1. **Token & font**: Space Grotesk display, variabili, classi `.font-display`.
2. **Sheet "Scena"**: layout a 2 zone (aside+form) desktop / stacked mobile.
3. **NumberPad / AmountPad**: tastierino e importo-eroe.
4. **9 modali** ridisegnate con scena + composizione + protagonista dedicati.
5. **Carte** cliente/operatore rilavorate nel dettaglio.
6. **Rifinitura**: animazioni, coriandoli, QA, build/lint, deploy.

> Esito atteso: aprire una finestra qualsiasi e percepire un *prodotto disegnato
> apposta per quel dato*, non un modulo.
