# Albero Maestri — Visione 2.0
### Da "nove pagine" a un unico spazio di lavoro radicato sul cliente

> Documento di concezione e architettura dell'esperienza.
> Riferimenti: [Presentazione-Concezione.md](../Presentazione-Concezione.md) · [PRD.md](../PRD.md)
> Companion operativo: [PRD-FRONTEND.md](PRD-FRONTEND.md)

---

## 1. Il problema dell'interfaccia attuale

L'app oggi funziona, ma **si vive a pezzi**: nove pagine sorelle (Cruscotto,
Calendario, Clienti, Preventivi, Ore, Pagamenti, Storico, Officina, Spese),
ognuna isolata. Per capire un cliente devi rimbalzare tra cinque schermate;
per collegare "chi ha lavorato → per quale cliente → quanto gli devo" non
esiste un posto. Le tabelle sono spoglie, le azioni sparse, la navigazione
verticale. Su telefono è scomodo.

Il modello dati è solido (cliente-radice, codice parlante, motore dei conti):
**il problema è solo come lo mostriamo**. Lo riscriviamo da zero.

---

## 2. L'idea centrale

> **Non un cruscotto. Uno spazio di lavoro.**
> Una superficie unica costruita attorno ai **clienti**, dove ogni cliente è
> una carta viva che tiene insieme lavori, ore, soldi e persone. Da lì apri,
> espandi, colleghi e registri — senza perderti tra mille schermate.

Il cliente resta la **radice** (come nella concezione dell'albero). Ma ora la
radice è anche il **centro visivo**: la home è la bacheca dei clienti, e tutto
il resto sono lenti, espansioni e azioni che partono da lì.

Tre verità guidano il ridisegno:
1. **Una superficie centrale, tante lenti.** Meno pagine. Le entità secondarie
   vivono in schede a tutto schermo, pannelli laterali, fogli (sheet) e carte
   espandibili — non in pagine slegate.
2. **Tutto è collegato e visibile dal contesto.** Da un cliente vedi e crei
   lavori, ore, pagamenti; da un'ora vedi l'operatore e quanto gli devi.
3. **Mobile-first, davvero.** Si progetta prima per il pollice (bottom-nav,
   sheet, carte), poi si espande con grazia al desktop.

---

## 3. La nuova gerarchia delle entità

Manteniamo l'ossatura esistente e aggiungiamo la dimensione che mancava: **la
squadra e i suoi compensi** (i soldi che escono verso chi lavora con te).

```
                         🌳  SPAZIO (la bacheca dei clienti)
                                     │
        ┌────────────────┬──────────┴───────────┬─────────────────┐
        │                │                      │                 │
   🌱 CLIENTE       🧑‍🌾 OPERATORE          💶 SOLDI          📅 AGENDA
   (radice)         (squadra)            (flusso)          (tempo)
        │                │                      │                 │
   ┌────┴────┐      ┌────┴────┐        ┌────────┼────────┐   ┌────┴────┐
 Lavori   Pagamenti Ore   Compensi   Incassi Compensi Spese  Lavori per
 Ore   Preventivi  (dovuto/        (+)     (−)     (−)      giorno
 Spese             pagato)              + Storico + Patrimonio
```

### Entità di dominio

| Entità | Ruolo | Colore-guida |
|---|---|---|
| **Cliente** | la radice: chi paga, dove, con quale accordo. Ha il *codice parlante*. | 🟢 verde/smeraldo |
| **Operatore** | chi lavora (titolare o collaboratore). Ha una **tariffa-costo** (€/h che gli riconosci). | 🦚 teal |
| **Lavoro** | intervento: cliente + operatore + data + stato. | 🟣 viola |
| **Preventivo** | prezzo concordato → genera pagamenti attesi. | 🔵 azzurro |
| **Pagamento (incasso)** | soldi **in entrata** dal cliente, con stato. | 🟢 verde |
| **Compenso operatore** *(nuovo)* | soldi **in uscita** verso un operatore per le sue ore. | 🟠 ambra |
| **Spesa** | uscita (benzina, materiali…). | 🌹 rosa/rosso |
| **Attrezzo** | patrimonio strumenti. | 🟤 pietra |

> **La novità chiave:** l'**Operatore** diventa un'entità di primo piano con un
> proprio *libro mastro*. Le ore registrate (operatore × cliente × data)
> generano un **dovuto** (ore × tariffa-costo); i **compensi** che paghi lo
> riducono. Così sai sempre *quanto devi ancora a chi ha lavorato per te*,
> esattamente come sai quanto devi ancora incassare dai clienti.

---

## 4. Le superfici (information architecture)

Quattro destinazioni primarie + un'azione di creazione, raggiungibili da una
**bottom-nav** su telefono e da una **rail laterale** su desktop.

### 4.1 🌳 Spazio — la bacheca dei clienti *(home)*
Il pilota di comando. **Non è un dashboard**: è l'elenco vivo dei clienti su
cui lavori ogni giorno.
- Barra comandi in alto: ricerca globale, toggle **Carte / Tabella**, filtri,
  menù profilo.
- Striscia di micro-indicatori (compatta, tappabile): *da incassare*,
  *incassato del mese*, *lavori oggi*, *da pagare alla squadra*.
- Bacheca clienti:
  - **Carte** (default mobile): carta ricca per cliente con avatar a iniziali,
    codice parlante "decodificato" in mini-statistiche, saldo da incassare in
    evidenza, prossimo lavoro, azioni rapide, **espansione in loco**.
  - **Tabella** (stile Notion): colonne ordinabili, chip di stato, azioni a
    hover, modifica inline.
- Pulsante **＋** centrale: foglio "Crea" (cliente, lavoro, ore, preventivo, spesa).

### 4.2 🌱 Scheda cliente — l'hub delle relazioni *(`/cliente/:id`, schermo intero)*
Tutto del cliente in un posto, a sezioni (segmented control sticky):
**Panoramica · Lavori · Pagamenti · Ore · Spese**.
- Hero: avatar, nome, codice parlante decodificato, contatti azionabili
  (chiama/email/mappa), accordo, modifica.
- Banda di statistiche color-coded (saldo, incassato, lavori, ore).
- Panoramica = **feed di attività** (eventi recenti tra tutte le entità) +
  azioni rapide. Le altre sezioni sono liste/tabelle con creazione contestuale.
- Qui si **collega tutto**: assegni l'operatore a un lavoro, registri ore (che
  alimentano sia l'incasso dal cliente sia il dovuto all'operatore), incassi.

