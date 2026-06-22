# Albero Maestri — Il Centro di Comando del Lavoro
### Presentazione della concezione e dell'architettura

---

## L'idea in una frase

> Ogni cosa vive **scritta nei dati**: il cliente, il lavoro, le ore, i soldi.
> Lo registri una volta, e da lì tutto — chi paga, quanto, quando, cosa hai speso, quanto ti resta — si vede sempre, da solo.
>
> Così l'attività funziona **anche senza di te**.

---

## Il problema di oggi

Oggi tutto è nella tua testa:
- ti svegli e devi ricordarti cosa fare, in che ordine, dove andare;
- non sai con precisione chi ti ha già pagato, chi ti deve ancora pagare, da quanto;
- non sai a fine mese quanto è entrato davvero e quanto hai speso di benzina, attrezzi, materiali;
- se mandi qualcuno a lavorare, devi spiegargli tutto a voce e poi richiamarlo per sapere com'è andata;
- quando cresci — un dipendente, dei pagamenti da fare, dei clienti che ti devono pagare — **ti perdi**.

Senza dati ti perdi. A volte ti perdi anche da solo.

Il sistema serve a togliere tutto questo dalla testa e metterlo in un posto solo, dove si scrive una volta e si vede sempre.

---

## La metafora — un albero

Tutto il sistema è un **albero**. Un solo tronco, un solo punto da cui tutto cresce.

- **🌱 Le radici — i Clienti.** Da qui parte tutto. Senza cliente non c'è lavoro, non c'è pagamento, non c'è incasso.
- **🪵 Il tronco — il motore dei conti.** Il cuore invisibile che trasforma ore e preventivi in cifre. Non lo vedi, ma è ciò che fa tornare tutti i numeri.
- **🌿 I rami — le stanze.** Ogni ramo ha il suo lavoro (preventivi, ore, pagamenti, storico, officina, spese), ma tutti si tengono allo stesso tronco.

Semplice nel cuore, pronto a crescere. Ogni ramo nuovo si aggiunge senza toccare gli altri.

---

## Le quattro entità di base — niente di più

Tutto si regge su quattro mattoni. Il resto sono solo modi di guardarli.

