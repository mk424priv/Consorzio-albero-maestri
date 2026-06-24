# 09 — Specifica operativa per blocchi di lavoro

> Documento **derivato dal canone**, non sostitutivo. È lo strato *azionabile*: traduce
> visione (01), specifica (02) e architettura relazionale (08) in **blocchi di lavoro
> autonomi**, ciascuno formulato come un singolo prompt completo da affidare a un agente.
> Dove questo documento divergesse dal canone, **vince il canone**.

---

## 0. Filosofia della specifica (come è scritta, e perché)

Questa specifica segue una sola regola: **si dichiara il bisogno e il comportamento, non
lo schema dati.**

- Si dice all'agente **COSA** serve, **PERCHÉ** (quale bisogno dell'utente chiude) e
  **quale comportamento** deve risultare.
- **NON** si dettano tabelle, nomi di colonne, tipi o migrazioni DB. L'agente legge il
  codice reale: è l'unico a sapere cosa esiste già e a poter scegliere la struttura
  migliore senza creare duplicati o conflitti.

Conseguenza pratica: ogni blocco elenca un **«Fuori ambito»** che dice cosa *non*
reinventare, perché esiste già o perché è derivato e non va salvato. Questo è il vero
valore della specifica — non istruire l'agente *come* costruire, ma evitargli di sbagliare
*dove il codice attuale lo contraddirebbe*.

### Ordine di esecuzione

I blocchi vanno eseguiti in sequenza: ognuno poggia sul precedente.

```
Blocco 0 (dominio)  →  Blocco 1 (persistenza)  →  Blocco 2 (creazione)  →  Blocco 3 (lettura)
                                                                          ┊
                                          Blocco E (pannello cliente) — EPIC separato, fuori canone v1
```

### Come si usa un blocco

Ogni blocco è autonomo. Per affidarlo a un agente: **anteporre il «Contesto comune»**
(§1) al testo del blocco. Il resto del blocco è già un prompt completo, con criteri di
accettazione verificabili.

---

## 1. Contesto comune (invarianti — da anteporre a OGNI blocco)

```
App «Albero Maestri»: PWA local-first (Vite + React 19 + TS + Tailwind v4), dati in
IndexedDB via Dexie. Single-user: un solo Operatore `ruolo:"titolare"` = «io».
Nessun backend, nessun login in v1. Fonte di verità = canone/ (01 visione, 02 specifica,
08 design + 08-architettura-relazionale). Dove il codice diverge dal canone, vince il canone.

Architettura da rispettare:
- Derived-not-stored: codice parlante, totali, stati pagamento si RICALCOLANO alla lettura
  in src/lib/. Il DB salva solo fatti-evento. NON salvare valori derivati.
- Cucitura repository: UI → store Zustand → Repository (Dexie). La UI non parla con Dexie.
- Sync-ready: ogni record ha id (ULID), updatedAt, rev?, deleted? (tombstone). Ogni scrittura
  passa da store.salva() che aggiorna updatedAt/rev. Non toccarli a mano altrove.
- Pagamento = «registro sacro» (patch-not-replace): in modifica si aggiorna solo
  importoAtteso; importoIncassato/dataIncasso/metodo si preservano (vedi src/store/bozza.ts).

Stile (canone 08): solo token @theme e primitivi src/components/ui/* (Segmented, Field,
CampoFacolt, Card, Foglio, Badge, StatePill…). Niente colori hard-coded, niente bordi per
separare (usa elevazione/superficie/tono). Colore = stato, non decoro. Mobile-first.
«Profondità, non larghezza»: niente nuove tab/schermi.

Metodo di lavoro: prima spiega il piano e i trade-off, poi implementa. Progetta TU la
struttura dati: verifica cosa esiste già e riusalo, non dettare lo schema dall'esterno.

Regola d'oro: NON rompere ciò che funziona (Agenda, creazione, calcolo conti, backup/merge,
cestino). A fine lavoro `npm run build` e `npm test` DEVONO passare.
```

---

## Blocco 0 — Modello dati & dominio

**Razionale.** Introdurre nel dominio **solo i fatti realmente mancanti** — la fascia di
giornata e il ciclo di vita del preventivo — come concetti, lasciando all'agente la scelta
della struttura. Tutto il resto richiesto in passato (prezzo, data, luogo, stato pagamento)
**esiste già** o è derivato: va riusato, non duplicato.

**Ambito & file.** `src/lib/types.ts`, `src/lib/dominio.ts`, `src/lib/lavoro-calc.ts`,
`src/data/seed.ts`, test in `src/lib/*.test.ts`.

