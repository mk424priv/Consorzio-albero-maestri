# 08 — Architettura relazionale: lo strumento che conosce sé stesso

> **Stato:** 🟡 in approvazione. Documento di progettazione, non di implementazione.
> Si legge, si discute, si approva — poi si realizza per fasi (§9).
>
> **Rapporto col canone.** Questo documento **non sostituisce** 01–07: ne assume
> l'identità visiva attiva (05/06/07 «Officina digitale») e i flussi/psicologia
> degli stati (01). Aggiunge lo strato che il canone non ha ancora canonizzato:
> **come le entità si connettono, come il contesto si propaga, come la profondità
> si apre senza nuovi schermi, e come i dati restano integri** quando si crea, si
> registra, si modifica, si elimina e si annulla. Dove tocca il modello, il
> riferimento è il `types.ts` reale (greenfield), **non** le entità legacy della
> specifica 02 (vedi §1.3).

---

## Indice

- §0 — La tesi: *facciata invariata, funzione moltiplicata*
- §1 — Diagnosi dello stato attuale (cosa c'è, cosa manca)
- §2 — **Parte I · Infrastruttura e integrità dei dati** (creo / registro / modifico / elimino / annullo — correttamente)
- §3 — **Parte II · Il grafo relazionale** (tutto è una porta, il contesto si propaga)
- §4 — **Parte III · Componenti che fanno di più** (statistiche e azioni al tap, senza caos)
- §5 — **Parte IV · Scenari operativi non ancora coperti**
- §6 — **Parte V · Nuove superfici, minime e giustificate**
- §7 — Il principio anti-caos (non-proliferazione)
- §8 — Sintesi: la mappa delle relazioni a regime
- §9 — Piano di realizzazione per fasi (P0–P4)
- §10 — Decisioni aperte da confermare prima di partire

---

## §0 — La tesi

Oggi Albero Maestri è già un buon **taccuino che sa contare i soldi**: il motore
economico (`lavoro-calc`, `conti`, `codice-parlante`) è solido, derived-not-stored,
testato. Ma è ancora **un insieme di schermi che si guardano da lontano**: ogni
schermo sa fare la sua cosa, e quando passo a un altro devo ricominciare. Vedo un
lavoro ma non posso saltare al cliente. Apro il dettaglio di un debito ma non posso
riscuoterlo da lì. Cambio una tariffa e non so dove ha effetto. Elimino e ho 6
secondi per pentirmi, poi è perduto per sempre.

**La tesi di questo documento è una sola:**

> Non aggiungere schermi. Aggiungere **connessioni** e **profondità**.
> Lo stesso spazio visivo deve diventare un organismo dove ogni elemento è
> contemporaneamente **una porta** (mi porta all'entità collegata) e **un
> cruscotto** (al tocco rivela i suoi numeri e le sue azioni). La funzione cresce
> **in profondità, non in larghezza** — così l'occhio non vede mai più caos, ma la
> mano scopre che da ogni punto può fare tutto ciò che è naturale fare da lì.

Tre direttrici, in ordine di fondamento:

1. **Integrità** — i fatti non si corrompono mai. Creare, modificare, eliminare e
   annullare devono essere operazioni *reversibili e non distruttive del registro*.
   Questa è la base: senza di essa, ogni funzione in più è un rischio in più.
2. **Relazione** — ogni entità mostrata è raggiungibile e azionabile da dove la
   vedo. Il contesto del luogo di chiamata si propaga sempre.
3. **Profondità** — gli stessi componenti, al tap/long-press/swipe, aprono
   statistiche e azioni contestuali. Niente schermi nuovi per cose che possono
   vivere in un `Foglio`.

---

## §1 — Diagnosi dello stato attuale

### 1.1 Cosa funziona già (e va preservato)

- **Modello pulito** (`types.ts`): ogni entità ha `id` (ULID), `updatedAt`,
  tombstone `deleted?`. Cuciture sync già posate.
- **Derived-not-stored** rigoroso: codice parlante, totali, stati pagamento,
  riepiloghi — tutto ricalcolato a lettura (`lib/`). Il sistema non può
  desincronizzarsi internamente.
- **Cucitura repository** (`Repository` ⟶ `DexieRepository`): la UI parla con lo
  store, lo store col contratto. Sostituibile senza toccare schermi.
- **Ogni azione di dominio ritorna un `Annulla`** (`store/azioni.ts`) e le
  cancellazioni sono soft. Questa è la fondazione che rende *sicuro* mettere
  azioni rapide dappertutto.
- **Libreria di primitivi ricca** (`components/ui`): `Foglio` (bottom-sheet vaul a
  6 varianti tonali con drag-to-dismiss), `Segmented`, `Swipeable`, `StatTile`,
  `CardLavoro` con espansione inline, `Conferma`. E un primitivo **`ActionRow`
  (griglia di azioni) già pronto e mai usato**.

### 1.2 Le lacune, per categoria

| # | Lacuna | Tipo | Dove |
|---|---|---|---|
| L1 | Import = **sostituzione totale**, nessun merge; tombstone non caricati nello snapshot → impossibile fondere due dispositivi senza perdere dati | Infra/sync | `dexie-repository.ts:47`, `store.ts:53`, `backup.ts` |
| L2 | **Modifica lavoro = delete+recreate** di ore/spese/pagamenti → distrugge lo storico incassi (più incassi collassano in uno, si perde `dataIncasso`) | Infra/integrità | `bozza.ts:200-278` |
| L3 | **Undo solo per-azione** (toast 6 s). Oltre quella finestra, un soft-delete non è più ripristinabile da UI: nessun «cestino/archivio» | Infra/rollback | `undo.ts`, tutte le `azioni.ts` |
| L4 | **Bozza di creazione non persistita**: chiudo l'app a metà → perdo tutto | Infra/integrità | `bozza.ts` (Zustand in memoria) |
| L5 | **Integrità referenziale assente sull'eliminazione**: cancello un cliente/operaio → i lavori restano con `clienteId/partecipanti` orfani, risolti a `undefined` in UI | Infra/relazione | `azioni.ts:136-151` |
| L6 | **Cliente mai tappabile da un lavoro** (CardLavoro, Cantiere): salto all'operaio sì, al cliente mai | Relazione | `CardLavoro.tsx:93`, `Cantiere.tsx:54` |
| L7 | **Cantiere (dettaglio lavoro) non può incassare** né aprire le entità collegate (operai testo non-link) | Relazione | `Cantiere.tsx` |
| L8 | **Contesto data non propagato**: dal FAB e da un giorno dell'Agenda, `/nuovo` parte senza la data del giorno | Relazione | `Agenda.tsx:156`, `Layout.tsx:23` |
| L9 | **CreaLavoro torna sempre in Agenda**, anche in modifica da Cantiere; non offre «apri il lavoro creato» | Relazione | `CreaLavoro.tsx` |
| L10 | **Garage scollegato dal dominio**: attrezzi/veicoli non si legano a lavori né a spese; il CalcolatorePercorso produce un costo che non confluisce da nessuna parte; «benzina» nelle spese è testo libero | Relazione/scenario | `Garage.tsx`, `bozza.ts` spese |
| L11 | **«Io»/titolare non configurabile** da UI (solo nel seed); Impostazioni raggiungibile da un solo punto (⚙ in Rubrica) | Relazione/scenario | `Impostazioni.tsx`, `Anagrafiche.tsx:38` |
| L12 | **Operaio disattivato sparisce dalla Rubrica** (`attivo` filtrato) → la sua scheda non è più raggiungibile lì | Relazione | `Anagrafiche.tsx:18` |
| L13 | **Componenti ricchi usati come display**: `StatTile` non cliccabile, `Swipeable` una sola direzione, `Codice` non copiabile, `ActionRow` mai usato, chip operaio non mostra ore/compenso | Profondità | `components/ui/*` |
| L14 | **Scenari operativi non coperti**: spezza (parziale), storno/reso, riprogramma-con-ore, ricorrenti, «da quotare», archivio/ripristino | Scenario | — |
| L15 | **Nessuna vista «registro eventi» (Records/Movimenti)** né scadenze/promemoria sui pagamenti in ritardo | Scenario/superficie | — |
| L16 | **Modifica cliente distrugge il cognome** (appiattisce nome+cognome) | Integrità | `ClienteScheda.tsx:181` |
| L17 | **Contraddizione di canone su sovrapagamento** (§9.7 ammette credito; §10.1 E4 lo vieta) — da decidere | Decisione | canone 02 |

Le tre direttrici di §0 attaccano queste lacune in ordine: **Parte I** chiude
L1–L5, L16 (integrità); **Parte II** chiude L6–L12 (relazione); **Parte III**
chiude L13 (profondità); **Parte IV/V** chiudono L14–L15.

---

## §2 — Parte I · Infrastruttura e integrità dei dati

> Obiettivo: rendere **non distruttive e reversibili** tutte le operazioni sui
> fatti, e rendere il modello *fondibile* (sync-correct) anche prima del backend.

### 2.1 Un solo modo di modificare un fatto: *patch, mai delete+recreate*

**Problema (L2).** Salvare la modifica di un lavoro oggi cancella e ricrea ore,
spese e **pagamenti**. Per le ore e le spese è accettabile (sono input
materializzati). Per i **pagamenti** è una corruzione del registro: se un cliente
aveva pagato in tre acconti in date diverse, dopo una modifica del lavoro resta
**un solo** pagamento con una sola `dataIncasso`. Lo storico incassi è perduto.

**Regola canonica.** Il **registro dei pagamenti è sacro**: una modifica di lavoro
non lo tocca mai per ricrearlo. Si può solo:
- aggiornare l'`importoAtteso` dell'eventuale pagamento aperto se il lordo cambia;
- se il lordo scende sotto l'incassato, segnalare con un avviso (non cancellare
  silenziosamente l'incasso): è il caso «hai incassato più del nuovo importo» →
  rimanda alla policy sovrapagamento (§10, D1).

**Conseguenza tecnica.** `salvaBozza` (modifica) deve fare *reconcile*, non
*replace*, dei pagamenti. Le ore e le spese restano ricreabili, ma **conservando
l'`id`** quando possibile (così un futuro sync non le vede come «cancella+crea»
ma come «aggiorna»). In modifica, riusare gli `id` esistenti di `ore`/`spese`
quando la riga corrisponde, invece di generare ULID nuovi a ogni salvataggio.

### 2.2 La bozza vive su disco

**Problema (L4).** La bozza di creazione è uno store Zustand in memoria: navigare
via o chiudere l'app la perde. Il canone 01 esige l'opposto — «la forma non si
azzera mai, la sua bozza vive sopra lo stack» (01 §5).

**Regola.** La bozza si **persiste** (una riga dedicata in IndexedDB o
`localStorage`, chiave singola `bozza-corrente`). Alla riapertura dell'app, se
esiste una bozza non vuota e non salvata, l'utente trova un richiamo sobrio
(«Riprendi la registrazione iniziata»). La bozza si pulisce solo al salvataggio o
a un «Scarta» esplicito. Nessun lavoro a metà va mai perso.

### 2.3 Eliminare è archiviare: integrità referenziale e ripristino

**Problema (L3, L5).** Il soft-delete c'è, ma:
- l'undo dura 6 secondi e poi è irraggiungibile da UI (nessun cestino);
- eliminare un'entità con relazioni lascia i lavori orfani.

**Regole.**

1. **Distinzione netta Elimina vs Archivia** (già nel canone 02 §7 C.8, ora
   abilitata dal modello che *ha* `deleted`):
   - Entità **senza relazioni** (cliente/operaio/attrezzo senza lavori collegati):
     elimina = soft-delete diretto, undo via toast.
   - Entità **con relazioni** (cliente con lavori, operaio con ore/compensi):
     l'azione si chiama **Archivia**, non Elimina. L'entità sparisce dagli elenchi
     attivi ma **i conti restano coerenti** e l'entità è ripristinabile.
2. **Nessun orfano silenzioso.** Un lavoro il cui `clienteId` punta a un cliente
   archiviato/eliminato deve risolvere a un'etichetta esplicita **«Cliente
   archiviato»** (non `—` o stringa vuota), e da lì poter **ripristinare** il
   cliente. Stessa cosa per i partecipanti operai.
3. **Cestino / Archivio** (vedi §6.2): una superficie (dentro Impostazioni) che
   elenca tutto ciò che è `deleted=true`, raggruppato per tipo, con **Ripristina**.
   È il rollback durevole che oggi manca: l'undo a 6 s diventa la *scorciatoia*, il
   cestino la *rete di sicurezza*.

### 2.4 Sync-correttezza: dal *replace* al *merge*

**Problema (L1).** Oggi «Importa» **sostituisce tutto**. Per un singolo
dispositivo è un backup/restore corretto. Ma il canone promette il
multi-dispositivo (02 §1.3/§1.4), e con il replace **due telefoni non si possono
mai fondere**: l'ultimo import vince e cancella il resto. Inoltre `caricaTutto`
scarta i tombstone (`deleted`), quindi lo snapshot in memoria non sa cosa è stato
cancellato — informazione necessaria per fondere.

**Regole (anche senza backend, da subito).**

1. **Import in due modalità**: *Sostituisci* (l'attuale, per restore pulito) e
   **Unisci** (merge). Il merge è **last-write-wins per record su `updatedAt`**:
   per ogni `id`, vince la versione con `updatedAt` più recente; un tombstone più
   recente *cancella*, un record più recente *resuscita*. Deterministico,
   commutativo, idempotente — le proprietà che servono per un sync vero domani.
2. **I tombstone si conservano e si fondono.** Il repository deve poter caricare
   anche i record `deleted` quando serve fondere/esportare (lo snapshot UI continua
   a filtrarli per la visualizzazione; ma l'export e il merge li includono). Senza
   tombstone esportati, due dispositivi non possono propagare le cancellazioni.
3. **Orologio logico opzionale.** `updatedAt` è wall-clock: fragile con clock-skew
   tra dispositivi. Forward-note (non bloccante per v1): aggiungere un contatore
   monotòno per-record (`rev`) o un Lamport-stamp da incrementare a ogni `salva`,
   così il LWW non dipende dall'ora di sistema. Per ora `updatedAt` basta; va
   *previsto* il campo.
4. **Versione di backup forward-compatible.** `backup.ts` ha `versione: 1`.
   L'import deve tollerare versioni diverse e collezioni mancanti (già lo fa in
   parte) e **non perdere collezioni nuove** introdotte dopo (es. `attrezzi` non
   c'era in v1). Definire una funzione di migrazione del file di backup.

> Nota: nulla di questo richiede un server. È **igiene del modello** che rende il
> giorno-del-backend un *cambio di implementazione*, non una riscrittura. È
> esattamente la promessa della cucitura repository — qui la onoriamo davvero.

### 2.5 Coerenza degli snapshot di tariffa e dei «fatti-evento»

- **Snapshot tariffe** (cliente e operaio) sono già congelati alla creazione:
  corretto, va solo documentato come invariante UI («modificare la tariffa di un
  cliente **non** ricalcola i lavori passati; per ricalcolare si modifica il
  singolo lavoro»). Aggiungere, in modifica lavoro, la possibilità esplicita di
  **ri-agganciare** la tariffa corrente (oggi `tariffaModificata` esiste in bozza
  ma il flusso non è esposto chiaramente).
- **`creatoIl` su tutti i fatti-evento.** `RegistrazioneOre`, `Spesa`, `Pagamento`,
  `CompensoOperatore` non hanno `creatoIl` (solo `data`, che è la data
  *contabile*, non quella di inserimento). Per il registro eventi (§6.1) e per
  ordinare/auditare serve distinguere «quando è successo» da «quando l'ho
  scritto». Aggiungere `creatoIl` dove manca.
- **`metodo` di pagamento ha un campo proprio.** Oggi `incassaSubito` infila il
  metodo dentro `note` (`azioni.ts:106`). Dare a `Pagamento` un campo `metodo?`
  (come `CompensoOperatore`) ed evitare di sovraccaricare `note`.

### 2.6 Correzioni puntuali di integrità

- **L16 — modifica cliente non distrugge il cognome.** Lo sheet di modifica deve
  avere i campi `nome` e `cognome` separati (come la creazione), non un campo
  unico che azzera il cognome.
- **Eliminazione del titolare «io»: vietata** sempre (già parzialmente:
  `eliminaOperaio` rifiuta il titolare; va reso esplicito anche in UI, nascondendo
  l'azione invece di farla fallire in silenzio).

---

## §3 — Parte II · Il grafo relazionale

> Obiettivo: **ogni entità mostrata è una porta** verso il suo dettaglio, e **ogni
> contesto si propaga**. Nessun vicolo cieco: da dove vedo una cosa, posso fare
> tutto ciò che è naturale farci.

### 3.1 Il principio: *tutto cliccabile, tutto fluisce*

Promessa già scritta nel canone 01 §6 («Card → lavoro. Nome cliente → dossier.
Chip operaio → sua scheda. Nessun bottone separato 'dettagli'») ma **disattesa nel
codice**. La rendiamo legge:

| Dove vedo… | …devo poter saltare a | Stato oggi |
|---|---|---|
| Cliente su CardLavoro | scheda cliente | ❌ (L6) |
| Cliente su Cantiere | scheda cliente | ❌ (L7) |
| Cliente su riga lavoro (scheda operaio) | scheda cliente | ❌ |
| Operaio su Cantiere | scheda operaio | ❌ (L7) |
| Operaio su CardLavoro (chip) | scheda operaio | ✅ |
| Lavoro ovunque | scheda lavoro | ✅ |
| Blocco soldi / StatTile | drill-down (vedi §4) | ❌ (L13) |
| «Io» nelle Uscite (Soldi) | scheda operaio «io» | ❌ |

Tutte le ❌ diventano ✅. Il `codice parlante` continua a fare da *shared-element*
nelle transizioni (vola tra schermi) per dare la sensazione di continuità
dell'oggetto, non di salto.

### 3.2 Il contesto del luogo di chiamata si propaga *sempre*

Il FAB `＋` è «un'azione, un bottone, un senso» **che cattura il contesto** (01
§6). Oggi lo fa solo a metà. Lo completiamo:

| Apro «＋ / Nuovo lavoro» da… | Deve precompilare |
|---|---|
| un giorno dell'Agenda | **la data di quel giorno** (oggi: ❌ L8) |
| FAB globale su Agenda | la data «oggi» (esplicita) |
| scheda cliente | il cliente (✅ già) |
| scheda operaio | l'operaio + fase (✅ già) |
| Soldi | modalità incasso (Incasso Subito) |
| Cantiere (modifica) | il lavoro, **e al ritorno torna al Cantiere** (oggi: ❌ L9) |

**Ritorno coerente.** Dopo aver creato/modificato, l'utente torna **da dove è
partito**, non sempre in Agenda. In creazione, offrire l'azione «Apri il lavoro»
(come fa già Incasso Subito). Il principio: *la navigazione è un viaggio di andata
e ritorno, non un teletrasporto in Agenda*.

### 3.3 Azionare le entità collegate da dove sono

Raggiungere non basta: da dove vedo l'entità devo poter **agire**.

- **Cantiere diventa il vero centro di comando del lavoro.** Oltre a Modifica /
  Segna svolto / Riprogramma / Elimina (già presenti), deve poter: **Incassare**
  (l'azione più assente, L7), **Pagare gli operai** di quel lavoro, **Duplicare**
  il lavoro, e aprire cliente/operai. La scheda più dettagliata deve essere anche
  la più potente, non la più impotente.
- **Soldi → Uscite**: il riquadro «Io · cassa del mese» diventa navigabile alla
  scheda «io», e mostra **lo storico dei prelievi** del mese (oggi il prelievo
  sparisce senza traccia visibile).
- **Scheda cliente** acquisisce un blocco **«Squadra coinvolta»**: quali operai
  hanno lavorato per questo cliente e quante ore — derivabile, oggi assente.
- **Scheda operaio** acquisisce, per «io», l'azione **Preleva** in loco (oggi vive
  solo in Soldi).

### 3.4 Garage: da modulo isolato a parte del dominio

**Problema (L10).** Il Garage è un'isola: attrezzi e veicoli non parlano con
lavori e spese; il CalcolatorePercorso calcola un costo che evapora.

**Connessioni proposte** (in ordine di valore, tutte opzionali e non invasive):

1. **Spesa «benzina» → veicolo.** Quando in un lavoro aggiungo una spesa di
   categoria benzina/attrezzi, posso *opzionalmente* collegarla a un veicolo/
   attrezzo del Garage (`Spesa.attrezzoId?`). Così il Garage sa quanto è costato
   ogni mezzo, e il lavoro resta invariato se non lo collego.
2. **CalcolatorePercorso → spesa reale.** Il calcolo «km → litri → €» può, con un
   tap, **materializzarsi come Spesa** su un lavoro (oggi è solo una stima
   volatile). Chiude il cerchio: stima → fatto.
3. **Statistiche veicolo** (vedi §4): al tap su un mezzo, costo-carburante
   accumulato, €/km reale, totale speso — derivato dalle spese collegate.

Questo trasforma il Garage da vetrina 3D a **registro dei costi del mezzo**, senza
toccare gli schermi esistenti: le connessioni sono opzionali e progressive.

### 3.5 Rendere raggiungibile ciò che oggi sparisce

- **L12 — operai disattivati**: la Rubrica/Squadra deve avere un filtro
  «Attivi / Tutti» (come i clienti hanno gli stati), così una scheda non diventa
  irraggiungibile solo perché l'operaio è inattivo.
- **L11 — Impostazioni e «io»**: aggiungere accesso a Impostazioni da almeno un
  secondo punto coerente, e una sezione **«Io / titolare»** dove configurare nome,
  eventuale tariffa, e lo switch globale «conta le mie ore come costo». Oggi «io»
  esiste solo nel seed.

---

## §4 — Parte III · Componenti che fanno di più

> Obiettivo: **la stessa superficie, più profondità**. Al tap/long-press/swipe i
> componenti già presenti rivelano statistiche e azioni contestuali. Zero nuovi
> schermi: tutto atterra in un `Foglio`. Questa è la risposta diretta a «gli
> elementi devono avere funzioni più ampie senza creare caos».

La libreria ha **già** i mattoni; vanno solo attivati (L13).

### 4.1 `CardLavoro` — la card che si apre

La card ha **già** l'impalcatura di espansione inline (`motion height:auto`, usata
oggi solo per il mini-form «Incassa»). La riusiamo per due livelli:

- **Tap sul corpo** → resta «vai al Cantiere» (invariato).
- **Tap su un'icona «▾» / espansione** → pannello inline con i **numeri del
  lavoro** già calcolati in `calcoloLavoro`: lordo, costo collaboratori, spese,
  **netto/margine**, incassato/da incassare, ore per partecipante. Nessun viaggio:
  il dettaglio economico si apre dentro la lista.
- **Long-press** → `Foglio variante="dettaglio"` con **`ActionRow`** (oggi morto):
  *Modifica · Riprogramma · Duplica · Incassa · Paga operai · Archivia*. Tutte le
  azioni esistono già in `azioni.ts` con `Annulla`. È il «menu `⋯`» che il canone
  rimandava a dopo-v1 — qui lo realizziamo riusando un primitivo già scritto.

### 4.2 `StatTile` — la statistica che spiega sé stessa

Oggi è display puro, usata ovunque (Dashboard, scheda cliente, Soldi, scheda
operaio, Garage). Aggiungere un `onClick?` **opzionale** (default non-cliccabile,
zero regressioni) che apre un `Foglio` di **breakdown**:

- «Da incassare» → elenco dei lavori aperti che compongono il numero.
- «Ore» → ripartizione per mese / per cliente.
- «Margine» → scomposizione lordo − costi − spese.

Modifica minima, resa altissima: ogni numero diventa una porta verso *come è fatto*.

### 4.3 `Swipeable` — la seconda direzione

Oggi: una direzione (sinistra → Riscuoti). L'architettura `use-gesture` regge due
slot. Aggiungere **swipe-destra** con azione per-stato:

- lavoro programmato → **Segna svolto**;
- lavoro svolto non pagato → resta **Riscuoti** a sinistra; a destra **Riprogramma
  / Duplica**.

Gesto unico appreso una volta, coerente ovunque la card compaia (Agenda, Soldi,
schede). Tutto il dominio è pronto (`segnaSvolto`, `riprogramma`, undo incluso).

### 4.4 Micro-affordance ad alto rendimento

- **`Codice` tap-to-copy**: il gettone del codice parlante si copia al tap
  (feedback `StampVivo` sobrio). Coerente col mono «gettone».
- **Chip operaio → mini-Foglio**: oltre a navigare alla scheda, un long-press
  mostra **ore e compenso di quell'operaio su quel lavoro** (dati in
  `calc.partecipanti`), senza lasciare la card.
- **Avatar «cliente storico»**: già esiste (`AvatarStorico` + `StatePill`
  Storico); estenderlo a una soglia configurabile e mostrarlo coerentemente in
  tutte le liste (oggi solo in alcune).

### 4.5 Il contenitore universale: `Foglio` + `ActionRow`

Tutto ciò che sopra «si apre» atterra in `Foglio` (già a 6 varianti tonali per
intento: info/dettaglio/incasso/pagamento/creazione/pericolo). Le azioni
contestuali vivono in `ActionRow`. **Questo è il cuore del principio anti-caos**:
non creiamo schermi, *apriamo fogli*. Un foglio è effimero, tonalmente coerente
con l'intento, e si chiude con un drag. La densità funzionale esplode; la densità
visiva resta identica.

---

## §5 — Parte IV · Scenari operativi non ancora coperti

> Scenari reali del mestiere che oggi non hanno una risposta nel prodotto. Molti
> erano già previsti dal canone come «fuori-v1»: qui li riportiamo dentro con un
> design concreto.

### 5.1 «L'ho fatto a metà» — *Spezza* (canone 02 §6.12)

Un lavoro programmato è stato svolto solo in parte. Azione **Spezza**: la parte
fatta diventa un lavoro `svolto` (con le sue ore reali), e si genera
automaticamente un nuovo lavoro `programmato` «↳ resto» per la parte restante. Due
lavori indipendenti, un gesto solo. Reversibile (undo).

### 5.2 «Il cliente ha restituito / ho sbagliato l'incasso» — *Storno* (§9.7)

Ridurre un `importoIncassato` senza cancellare il pagamento (azione protetta,
long-press, conferma). Se scende a 0 → `dataIncasso=null`, stato torna
`in_attesa`. Risolve il pentimento sull'incasso, oggi impossibile se non
eliminando il record.

### 5.3 «Quante ore ci hai messo?» alla conversione (§5.3, §6.12)

Convertire programmato → svolto oggi è secco. Aggiungere il prompt sobrio «quante
ore?» (e, se preventivo, conferma prezzo) al momento della maturazione, così le
`RegistrazioneOre` nascono giuste senza un secondo passaggio.

### 5.4 «Lo faccio ogni settimana» — programmato ricorrente (§8.9)

Un lavoro programmato può ripetersi (settimanale/mensile). Generazione di N
occorrenze future come lavori indipendenti (non una serie magica): semplice,
prevedibile, ognuna modificabile/eliminabile da sola.

### 5.5 «Non so ancora quanto chiedere» — *da quotare* (01 §5)

Lavoro a ore senza tariffa cliente → stato **«da quotare»** invece di assumere 0.
Resta visibile come *in sospeso di prezzo* finché non assegno una tariffa, senza
inquinare i totali con uno zero finto.

### 5.6 «Mi ha pagato più del dovuto» — sovrapagamento (§9.7 vs §10.1 E4)

Contraddizione di canone da sciogliere (§10, D1). Proposta: **ammettere
l'eccedenza come credito del cliente**, mostrato sulla scheda cliente come saldo
negativo «a credito», scalabile dal prossimo lavoro. È più fedele alla realtà del
mestiere del divieto secco.

### 5.7 «Dove rimetto le mani» — archivio e ripristino

Già in §2.3: ogni entità archiviata è ripristinabile dal Cestino. Lo scenario
«ho archiviato il cliente sbagliato» ha finalmente una risposta.

### 5.8 «Chi mi deve, da quanto» — scadenze e ritardi

I pagamenti hanno già `dataScadenza` e uno stato `in_ritardo` derivato, ma non
sono mai messi in evidenza. Scenario «Bianchi non paga da 40 giorni» → vedi §6.3
(promemoria), con la gradazione di urgenza già prevista dal canone (06 §3:
scaduto = rosso più vivo + pulse).

---

## §6 — Parte V · Nuove superfici, minime e giustificate

> Regola d'oro (§7): **nessuna nuova tab**, nessuno schermo che si possa evitare.
> Le superfici qui sotto sono o *fogli* o *sezioni dentro schermi esistenti*. Sono
> elencate perché aggiungono funzione, non perché aggiungono navigazione.

### 6.1 Registro eventi — *Records / Movimenti* (canone 02 §9.5)

Una vista (raggiungibile come *sezione* dalla Dashboard, non come nuova tab) che
elenca i **fatti-evento** in ordine cronologico — incassi (+), compensi/prelievi
(−), spese — con filtri (periodo, cliente, operaio, modo, stato, fase). È il
«libro mastro» che oggi manca: l'utente vede *cosa è successo*, non solo gli
aggregati. Richiede `creatoIl` sui fatti (§2.5). Alto valore, costo contenuto: i
dati esistono già tutti.

### 6.2 Cestino / Archivio (rete di sicurezza)

Sezione dentro Impostazioni: elenco di tutto ciò che è `deleted=true`, per tipo,
con **Ripristina** e **Elimina definitivamente** (hard-delete reale, l'unico punto
dove avviene). È il completamento di §2.3 e la base del rollback durevole.

### 6.3 Promemoria / scadenze (sezione, non schermo)

Un blocco — in cima a Soldi o in Agenda — «In ritardo»: i pagamenti scaduti e i
programmati non svolti oltre la data, con azione rapida (Riscuoti / Riprogramma).
Trasforma l'app da registro passivo a **strumento che ti ricorda**. Nessuna
notifica push (fuori-v1): solo evidenza in-app.

### 6.4 «Io / titolare» in Impostazioni (§3.5)

La configurazione del titolare e dei default globali. Piccola, ma chiude la lacuna
«io non è configurabile» (L11).

### 6.5 *(Opzionale, da decidere — §10 D2)* Preventivo leggero

Il greenfield ha eliminato l'entità `Preventivo`. Se serve davvero la coppia
acconto/saldo come *documento*, si reintroduce come entità leggera collegata al
lavoro. **Raccomandazione: rimandare** finché non emerge il bisogno reale — oggi
`modo="preventivo"` + pagamenti coprono il 90% dei casi.

---

## §7 — Il principio anti-caos (non-proliferazione)

Tutto il documento obbedisce a una disciplina, perché «funzionalità in più» non
diventi «confusione in più»:

1. **La funzione cresce in profondità, non in larghezza.** Niente nuove tab
   (restano 5). Le novità vivono in *fogli*, *espansioni inline* e *sezioni* di
   schermi esistenti.
2. **Una superficie, molte profondità.** Lo stesso componente fa display di
   default e rivela azioni/statistiche al tap/long-press/swipe. L'utente che non
   cerca la profondità non la incontra: nessuna regressione di semplicità.
3. **Un gesto, ovunque.** Lo swipe e il long-press significano la stessa cosa su
   ogni card, in ogni schermo. Imparato una volta, posseduto ovunque.
4. **Ogni apertura è effimera.** I fogli si chiudono con un drag; non sono schermi
   in cui «entrare». La mappa mentale dell'app resta a 5 luoghi.
5. **Coerenza tonale per intento.** Le 6 varianti di `Foglio` codificano già
   l'intento col colore (incasso/pagamento/pericolo…): la profondità è leggibile a
   colpo d'occhio, non disorientante.

Risultato: a fine lavoro, **lo screenshot dell'app sembra quasi lo stesso**. Ma in
mano è un altro strumento — da ogni punto si vede tutto il collegato e si fa ogni
azione naturale.

---

## §8 — Sintesi: la mappa delle relazioni a regime

```
                         ┌─────────────┐
            ┌────────────│   CLIENTE   │◀───────────┐
            │            └──────┬──────┘            │
            │ (porta+azioni)    │ 1—N               │ codice parlante
            │                   ▼                   │ (derivato, vola
     ┌──────┴──────┐     ┌─────────────┐            │  come shared-elem)
     │    SOLDI    │◀────│   LAVORO    │────────────┘
     │ incassi/    │ N—1 └──┬───┬───┬──┘
     │ prelievi/   │        │   │   │ N—N
     │ scadenze    │   ore  │   │   │   ┌─────────────┐
     └──────┬──────┘  spese │   │   └──▶│   OPERAIO   │
            │               │   │       │ ore/compensi│
            │ movimenti     │   │ spesa │ (io ≠ costo)│
            ▼               ▼   │ benzina└─────────────┘
     ┌─────────────┐  ┌────────┐│       ┌─────────────┐
     │  RECORDS /  │  │ SPESA  │└──────▶│   GARAGE    │
     │  MOVIMENTI  │  └────────┘ attrezzoId │ veicoli/    │
     └─────────────┘             (opz.)  │ attrezzi    │
                                         │ €/km reale  │
     ┌─────────────┐                     └─────────────┘
     │  CESTINO /  │  ← ripristino di qualsiasi entità deleted
     │  ARCHIVIO   │
     └─────────────┘
```

Ogni freccia è **bidirezionale come navigazione** (da A vedo B e ci salto) e
**propagante come contesto** (da A creo qualcosa precompilato con A). Ogni nodo è
**porta + cruscotto + centro-azioni**.

---

## §9 — Piano di realizzazione per fasi

Ordine guidato dal fondamento: prima l'integrità (senza cui il resto è rischioso),
poi le relazioni, poi la profondità, infine gli scenari e le superfici. Ogni fase
è autonoma, `build` verde, commit a tappa.

### P0 · Integrità e sicurezza dei dati *(fondamenta — Parte I)*
- Patch-not-replace dei pagamenti in modifica lavoro (L2); riuso `id` ore/spese.
- Persistenza della bozza (L4) + richiamo «riprendi».
- Fix modifica cliente / cognome (L16).
- `creatoIl` sui fatti-evento + `metodo` proprio su `Pagamento` (§2.5).
- **DoD:** modificare un lavoro con 3 incassi non perde lo storico; chiudere e
  riaprire l'app conserva la bozza; build+test verdi.

### P1 · Grafo relazionale e propagazione contesto *(Parte II)*
- Cliente tappabile da CardLavoro / Cantiere / righe operaio (L6, L7).
- Operai tappabili in Cantiere; Cantiere può Incassare/Pagare/Duplicare (L7).
- Propagazione data dal giorno/FAB; ritorno coerente post-creazione (L8, L9).
- Filtro Attivi/Tutti in Rubrica; «io» configurabile + 2° accesso Impostazioni
  (L11, L12).
- **DoD:** da qualsiasi lavoro raggiungo cliente e operai in 1 tap; nessun vicolo
  cieco nella tabella §3.1.

### P2 · Archivio, ripristino e sync-correttezza *(Parte I, completamento)*
- Elimina vs Archivia con integrità referenziale + etichette «archiviato» (L5).
- Cestino/Archivio con Ripristina + hard-delete (§6.2).
- Import «Unisci» (merge LWW) + tombstone esportati; migrazione backup (L1).
- **DoD:** archiviare un cliente non rompe i conti ed è ripristinabile; fondere due
  export non perde dati.

### P3 · Componenti che fanno di più *(Parte III)*
- `CardLavoro` espandibile (statistiche inline) + long-press → `Foglio`+`ActionRow`.
- `StatTile.onClick` opzionale → breakdown.
- `Swipeable` seconda direzione; `Codice` tap-to-copy; chip operaio → mini-foglio.
- **DoD:** ogni numero-chiave si apre in breakdown; il menu contestuale copre
  Modifica/Riprogramma/Duplica/Incassa/Paga/Archivia; nessun nuovo schermo.

### P4 · Scenari e superfici *(Parte IV/V)*
- Spezza, Storno, «quante ore?» alla conversione, da quotare, ricorrenti.
- Records/Movimenti (sezione Dashboard) + Promemoria/scadenze.
- Garage collegato (spesa→veicolo, calcolatore→spesa, statistiche mezzo).
- **DoD:** i 7 scenari §5 hanno una risposta in-app; Records elenca i fatti con
  filtri; il Garage mostra €/km reale.

> Le fasi sono indipendenti: si possono approvare e realizzare anche in ordine
> diverso. **P0 è non negoziabile come prima fase**: è la rete sotto tutto il resto.

---

## §10 — Decisioni aperte da confermare prima di partire

| # | Decisione | Opzioni | Raccomandazione |
|---|---|---|---|
| **D1** | Sovrapagamento (contraddizione canone §9.7 ↔ §10.1 E4) | (a) credito cliente · (b) vietato per costruzione | **(a) credito** — più fedele al mestiere |
| **D2** | Reintrodurre `Preventivo` (acconto/saldo come documento)? | (a) ora · (b) rimandare · (c) mai | **(b) rimandare** finché non serve davvero |
| **D3** | Profondità del merge in v1 | (a) solo import «Unisci» locale · (b) anche `rev` logico già ora | **(a)** ora, **(b)** come campo previsto non ancora usato |
| **D4** | Records/Movimenti e Promemoria: sezioni o tab? | (a) sezioni dentro schermi esistenti · (b) nuove voci | **(a) sezioni** — coerente con §7 |
| **D5** | Garage: quanto integrarlo? | (a) solo spesa→veicolo · (b) anche calcolatore→spesa + statistiche | **(b)** se P4 ha respiro; (a) come minimo |
| **D6** | Long-press vs icona «⋯» per il menu contestuale | (a) long-press · (b) icona visibile · (c) entrambi | **(c)** — long-press per esperti, icona per scopribilità |

---

### Chiusura

Niente in questo documento richiede un backend, una nuova tab, o una rivoluzione
visiva. Tutto poggia su ciò che **esiste già**: un modello pulito con cuciture
sync, azioni con undo, e una libreria di primitivi più ricca di quanto la usiamo.
Il salto non è «più funzioni»: è **far conoscere all'app sé stessa** — le sue
relazioni, la sua profondità, la sua memoria. Da strumento che *registra* a
strumento che *capisce ciò che gli dici e ti lascia agire da qualunque punto*.
```
