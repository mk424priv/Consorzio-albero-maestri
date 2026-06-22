# PRD — Albero Maestri
### Sistema operativo del lavoro per il verde e l'arboricoltura

| | |
|---|---|
| **Documento** | Product Requirements Document (PRD) |
| **Prodotto** | Albero Maestri — Centro di Comando del Lavoro |
| **Versione** | 1.0 |
| **Data** | 22 giugno 2026 |
| **Stato** | Approvato per la realizzazione (Fase 1) |
| **Lingua del prodotto** | Italiano |
| **Documento di riferimento** | [Presentazione-Concezione.md](Presentazione-Concezione.md) |

---

## 1. Sommario esecutivo

**Albero Maestri** è un'applicazione web che trasforma la gestione di un'attività di lavori nel verde (potatura, abbattimento, manutenzione giardini, trattamenti) in un sistema che vive nei dati. Oggi tutte le informazioni — chi sono i clienti, cosa c'è da fare, chi ha pagato, quanto si è speso — stanno nella testa del titolare. Quando l'attività cresce (un dipendente, più clienti, più pagamenti da seguire) la testa non basta più.

Il prodotto mette ogni cosa in un posto solo: si registra una volta e da lì tutto si calcola e si aggiorna da solo. Il titolare vede in ogni momento chi deve pagare, quanto è entrato nel mese, quanto è rimasto in tasca. Il sistema è costruito per funzionare **anche senza il titolare**: il giorno in cui il lavoro viene delegato a un dipendente, l'applicazione è già pronta a guidarlo.

La struttura segue una metafora semplice — **un albero**: i **clienti** sono le radici, il **motore dei conti** è il tronco, le **funzionalità** (preventivi, ore, pagamenti, storico, officina, spese) sono i rami. Si parte dal nucleo essenziale e si cresce ramo dopo ramo, senza mai rifare ciò che esiste.

Questo documento definisce in modo completo e univoco *cosa* costruire e *come*, così che l'implementazione possa procedere fino alla pubblicazione su GitHub e al funzionamento in produzione su Vercel.

---

## 2. Visione, obiettivi e principi

### 2.1 Visione
Un'attività che vive nei dati: ordinata, controllabile da remoto, pronta a crescere e a essere delegata, senza che nulla vada perso o resti "solo nella testa".

### 2.2 Obiettivi (cosa deve ottenere il prodotto)
1. **O1 — Anagrafica viva dei clienti.** Ogni cliente con un *codice parlante* che riassume il suo valore in un colpo d'occhio, aggiornato dai dati reali.
2. **O2 — Soldi sotto controllo.** Sapere sempre chi deve pagare, da quanto, quanto è entrato e quanto è uscito, mese per mese.
3. **O3 — Inserisci una volta, vedi ovunque.** Inserire un lavoro/preventivo/pagamento deve aggiornare automaticamente la scheda del cliente e i totali, senza doppio lavoro.
4. **O4 — Pianificazione del lavoro nel tempo.** Un calendario dove i lavori si posizionano per data, programmabili per la settimana.
5. **O5 — Delega senza attrito.** Una struttura a ruoli che permette, in futuro, di dare al dipendente una vista filtrata e già pronta.
6. **O6 — Funzionante in produzione.** Applicazione pubblicata e accessibile online (Vercel), con dati persistenti.

### 2.3 Principi guida
- **Canonicità.** Solo le entità e le funzioni che servono davvero al cuore dell'idea. Niente parti scollegate.
- **Semplicità nel cuore, crescita ai rami.** Il nucleo è minimo; ogni estensione si aggiunge senza toccare l'esistente.
- **I dati si scrivono una volta sola.** Ogni numero derivabile (codice parlante, totali, storico) è *calcolato*, mai inserito a mano due volte.
- **Una sola fonte di verità.** Le entità di base sono il riferimento; tutto il resto sono viste e aggregazioni.
- **Pronto alla delega.** La separazione dei ruoli è prevista fin dall'architettura, anche se l'interfaccia operatore arriva dopo.