**Requisiti.**

1. **Fascia di giornata** (nuovo). Concetto: un lavoro può essere collocato come *giornata
   intera*, *mattina*, *pomeriggio*, oppure a *orario preciso*. L'orario preciso deve
   continuare a usare i campi tempo esistenti (`oraInizio`/`oraFine`); le fasce grossolane
   servono alla pianificazione rapida e al raggruppamento (Blocco 3) e al futuro pannello
   cliente (Blocco E). Aggiungere etichette leggibili.
2. **Ciclo di vita del preventivo** (nuovo). Concetto: quando un lavoro è a preventivo, ha
   uno stato che evolve — *da fare → inviato → accettato* (più *rifiutato*). Collega al
   canone 08-architettura §9 «da quotare». «A consuntivo / nessun preventivo» **non è un
   nuovo stato**: corrisponde al lavoro non-a-preventivo, già rappresentabile.
3. **Metodo di pagamento** (estendere, non duplicare). Servono più opzioni di metodo
   (oltre a contanti/bonifico): es. carta, assegno. Estendere l'enum esistente del metodo,
   che vive già sull'entità Pagamento. Aggiornare le etichette.
4. **Seed & test.** Valorizzare i nuovi concetti in `src/data/seed.ts` con esempi
   realistici. Aggiungere/adeguare test minimi se si tocca logica derivata.

**Fuori ambito (NON fare).**

- NON creare campi nuovi per cose esistenti: prezzo, data, luogo (su lavoro **e** cliente),
  orario sono già presenti — verificali e riusali.
- NON aggiungere uno «stato pagamento» salvato: gli stati di incasso sono **derivati** dalle
  somme e si ricalcolano alla lettura.
- NON aggiungere un campo «tempistica pagamento»: «pagato ora» = incasso alla creazione;
  «a scadenza/programmato» = data di scadenza già esprimibile sul Pagamento. Sarà esposto in
  UI (Blocco 2), non modellato di nuovo.
- NON aggiungere un campo «metodo di pagamento» sul lavoro: il metodo appartiene al Pagamento.

**Criteri di accettazione.**

- `tsc -b` passa; i nuovi concetti sono opzionali e retrocompatibili con dati e backup esistenti.
- Il seed mostra fascia e stato preventivo; nessun valore derivato viene salvato.
- I nuovi metodi di pagamento sono disponibili con etichette corrette.

---

## Blocco 1 — Persistenza, store, bozza, backup

**Razionale.** Far **fluire** i fatti nuovi del Blocco 0 lungo tutto il ciclo di vita —
creazione, ricarica, modifica, esportazione, fusione (merge) — senza intaccare l'integrità
del registro dei pagamenti.

**Ambito & file.** `src/db/dexie-repository.ts`, `src/store/store.ts`, `src/store/bozza.ts`,
`src/lib/backup.ts`.

**Requisiti.**

1. **Persistenza.** Garantire che i campi nuovi sopravvivano al round-trip salva → ricarica.
   (Sono attributi non indicizzati: tipicamente nessuna migrazione di schema è necessaria —
   confermarlo nel piano.)
2. **Bozza (draft).** Includere fascia, stato preventivo e luogo del lavoro nella bozza
   persistita, così sopravvivono alla chiusura dell'app a metà compilazione. Mappare
   correttamente bozza → lavoro in creazione e lavoro → bozza in modifica.
3. **Merge (LWW).** Verificare che i campi nuovi viaggino nella fusione last-write-wins
   (`fondi()`): essendo parte del record sono inclusi automaticamente — aggiungere un test
   che lo dimostri (un campo nuovo non si perde dopo un merge).
4. **Esporta / Importa / Unisci.** I campi nuovi devono sopravvivere a export → import e a
   unisci.

**Fuori ambito (NON fare).**

- NON modificare la semantica patch-not-replace dei pagamenti: in modifica si aggiorna solo
  l'importo atteso, mai si riscrivono incassi/date/metodo.
- NON aggiungere indici o strutture «per ottimizzare» se non strettamente necessari ora.

**Criteri di accettazione.**

- crea → ricarica → modifica preserva i campi nuovi.
- Un test di merge dimostra che i campi nuovi non si perdono.
- Pagamenti invariati dopo una modifica del lavoro. `build` e `test` passano.

---

## Blocco 2 — Creazione compatta («Nuovo lavoro»)