### 4.3 🧑‍🌾 Squadra — operatori e compensi *(`/squadra`, + `/operatore/:id`)*
- Carte/tabella degli operatori: avatar teal, ruolo, tariffa, e per il mese
  corrente **ore · dovuto · pagato · da pagare** (badge ambra).
- Scheda operatore: libro mastro (ore per cliente/periodo, dovuto/pagato/saldo),
  elenco compensi pagati, lavori assegnati, azione **Paga operatore**.
- Foglio **＋ Nuovo operatore**.

### 4.4 💶 Soldi — il flusso del denaro *(`/soldi`)*
Riunisce ciò che prima era Pagamenti + Spese + Storico + Officina.
- In alto: riepilogo del mese (incassato, uscite = spese + compensi, saldo, da
  incassare, da pagare squadra) con selettore mese.
- Sezioni: **Movimenti · Storico · Patrimonio**.
  - *Movimenti*: registro unificato e filtrabile (incassi +, compensi −, spese −)
    con importi color-coded e chip di tipo; tabella stile Notion.
  - *Storico*: tabella mensile (atteso/incassato/uscite/saldo) con micro-grafici
    a barre in CSS.
  - *Patrimonio*: attrezzi (officina) con valore totale.

### 4.5 📅 Agenda — i lavori nel tempo *(`/agenda`)*
- Vista settimana; su telefono diventa scorrimento verticale per giorni, con
  *oggi* in evidenza.
- Tocca un giorno → crea lavoro. Tocca un lavoro → foglio rapido (cambia stato,
  assegna operatore, registra ore, apri cliente). Filtro per operatore.

### 4.6 Overlay trasversali
- **Fogli (sheet) / modali responsivi**: creazione ed editing di ogni entità
  (bottom-sheet su mobile, dialog su desktop) con valori predefiniti dal
  contesto.
- **Espansione carte** in loco nella bacheca.
- **Menù rapidi** (dropdown) per azioni di riga.

---

## 5. Sistema di colori per entità (gerarchia tonale)

Ogni tipo di entità ha una **tinta-guida** costante: avatar, icone, bordi,
badge e accenti la usano, così l'occhio riconosce *cosa* sta guardando prima
ancora di leggere.

| Significato | Tinta | Uso |
|---|---|---|
| Cliente / radice | smeraldo | avatar cliente, accenti Spazio/Scheda |
| Operatore / squadra | teal | avatar operatore, sezione Squadra |
| Lavoro / agenda | viola | blocchi agenda, badge lavoro |
| Preventivo | azzurro | chip preventivo |
| Soldi in entrata (incasso) | verde | importi +, stato pagato |
| Soldi in uscita (compenso) | ambra | importi −, da pagare squadra |
| Spesa | rosa | importi − spese |
| Patrimonio / attrezzi | pietra | sezione patrimonio |

**Stati** (badge con icona):
- Pagamento: *in attesa* (ambra) · *in ritardo* (rosa) · *pagato* (verde).
- Lavoro: *da fare* (ardesia) · *in corso* (ambra) · *fatto* (verde).
- Compenso operatore: *da pagare* (ambra) · *parziale* (azzurro) · *saldato* (verde).
- Attrezzo: *in uso* (verde) · *manutenzione* (ambra) · *dismesso* (ardesia).

---

## 6. Lingua visiva

- **Carattere**: giovane e nitido (*Plus Jakarta Sans* per UI, *JetBrains Mono*
  per il codice parlante).
- **Forma**: superfici ampie e morbide (raggi 2xl–3xl), ombre stratificate,
  vetro leggero (backdrop blur) su barre e fogli, gradienti naturali (verde→lime).
- **Movimento**: micro-interazioni con *framer-motion* — pressione delle carte,
  apertura a molla dei fogli, comparsa a cascata delle liste, indicatore dei tab
  che scorre. Mai gratuito: l'animazione spiega lo spazio.
- **Tatto**: bersagli ampi (≥44px), zone-pollice, feedback immediato (toast).
- **Tono**: professionale ma fresco — un SaaS che "fa venire voglia" di usarlo,
  cucito sul mondo del verde.

---

## 7. Principi che non cambiano

1. **Cliente-radice.** Tutto parte e torna al cliente.
2. **I dati derivati si calcolano, non si duplicano.** Codice parlante, totali,
   stati, dovuto/saldo: un solo motore (`lib/`).
3. **Inserisci una volta, vedi ovunque.** Un'ora registrata aggiorna incasso
   cliente, dovuto operatore, agenda e storico insieme.
4. **Cresce ai rami.** Nuove viste si aggiungono senza toccare le altre.

---

## 8. Cosa cambia, in una riga

> Da **nove pagine slegate** a **uno spazio**: la bacheca dei clienti come
> pilota; la scheda cliente come hub; la squadra con il suo libro mastro; i
> soldi come flusso unico; l'agenda come tempo — tutto collegato, color-coded,
> mobile-first, vivo.