### 2.4 Non-obiettivi (esplicitamente fuori da questa versione)
- Fatturazione fiscale/elettronica conforme (SDI, PDF fiscali).
- Contabilità completa / partita doppia / commercialista.
- App mobile nativa (l'app web è responsive e usabile da telefono).
- Integrazioni esterne (email, WhatsApp, gestionali terzi).
- GPS dei mezzi e ottimizzazione automatica del percorso.
- Multi-azienda / multi-tenant.

---

## 3. Personas e ruoli

### 3.1 Il Titolare (utente primario — *Centro di Comando*)
Conduce l'attività sul campo e dall'ufficio. Ha bisogno di vedere e gestire tutto: clienti, lavori, preventivi, ore, pagamenti, spese, e il quadro economico complessivo. È l'unico utente della Fase 1.

### 3.2 L'Operatore (utente secondario — *Vista Operatore*, Fase 3)
Un dipendente a cui viene delegato il lavoro sul campo. Vede solo ciò che gli serve: i lavori del giorno, gli attrezzi, il giro, e registra le ore e il completamento. Non vede i dati economici sensibili (margini, codici parlanti, storico).

### 3.3 Matrice ruoli/permessi

| Area | Titolare | Operatore (Fase 3) |
|---|---|---|
| Clienti (anagrafica completa, codice parlante) | Lettura/scrittura | — |
| Lavori | Lettura/scrittura | Lettura dei propri assegnati, segna stato e ore |
| Preventivi | Lettura/scrittura | — |
| Ore | Lettura/scrittura tutte | Inserimento delle proprie |
| Pagamenti | Lettura/scrittura | — |
| Storico mensile, Cruscotto | Lettura | — |
| Officina, Spese | Lettura/scrittura | Lettura attrezzi assegnati |

---

## 4. Modello concettuale — l'albero

```
                         📊 Cruscotto / Storico
                          (la chioma: la vista d'insieme)
                                   │
        🌿 Preventivi  ⏱️ Ore  💶 Pagamenti  🔧 Officina  ⛽ Spese  📅 Calendario
                          (i rami: le stanze del sistema)
                                   │
                     🪵 Motore dei conti (il tronco)
              trasforma preventivi e ore in pagamenti, totali, codici
                                   │
                          🌱 Clienti (le radici)
                    da qui parte tutto: senza cliente non c'è nulla
```

- **Radici — Clienti.** Punto d'origine di ogni cosa.
- **Tronco — Motore dei conti.** Logica invisibile che fa tornare i numeri.
- **Rami — Stanze.** Funzionalità indipendenti che si tengono allo stesso tronco.
- **Chioma — Cruscotto/Storico.** La sintesi che si guarda per capire come va.

---

## 5. Glossario

| Termine | Significato |
|---|---|
| **Cliente** | Persona/luogo per cui si lavora. Radice di tutto. |
| **Codice parlante** | Codice alfanumerico che riassume il profilo del cliente (`MR-03-12-05`), calcolato dai dati. |
| **Lavoro** | Singolo intervento operativo con cliente, luogo, data, stato. |
| **Persona** | Chi esegue il lavoro: titolare o operatore. |
| **Giornata / Giro** | Insieme ordinato dei lavori di un giorno. |
| **Preventivo** | Prezzo concordato prima del lavoro (unico, oppure acconto + saldo). |
| **Registrazione ore** | Ore segnate giorno per giorno su un cliente/lavoro. |
| **Pagamento (atteso)** | Importo che il cliente deve, con il suo stato (in attesa / pagato / in ritardo). |
| **Spesa** | Uscita di denaro (benzina, materiali, ecc.). |
| **Attrezzo** | Strumento di lavoro posseduto, con il suo costo (Officina). |
| **Storico mensile** | Vista per mese: atteso, incassato, uscite, saldo. |
| **Cruscotto** | Vista d'insieme: guadagnato − speso = quanto resta. |

---

## 6. Modello dati (entità, attributi, relazioni)

> Notazione: `*` = obbligatorio, `(d)` = derivato/calcolato (mai inserito a mano), `(o)` = opzionale.

### 6.1 Cliente
| Campo | Tipo | Note |
|---|---|---|
| id* | id | chiave |
| nome* | testo | |
| cognome* | testo | |
| inizialiCodice* (d) | testo | `MR`, `MR1`… calcolato, fisso dopo l'assegnazione |
| codiceParlante (d) | testo | es. `MR-03-12-05`, ricalcolato |
| telefono (o) | testo | |
| email (o) | testo | |
| luogo (o) | testo | indirizzo libero (villa, giardino, zona Elba) |
| latitudine/longitudine (o) | numero | per la Mappa (Fase 2) |
| tariffaOraria (o) | denaro | €/h propria del cliente |
| modalitaPredefinita* | enum | `preventivo` \| `ore` \| `misto` |
| note (o) | testo | |
| dataPrimoLavoro (d) | data | minimo tra le date dei suoi lavori |
| creatoIl* (d) | data/ora | |

**Derivati calcolati** (non memorizzati come verità, esposti dalle viste): `giorniMediIncasso`, `spesaMediaPerLavoro`, `anniInsieme`, `totaleAtteso`, `totaleIncassato`, `saldoDaIncassare`.

### 6.2 Lavoro
| Campo | Tipo | Note |
|---|---|---|
| id* | id | |
| clienteId* | rif Cliente | |
| titolo* | testo | breve descrizione (es. "Potatura olivi") |
| descrizione (o) | testo | |
| luogo (o) | testo | default = luogo del cliente |
| data* | data | giorno programmato |
| ordineNelGiorno (o) | numero | posizione nel giro di quel giorno |
| stato* | enum | `da_fare` \| `in_corso` \| `fatto` |
| tipoCompenso* | enum | `preventivo` \| `ore` \| `misto` |
| durataPrevistaOre (o) | numero | stima |
| oreReali (d) | numero | somma delle registrazioni ore collegate |
| personaId (o) | rif Persona | assegnatario |
| note (o) | testo | |
| creatoIl* (d) | data/ora | |

Relazioni: un Lavoro → un Cliente; → 0..1 Persona; → 0..1 Preventivo; → 0..N RegistrazioniOre; → 0..N Pagamenti; → 0..N Spese (attribuite).

### 6.3 Persona
| Campo | Tipo | Note |
|---|---|---|
| id* | id | |
| nome* | testo | |
| ruolo* | enum | `titolare` \| `operatore` |
| attivo* | sì/no | |

### 6.4 Preventivo
| Campo | Tipo | Note |
|---|---|---|
| id* | id | |
| clienteId* | rif Cliente | |
| lavoroId (o) | rif Lavoro | |
| tipo* | enum | `unico` \| `acconto_saldo` |
| importoTotale* | denaro | |
| importoAcconto (o) | denaro | se `acconto_saldo` |
| importoSaldo (o) | denaro | = totale − acconto |
| dataEmissione* | data | |
| note (o) | testo | |

Alla creazione genera 1 Pagamento (tipo `unico`) o 2 Pagamenti (acconto + saldo).

### 6.5 RegistrazioneOre
| Campo | Tipo | Note |
|---|---|---|
| id* | id | |
| clienteId* | rif Cliente | |
| lavoroId (o) | rif Lavoro | |
| personaId* | rif Persona | |
| data* | data | |
| ore* | numero | es. 3.5 |
| note (o) | testo | |

### 6.6 Pagamento (atteso / incasso)
| Campo | Tipo | Note |
|---|---|---|
| id* | id | |
| clienteId* | rif Cliente | |
| lavoroId (o) | rif Lavoro | |
| origine* | enum | `preventivo` \| `acconto` \| `saldo` \| `ore` \| `manuale` |
| importoAtteso* | denaro | |
| importoIncassato (o) | denaro | default 0 |
| stato* | enum | `in_attesa` \| `pagato` \| `in_ritardo` |
| dataEmissione* | data | |
| dataScadenza (o) | data | per il calcolo del "in ritardo" |
| dataIncasso (o) | data | impostata quando `pagato` |
| note (o) | testo | |

### 6.7 Spesa
| Campo | Tipo | Note |
|---|---|---|
| id* | id | |
| categoria* | enum | `benzina` \| `materiali` \| `attrezzi` \| `altro` |
| importo* | denaro | |
| data* | data | |
| descrizione (o) | testo | |
| clienteId (o) | rif Cliente | attribuzione facoltativa |
| lavoroId (o) | rif Lavoro | attribuzione facoltativa |

### 6.8 Attrezzo (Officina)
| Campo | Tipo | Note |
|---|---|---|
| id* | id | |
| nome* | testo | |
| costoAcquisto (o) | denaro | |
| dataAcquisto (o) | data | |
| stato (o) | enum | `ok` \| `manutenzione` \| `dismesso` |
| note (o) | testo | |

### 6.9 Diagramma delle relazioni
```
Persona ──< RegistrazioneOre >── Cliente ──< Lavoro
                                   │  ▲         │
                                   │  └─────────┤
                                   ├──< Preventivo
                                   ├──< Pagamento >── (Lavoro)
                                   └──< Spesa     >── (Lavoro)
Attrezzo  (catalogo indipendente, riferibile dai Lavori in Fase 3)
StoricoMensile, Cruscotto = aggregazioni calcolate, nessuna tabella propria
```

---

## 7. Il codice parlante del cliente (specifica dell'algoritmo)

Formato: `II-GG-SS-AA` (es. `MR-03-12-05`).

### 7.1 Iniziali `II` (fisso)
- Iniziale del nome + iniziale del cognome, maiuscole (`Mario Rossi → MR`).
- In caso di collisione con un cliente esistente, si aggiunge un contatore progressivo a partire dal secondo: `MR`, `MR1`, `MR2`…
- Assegnato alla creazione del cliente e **non cambia mai**.

### 7.2 Giorni per incassare `GG` (calcolato)
- Media, arrotondata, dei giorni tra `dataEmissione` e `dataIncasso` su **tutti i pagamenti in stato `pagato`** del cliente.
- Nessun pagamento concluso → `00`.
- Valore > 99 → bloccato a `99`.

### 7.3 Spesa media `SS` (calcolato)
- Media di quanto il cliente paga **per lavoro** (somma incassi ÷ numero lavori pagati), divisa per `50` e arrotondata. Quindi `12` ≈ 600 €.
- Nessun pagamento → `00`.
- Media > 4 950 € (cioè > 99 unità) → bloccato a `99`.

### 7.4 Anni insieme `AA` (calcolato)
- Anni interi trascorsi da `dataPrimoLavoro` a oggi.
- Meno di un anno → `00`.

### 7.5 Regola di ricalcolo
Il codice si ricalcola automaticamente quando: si incassa/registra un pagamento, si crea un lavoro che cambia la data del primo lavoro, oppure su richiesta (ricalcolo periodico per gli "anni insieme"). Le parti calcolate sono sempre derivate dai dati, mai inserite a mano.

---

## 8. Il motore dei conti (il tronco)

### 8.1 Le tre strade del compenso
- **A preventivo** — prezzo fisso concordato. `unico` → 1 pagamento; `acconto_saldo` → 2 pagamenti (acconto + saldo).
- **A ore** — le `RegistrazioneOre` si sommano per cliente e periodo; il compenso = ore × `tariffaOraria` del cliente. A fine mese genera un pagamento atteso (per cliente/mese).
- **Misto** — coesistono preventivo e ore sullo stesso lavoro; ai fini dei conti gli importi si **sommano**.

> Risultato comune: ogni strada produce uno o più **Pagamenti attesi** legati al cliente.

### 8.2 Stati del pagamento
```
                 incasso registrato
   in_attesa ───────────────────────► pagato
       │
       │ scaduto e non incassato
       ▼
   in_ritardo ──── incasso registrato ──► pagato
```
- `in_attesa`: creato, non ancora incassato.
- `in_ritardo`: superata `dataScadenza` (o soglia configurabile) senza incasso completo. Calcolato.
- `pagato`: `importoIncassato ≥ importoAtteso`; si imposta `dataIncasso`.

### 8.3 Aggregazioni automatiche (inserisci una volta, vedi ovunque)
- **Scheda cliente**: totale atteso, totale incassato, saldo da incassare, codice parlante — tutti derivati dai pagamenti/ore del cliente.
- **Storico mensile**: per ogni mese → `atteso`, `incassato`, `uscite` (somma spese del mese), `saldo = incassato − uscite`.
- **Cruscotto**: per il periodo scelto → `incassato`, `speso`, `quanto resta = incassato − speso`; elenco di chi deve ancora pagare e da quanto.

---

## 9. Requisiti funzionali per stanza

> Codifica: `RF-<area>-<n>`. Tutti i requisiti elencati sono in ambito Fase 1, salvo diversa indicazione.

### 9.1 Clienti
- **RF-CLI-1** Creare/modificare/eliminare un cliente con i campi di §6.1.
- **RF-CLI-2** Assegnare automaticamente le iniziali del codice, con contatore sulle collisioni.
- **RF-CLI-3** Mostrare il codice parlante calcolato in lista e nella scheda.
- **RF-CLI-4** Scheda cliente con dati anagrafici + aggregati automatici (saldo da incassare, totale incassato, n. lavori, ultimi pagamenti, storico ore).
- **RF-CLI-5** Elenco clienti filtrabile/ordinabile (per nome, per saldo da incassare, per codice).

### 9.2 Lavori e Calendario
- **RF-LAV-1** Creare un lavoro collegato a un cliente, con data, tipo compenso, stato.
- **RF-LAV-2** Cambiare lo stato (`da_fare`→`in_corso`→`fatto`).
- **RF-LAV-3** Vista **Calendario** (mese/settimana/giorno) con i lavori posizionati per data.
- **RF-LAV-4** Pianificare in avanti (creare lavori su date future, vista settimanale).
- **RF-LAV-5** Vista "Oggi": elenco ordinato dei lavori del giorno.
- **RF-LAV-6** (Fase 2) Ordinare i lavori del giorno per definire il giro.

### 9.3 Preventivi
- **RF-PRE-1** Creare un preventivo per un cliente/lavoro: `unico` o `acconto_saldo`.
- **RF-PRE-2** Alla creazione generare automaticamente i pagamenti attesi corrispondenti.
- **RF-PRE-3** Elenco preventivi con stato dei pagamenti collegati.

### 9.4 Ore
- **RF-ORE-1** Registrare ore (cliente, data, ore, persona, nota), anche rapidamente.
- **RF-ORE-2** Somma automatica delle ore per cliente e per mese.
- **RF-ORE-3** A fine mese (o su comando) generare il pagamento atteso = ore × tariffa cliente.
- **RF-ORE-4** Vista riepilogo ore per cliente/periodo.

### 9.5 Pagamenti
- **RF-PAG-1** Elenco pagamenti con stato, importo atteso/incassato, cliente, data.
- **RF-PAG-2** Registrare un incasso (parziale o totale) → aggiornamento stato.
- **RF-PAG-3** Evidenziare i pagamenti `in_ritardo` e i giorni di ritardo.
- **RF-PAG-4** Filtri: per stato, per cliente, per mese.

### 9.6 Storico mensile
- **RF-STO-1** Tabella per mese: atteso, incassato, uscite, saldo.
- **RF-STO-2** Dettaglio del mese: chi è ancora in debito, elenco incassi e spese.

### 9.7 Officina
- **RF-OFF-1** Anagrafica attrezzi con costo d'acquisto e stato.
- **RF-OFF-2** Valore totale degli attrezzi posseduti.

### 9.8 Spese
- **RF-SPE-1** Registrare una spesa (categoria, importo, data, descrizione, attribuzione facoltativa a cliente/lavoro).
- **RF-SPE-2** Elenco e somma spese per periodo/categoria.

### 9.9 Cruscotto
- **RF-CRU-1** Indicatori principali: incassato, speso, quanto resta (periodo selezionabile).
- **RF-CRU-2** Da incassare totale + elenco clienti debitori.
- **RF-CRU-3** Lavori di oggi / della settimana in sintesi.

---

## 10. Le interfacce (descrizione schermo per schermo)

Navigazione principale a barra laterale (desktop) / menù (mobile) con le voci:
**Cruscotto · Calendario · Clienti · Preventivi · Ore · Pagamenti · Storico · Officina · Spese**.

1. **Cruscotto (home)** — schede sintetiche in alto (incassato, speso, resta, da incassare); sotto, "lavori di oggi" e "ultimi pagamenti / debitori".
2. **Calendario** — griglia mese/settimana; i lavori appaiono come blocchi cliccabili; pulsante "+ lavoro" su ogni giorno; pannello laterale per il giorno selezionato.
3. **Clienti** — tabella con nome, codice parlante, saldo da incassare; ricerca; click → **Scheda cliente** (dati + aggregati + lavori + pagamenti + ore).
4. **Preventivi** — elenco + form di creazione (scelta cliente, tipo, importi); stato pagamenti collegati.
5. **Ore** — inserimento rapido (cliente, data, ore) + riepilogo per cliente/mese; pulsante "genera compenso del mese".
6. **Pagamenti** — tabella con stati colorati (attesa / pagato / in ritardo); azione "registra incasso".
7. **Storico** — tabella mensile (atteso/incassato/uscite/saldo) + dettaglio mese.
8. **Officina** — elenco attrezzi + valore totale.
9. **Spese** — elenco + form rapido; somme per categoria/periodo.

Stile: pulito, flat, leggibile, mobile-responsive. Stati dei pagamenti con colori semantici (attesa = neutro, pagato = verde, ritardo = rosso).

---

## 11. Flussi utente principali

- **F1 — Nuovo cliente.** Inserisco nome/cognome → il sistema assegna le iniziali → salvo → appare in lista con codice `II-00-00-00`.
- **F2 — Lavoro a preventivo.** Creo il lavoro per il cliente, tipo `preventivo`, importo (unico o acconto+saldo) → nascono i pagamenti attesi → compaiono in Pagamenti e nel saldo del cliente.
- **F3 — Lavoro a ore.** Registro le ore giorno per giorno → a fine mese genero il compenso (ore × tariffa) → nasce il pagamento atteso.
- **F4 — Incasso.** In Pagamenti registro l'incasso → stato `pagato`, data incasso → si aggiornano scheda cliente, storico, cruscotto e codice parlante (`GG`, `SS`).
- **F5 — Spesa.** Registro benzina/materiali → entra nelle uscite del mese e nel "quanto resta".
- **F6 — Pianifico la settimana.** In Calendario creo i lavori dei prossimi giorni → vista "Oggi" pronta ogni mattina.
- **F7 — Quadro economico.** Apro il Cruscotto → vedo incassato, speso, quanto resta, chi deve pagare.

---

## 12. Requisiti non funzionali

- **RNF-1 Semplicità.** Ogni operazione comune in ≤ 3 click; form brevi; nessun gergo tecnico nell'interfaccia.
- **RNF-2 Multi-dispositivo.** Interfaccia responsive, usabile da computer e telefono.
- **RNF-3 Dati persistenti e sicuri.** Database persistente; nessuna perdita dati; backup/esportazione (Fase ≥2).
- **RNF-4 Accesso protetto.** Accesso riservato al titolare (autenticazione semplice in Fase 1; ruoli in Fase 3).
- **RNF-5 Prestazioni.** Caricamento schermate < 2 s su connessione normale.
- **RNF-6 Affidabilità del calcolo.** Codice parlante, totali e storico sempre coerenti con i dati (derivati, non duplicati).
- **RNF-7 Lingua.** Tutta l'interfaccia in italiano.
- **RNF-8 Manutenibilità.** Architettura a moduli (le "stanze") indipendenti; aggiungere un ramo non tocca gli altri.
- **RNF-9 Disponibilità.** Applicazione online su Vercel, raggiungibile da URL pubblico.

---

## 13. Architettura tecnica (specifica per la realizzazione)

### 13.1 Stack
- **Framework:** Next.js (App Router, TypeScript) — full-stack, deploy nativo su Vercel.
- **UI:** React + Tailwind CSS; componenti semplici e flat.
- **Stato server/dati:** Server Components + Route Handlers (API) di Next.js.
- **ORM/Database:** Prisma + **PostgreSQL** (compatibile serverless Vercel; provider Neon/Vercel Postgres). DB iniziale "semplice" ma persistente in produzione.
- **Validazione:** Zod sui confini API/form.
- **Autenticazione (Fase 1):** accesso a password singola (titolare) via middleware; evolvibile a ruoli in Fase 3.
- **Hosting:** Vercel; sorgente su GitHub; deploy automatico al push.

### 13.2 Struttura del progetto
```
albero-maestri/
├─ prisma/
│  ├─ schema.prisma          # entità di §6
│  └─ seed.ts                # dati d'esempio
├─ src/
│  ├─ app/
│  │  ├─ (app)/              # area autenticata
│  │  │  ├─ cruscotto/
│  │  │  ├─ calendario/
│  │  │  ├─ clienti/[id]/
│  │  │  ├─ preventivi/
│  │  │  ├─ ore/
│  │  │  ├─ pagamenti/
│  │  │  ├─ storico/
│  │  │  ├─ officina/
│  │  │  └─ spese/
│  │  ├─ api/                # route handlers per ogni entità
│  │  └─ login/
│  ├─ lib/
│  │  ├─ db.ts               # client Prisma
│  │  ├─ codice-parlante.ts  # algoritmo §7
│  │  ├─ conti.ts            # motore dei conti §8 (aggregazioni)
│  │  └─ auth.ts
│  ├─ components/            # UI riusabile (tabelle, form, schede)
│  └─ types/
├─ .env.example             # DATABASE_URL, APP_PASSWORD
└─ README.md
```

### 13.3 Superficie API (REST, per entità)
`GET/POST /api/clienti`, `GET/PATCH/DELETE /api/clienti/:id`; analoghe per `lavori`, `preventivi`, `ore`, `pagamenti`, `spese`, `attrezzi`; endpoint di calcolo: `GET /api/cruscotto`, `GET /api/storico`, `POST /api/ore/genera-compenso`. Tutte le mutazioni che impattano i derivati ricalcolano scheda cliente/codice.

### 13.4 Database iniziale e dati d'esempio
Schema Prisma con migrazioni; `seed.ts` popola alcuni clienti, lavori, preventivi, ore, pagamenti e spese realistici, così l'app è subito navigabile e dimostrabile.

### 13.5 Deploy e pubblicazione
1. Repository Git inizializzato e pubblicato su **GitHub**.
2. Progetto collegato a **Vercel** (import del repo).
3. Variabili d'ambiente su Vercel: `DATABASE_URL` (Postgres), `APP_PASSWORD`.
4. `prisma migrate deploy` in fase di build; deploy automatico a ogni push su `main`.

> Nota operativa: la creazione dell'account/URL del database Postgres e il collegamento GitHub↔Vercel richiedono le credenziali del titolare; il codice è predisposto per funzionare appena le variabili d'ambiente sono impostate.

---

## 14. Roadmap a fasi

| Fase | Contenuto | Esito |
|---|---|---|
| **Fase 1 — Nucleo** | Clienti + codice parlante, Lavori + Calendario, Preventivi, Ore, Pagamenti, Storico, Officina, Spese, Cruscotto, motore dei conti, autenticazione titolare, deploy Vercel | Applicazione completa per il titolare, online |
| **Fase 2 — Territorio** | Mappa dei lavori, ordinamento del giro, geocoding clienti | Pianificazione per luogo |
| **Fase 3 — Delega** | Ruoli, Vista Operatore (lavori del giorno, attrezzi, checklist, ore), permessi | Sistema delegabile |
| **Fase 4 — Crescita** | Fatturazione, esportazioni, GPS mezzi, notifiche scadenze | Strumenti di scala |

---

## 15. Metriche di successo
- **M1** Il titolare gestisce l'intera attività nell'app senza appunti su carta.
- **M2** "Chi deve pagarmi e da quanto" è visibile in < 5 secondi.
- **M3** Inserire un lavoro/preventivo aggiorna la scheda cliente e i totali senza doppio inserimento.
- **M4** Il quadro mensile (entrate − uscite) è disponibile senza calcoli manuali.
- **M5** L'app è raggiungibile online e i dati persistono tra le sessioni.

---

## 16. Rischi e mitigazioni
| Rischio | Mitigazione |
|---|---|
| Troppa complessità → l'app non viene usata | Nucleo minimo, form brevi, ≤ 3 click; rami opzionali |
| Dati incoerenti tra schede | Tutti i numeri derivati calcolati da un solo motore (`conti.ts`) |
| Lock-in sul database | Prisma → portabile tra Postgres gestiti |
| Credenziali esterne mancanti al deploy | Codice pronto; deploy completabile appena impostate le variabili |
| Crescita non prevista | Architettura a "rami" indipendenti, estendibile senza riscrivere |

---

## 17. Definizione di "fatto" (Fase 1)
1. Tutte le stanze di §9 implementate e navigabili.
2. Codice parlante e aggregazioni calcolati correttamente (§7–§8) con dati d'esempio.
3. Autenticazione titolare attiva.
4. Database persistente con migrazioni e seed.
5. Codice su GitHub; build verde; app raggiungibile su Vercel (a credenziali impostate).
6. README con istruzioni di avvio locale e deploy.