**Razionale.** L'utente compila dal campo, spesso con una mano e poca connessione. Il
bisogno è **compilazione rapidissima, minimo scroll**: i campi primari devono stare (quasi)
tutti in una schermata su iPhone, con selettori rapidi per i nuovi concetti.

**Ambito & file.** `src/pages/CreaLavoro.tsx` (è una **pagina** su rotta `/nuovo`, non un
modale). Primitivi: `src/components/ui/Segmented.tsx`, `Field.tsx`, `CampoFacolt.tsx`,
`Foglio.tsx`. Prerequisito: Blocchi 0 e 1.

**Requisiti.**

1. **Densità.** Ridurre padding verticali, altezze input e spazio label↔campo; ridurre
   l'altezza della textarea «Descrizione» (resti comunque comoda da compilare). Mantenere
   leggibilità e token canone 08.
2. **Due colonne per i campi brevi.** Affiancare i campi corti: *Data | Fascia*; *Ora inizio
   | Ora fine* (visibili solo a fascia = orario). Il selettore «modo di calcolo» resta a
   larghezza piena.
3. **Selettori rapidi (riusare i primitivi esistenti, niente componenti nuovi pesanti):**
   - **Fascia**: controllo segmentato Giornata · Mattina · Pomeriggio · Orario; «Orario»
     rivela la riga delle ore.
   - **Stato preventivo**: visibile solo quando il lavoro è a preventivo — chip Da fare ·
     Inviato · Accettato.
   - **Metodo di pagamento**: nella sezione incasso, chip Contanti · Bonifico · Carta ·
     Assegno · Altro — scrive sul Pagamento, non sul lavoro.
   - **Tempistica incasso**: con «Da incassare»/«Parziale», scelta rapida opzionale della
     scadenza (Oggi / Fine lavoro / Data…) → data di scadenza del Pagamento. Nessun campo
     modello nuovo.
   - **Luogo del lavoro**: campo opzionale precompilato dal luogo del cliente scelto e
     sovrascrivibile per il singolo intervento.
4. **CTA ancorate.** «Annulla / Salva» sempre visibili in basso (sticky, sopra la safe-area);
   il corpo scrolla sotto.
5. **Coerenza create/edit.** Tutti i campi nuovi vengono salvati e ricompaiono precompilati
   in modifica.

**Fuori ambito (NON fare).**

- NON rompere i rami condizionali esistenti (preventivo / ore / giornate / totale), il
  calcolo Lordo/Stima, le sub-view «Scegli cliente» / «Scegli operaio», la bozza persistita.
- NON introdurre una libreria UI nuova: bastano i primitivi esistenti.

**Criteri di accettazione.**

- Su iPhone i campi primari stanno (quasi) in una schermata; lo scroll è minimo.
- I selettori nuovi funzionano in creazione **e** in modifica.
- Le CTA restano sempre visibili. `build` e `test` passano.

---

## Blocco 3 — Lettura, raggruppamenti, filtri

**Razionale.** Molto valore è già nel dato ma **invisibile** (il luogo esiste sul lavoro ma
non si mostra). Il bisogno: rendere visibile e navigabile ciò che c'è, e dare modi di
raggruppare/filtrare gli interventi — **in profondità, senza nuove tab** (canone
08-architettura §7).

**Ambito & file.** `src/components/CardLavoro.tsx`, `src/pages/Agenda.tsx`,
`src/pages/Dashboard.tsx`, `src/pages/Anagrafiche.tsx`; derivati in `src/lib/conti.ts`.
Prerequisito: Blocchi 0–2.

**Requisiti.**

1. **Card più informativa.** Sulla card del lavoro mostrare il luogo (se presente), un badge
   per la fascia (Mattina/Pomeriggio/Giornata) e, per i lavori a preventivo, lo stato del
   preventivo. Tono = stato (canone 08: colore = dato, non decoro).
2. **Raggruppamento in Agenda.** Aggiungere un controllo «Raggruppa per»: Data (default
   attuale) · Luogo · Cliente · Prezzo. Il default resta per giorno; gli altri riusano la
   stessa lista cambiando solo chiave e intestazioni di gruppo. Nessuna nuova schermata.
3. **Filtri estesi.** Riusare la barra a chip esistente (Tutto / Da fare / Da incassare /
   Pagati) aggiungendo filtro per luogo (zona) e per stato preventivo. Compatti, a scorrimento
   orizzontale.