1. **Il Cliente** — la radice. Chi è, dove sta (villa, giardino, zona dell'Elba), il suo **codice parlante** e il suo **accordo economico**: a ore (con la *sua* tariffa), a preventivo, oppure tutti e due.

2. **Il Lavoro** — l'unità operativa. Ha un cliente, un luogo, una data, gli attrezzi che servono, una durata e uno stato (da fare / fatto). Può essere **a preventivo**, **a ore** o **misto**. Quando è finito porta con sé le ore reali e una nota.

3. **La Persona** — chi lavora: tu o il dipendente.

4. **La Giornata (il giro)** — i lavori di un giorno messi in fila, nell'ordine in cui conviene farli.

---

## Il codice parlante del cliente

Ogni cliente ha un **codice alfanumerico** che è la sua piccola *carta d'identità*: lo guardi e in un colpo d'occhio sai chi è, quanto è puntuale, quanto vale e da quanto tempo lavora con te. Come la targa di un'auto, ma che racconta una storia.

### Il formato

```
   M R 1  -  0 3  -  1 2  -  0 5
   └─┬─┘     └┬┘     └┬┘     └┬┘
  iniziali  giorni  spesa   anni
 (+contatore) per   media   insieme
            incassare
```

Esempio: `MR-03-12-05` = **Mario Rossi, ti paga in circa 3 giorni, spende in media ~600 € a lavoro, è tuo cliente da 5 anni.** Un cliente d'oro, e lo vedi al volo.

### Le quattro parti

| Parte | Cosa significa | Come si comporta |
|---|---|---|
| **Iniziali (+ contatore)** | Iniziale del nome + iniziale del cognome (Mario Rossi → `MR`). Se due clienti hanno le stesse iniziali, dal secondo in poi si aggiunge un numero: `MR`, `MR1`, `MR2`. | **Fisso** — non cambia mai. |
| **Giorni per incassare** | Media dei giorni tra l'emissione della fattura e l'incasso, su tutte le fatture pagate. Cliente nuovo senza storia: `00`. Se supera i 99, si ferma a `99` (paga lento, l'hai già capito). | **Si aggiorna** da solo. |
| **Spesa media** | La media di quanto ti paga **per ogni lavoro**, divisa per 50 (ogni unità = 50 €). Quindi `12` = ~600 €. Se la media supera i 4 950 € (99 × 50), si ferma a `99`. | **Si aggiorna** da solo. |
| **Anni insieme** | Anni trascorsi dal primo lavoro. Meno di un anno: `00`. | **Si aggiorna** da solo. |

### Il punto chiave

Tu **non scrivi mai questo codice a mano**. Il sistema lo costruisce da solo dai dati che già possiede: prende le iniziali dal nome, calcola i giorni dalle date delle fatture, la spesa dai pagamenti reali, gli anni dal primo lavoro.

È una **fotografia viva**: ogni volta che incassi un pagamento o passa un anno, il codice si riscrive da solo. Non è un'etichetta morta — è il *voto* che il cliente si guadagna dal suo stesso comportamento.

---

## Come si formano i soldi — due strade, un solo tronco

Il compenso di un lavoro può nascere in due modi diversi, e il sistema accoglie entrambi con naturalezza.

### A preventivo
Prima di iniziare concordi un prezzo fisso. Può essere:
- una **cifra unica** per tutto il lavoro;
- oppure divisa in **acconto + saldo** (una parte all'inizio, il resto alla fine).

### A ore
Segni le ore **giorno per giorno** mentre lavori (es. oggi 3 ore dal cliente Rossi). A **fine mese si sommano** da sole, e moltiplicate per la tariffa di quel cliente diventano il compenso. La **tariffa oraria è propria di ogni cliente**.

### Misto
Capita un lavoro misto: un preventivo per la parte principale + ore extra per gli imprevisti. Le due cose convivono sullo stesso lavoro e, per i conti, si **sommano in un unico importo**.

> In tutti i casi il risultato è lo stesso: nasce un **pagamento atteso** legato a quel cliente. Due strade diverse che confluiscono nello stesso tronco.

---

## Le stanze del sistema (i rami)

### 🧾 Preventivi
Una sezione dedicata, con la sua interfaccia, per **creare e gestire i preventivi**: scegli il cliente, scrivi la cifra (intera oppure acconto + saldo). Da qui nasce il pagamento atteso.

### ⏱️ Ore
Una sezione dedicata, con un'interfaccia comoda, per **segnare le ore giorno per giorno**. A fine mese si sommano da sole e diventano compenso, secondo la tariffa del cliente.

### 💶 Pagamenti
La finestra del "cosa devo ancora incassare". Ogni pagamento atteso vive qui con il suo **stato**:

```
   in attesa  →  pagato
        │
        ▼
   in ritardo
```

Con uno sguardo sai chi ha pagato, chi no, e da quanto tempo. Chiudi un pagamento cambiandone lo stato.

### 📅 Storico mensile
Lo specchio mese per mese:
- quanto **dovevi incassare** e quanto è **entrato davvero**;
- chi è ancora in debito;
- **entrate − uscite** = come è andato il mese.

### 🔧 Officina (gli strumenti)
La tua adminka privata: quali **attrezzi** hai, quanto li hai pagati. Il valore di ciò che possiedi per lavorare.

### ⛽ Spese
Tutto ciò che esce: **benzina**, materiali, e ogni altra spesa legata al lavoro. È la metà che, sottratta agli incassi, dice quanto guadagni davvero.

### 📊 Cruscotto
Il colpo d'occhio finale: **guadagnato − speso = quanto ti resta**. Da qui capisci come va l'attività senza aprire mille pagine.

---

## Due modi di guardare gli stessi lavori

Gli stessi lavori, due lenti diverse:

- **Il Calendario — il tempo.** Apri una data, inserisci il lavoro e lui si mette al suo posto. Vedi *oggi faccio questo, questo e questo*. Puoi programmare la settimana in avanti.

- **La Mappa — il luogo.** Gli stessi lavori, ma sul territorio. Vedi dove sono e ti organizzi il giro (parto da Marina, poi...) per non perdere tempo e benzina.

> La Mappa la lasciamo **per dopo**. Si parte dal Calendario. Le due viste sono indipendenti: la seconda si aggiunge senza toccare la prima.

---

## Due porte d'ingresso, due ruoli

Lo stesso sistema mostra cose diverse a seconda di chi entra.

### Centro di Comando (tu)
L'interfaccia completa. Vedi e gestisci tutto: i clienti, i lavori, i preventivi, le ore, i pagamenti, lo storico, l'officina, le spese. Da qui pianifichi e — anche da remoto — vedi come procede tutto.

### Vista Operatore (il dipendente)
Un'interfaccia **filtrata**: il dipendente vede solo quello che serve a lui.
- *Oggi questi 2-3 lavori.*
- *Ti servono questi attrezzi, questo tot di benzina.*
- *Questo è il giro consigliato.*
- Quando finisce un lavoro lo **sbarra sulla checklist** e scrive **quanto tempo** ci ha messo.

> Il sistema è già **pre-impostato**: il giorno che lo passi a un dipendente, lui entra e trova tutto pronto.

---

## Il ciclo di una giornata

```
   TU pianifichi  →  ASSEGNI il lavoro  →  L'OPERATORE esegue e segna le ore
        ↑                                            │
        │                                            ▼
   I DATI crescono  ←————————————  I conti si aggiornano (pagamenti, storico, codici)
```

Nessuno deve più chiedere "com'è andata?". È già scritto:
dove è stato, cosa ha fatto, quanto ha speso, quanto tempo ci ha messo, quanto c'è da incassare.

---

## Perché i dati sono il punto

Tutto funziona sui dati. Sono loro che:
- ti fanno vedere a colpo d'occhio come va l'attività e quanto ti resta in tasca;
- ti dicono chi deve ancora pagarti e da quanto;
- ti permettono di controllare il lavoro da remoto, senza stare addosso a nessuno;
- ti danno spunti per migliorare (un giro più corto, un lavoro che costa più del previsto);
- ti tengono in ordine quando cresci: dipendenti, pagamenti, clienti che devono pagare.

I dati non servono a controllare le persone. Servono a non perdersi.

---

## Cosa costruiamo prima, cosa dopo

L'essenziale ora, il resto si aggiunge quando serve — senza rifare niente.

| Adesso (il nucleo) | Dopo |
|---|---|
| Anagrafica clienti + codice parlante | Mappa del territorio e ottimizzazione del giro |
| Preventivi (cifra unica o acconto + saldo) | GPS dei mezzi |
| Ore (segnate giorno per giorno) | Vista Operatore per il dipendente |
| Pagamenti con stati (in attesa / pagato / in ritardo) | Fatturazione automatica |
| Storico mensile (entrate − uscite) | |
| Officina (strumenti) e Spese | |
| Cruscotto | |

---

## In sintesi

Un solo sistema, costruito attorno a **quattro cose** (Cliente, Lavoro, Persona, Giornata),
con il **Cliente come radice** e un **codice parlante** che racconta ogni cliente in un colpo d'occhio.
Due strade per i soldi (**preventivo** e **ore**) che confluiscono nei **pagamenti** e nello **storico mensile**,
due lenti (**Calendario** e **Mappa**) e due ruoli (**Comando** e **Operatore**).

Semplice nel cuore, pronto a crescere.
Un'attività che vive nei dati e funziona anche senza di te.