4. **Ordinamenti** dove c'è il raggruppamento: data ↑/↓, prezzo ↑/↓, luogo A–Z, cliente A–Z.
5. **Profondità (canone P3).** Tap su luogo/cliente nella card → scheda/foglio relativo:
   riusare il pattern dei «porti» già presente (contesto che si propaga), non inventarne uno
   nuovo.
6. **«Clienti per luogo».** Realizzarla come **modalità/raggruppamento dentro** Dashboard o
   Rubrica (non come nuova tab): gruppo per zona con conteggio clienti, numero di interventi
   programmati, prossimo intervento.

**Fuori ambito (NON fare).**

- NON creare nuove tab o schermi: la funzione cresce in profondità.
- NON salvare i raggruppamenti: si calcolano alla lettura come gli altri derivati.
- NON rompere i filtri e gli ordinamenti già esistenti.

**Criteri di accettazione.**

- L'agenda si può raggruppare per data/luogo/prezzo/cliente; luogo e fascia sono visibili
  sulle card; filtri e ordinamenti nuovi funzionano; nessuna nuova tab. `build`/`test` passano.

---

## Blocco E — Pannello cliente (EPIC, fuori canone v1)

> ⚠️ **Fuori dal canone v1.** Trasforma l'app da single-user local-first a sistema con
> accesso esterno: **richiede un backend** e una decisione di prodotto. **Non eseguire**
> finché la decisione non è presa. La fascia di giornata (Blocco 0) è già pronta e qui si
> riusa, non si ricrea.

**Razionale (bisogno).** Ogni cliente riceve un **link privato**, generato alla creazione
del cliente. Aprendolo entra in una vista **solo-lettura dei propri lavori**: vede i suoi
interventi pianificati e svolti e può **confermare «pagato / non pagato»**. Non vede prezzi,
nomi, descrizioni o dati di altri clienti; non può navigare alle altre sezioni dell'app.
L'operatore mantiene il controllo totale.

**Vincoli.**

- La sicurezza va imposta **a livello di dato** (lato server), non solo nascondendo elementi
  in UI. Un cliente non deve poter leggere i lavori altrui in nessun modo.
- Gli impegni altrui, nella vista cliente, compaiono solo come disponibilità occupata
  (anonima), mai con dettagli.
- Stile mobile-first, vista semplicissima, coerente con il canone 08.

**Metodo (lasciato all'agente).** Progettare la soluzione **più semplice e sicura**: scelta
del backend, meccanismo del link (token/magic-link), strato di sincronizzazione e regole di
accesso. La cucitura repository è fatta apposta per aggiungere un'implementazione di backend
**senza cambiare gli schermi esistenti**. Esistono più architetture valide (migrazione
completa a un backend; oppure un'app operatore che resta local-first e *pubblica* un
sotto-insieme per la vista cliente): **la scelta è dell'agente**, dopo aver spiegato i
trade-off. Prima il piano, poi l'implementazione.

**Criteri di accettazione (alto livello).**

- Un cliente, dal suo link, vede **solo** i propri lavori e può marcare pagato/non pagato.
- Nessun dato altrui è raggiungibile, nemmeno aggirando l'interfaccia.
- L'app operatore continua a funzionare invariata.

---

## Appendice — Mappa «richiesto in passato → realtà del codice»

Riferimento rapido per capire **cosa è già fatto** (da non duplicare) e **cosa è nuovo**.

| Richiesta originale | Stato nel codice | Decisione |
|---|---|---|
| `jobPrice` | esiste (`prezzo`) | riusare |
| `jobDate` | esiste (`data`) | riusare |
| `startTime` / `endTime` | esistono (`oraInizio`/`oraFine`) | riusare |
| `address` / `clientLocation` / `areaName` | esiste (`luogo` su lavoro e cliente) | riusare + **mostrare** (Blocco 3) |
| `paymentStatus` | **derivato**, non salvato | non creare |
| `paymentType` | esiste sul Pagamento (metodo) | **estendere** enum (Blocco 0) |
| `paymentTiming` | esprimibile (incasso ora / scadenza) | **esporre in UI** (Blocco 2), non modellare |
| `quoteType` (ciclo preventivo) | **assente** | **nuovo** (Blocco 0) |
| `bookingSlot` (fascia) | **assente** | **nuovo** (Blocco 0) |
| raggruppamenti per luogo/data/prezzo | **assenti** | **nuovo** (Blocco 3) |
| `userRole` / `visibilityRole` / login / RLS | **assenti**, fuori canone v1 | **Epic** (Blocco E), riformulato per bisogno |
| prezzo «nascosto al cliente» | irrilevante in single-user | solo nel Blocco E |
