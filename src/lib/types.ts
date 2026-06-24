import type {
  CategoriaSpesa,
  Conteggio,
  Fase,
  FasciaGiornata,
  MetodoPagamento,
  Modalita,
  Modo,
  OriginePagamento,
  RuoloOperatore,
  StatoPreventivo,
} from "./dominio";

/*
  Modello canonico pulito (greenfield): nessun campo legacy.
  Ogni entita' porta id (ULID), updatedAt e tombstone `deleted` per il
  futuro sync (canone 02 §1.4). I derivati NON sono campi (§2.1).
*/

export interface Cliente {
  id: string;
  nome: string;
  cognome?: string;
  /** Parte fissa del codice parlante (es. "MR", "MR1"). */
  inizialiCodice: string;
  telefono?: string;
  email?: string;
  luogo?: string;
  /** €/ora fatturati al cliente (ricavo). null = non impostata. */
  tariffaOraria?: number | null;
  modalitaPredefinita: Modalita;
  note?: string;
  creatoIl: string;
  updatedAt: string;
  rev?: number;
  deleted?: boolean;
}

export interface Operatore {
  id: string;
  nome: string;
  ruolo: RuoloOperatore;
  /** €/ora di costo. Per il titolare ("io") di norma null. */
  tariffaOraria?: number | null;
  telefono?: string;
  attivo: boolean;
  note?: string;
  creatoIl: string;
  updatedAt: string;
  rev?: number;
  deleted?: boolean;
}

export interface PartecipanteLavoro {
  collaboratoreId: string;
  /** €/ora di costo congelata alla creazione del lavoro. */
  tariffaSnapshot: number;
  /** Input per conteggio = "totale" (le ore reali vivono comunque in `ore`). */
  oreTotale?: number;
}

export interface Lavoro {
  id: string;
  clienteId?: string;
  titolo: string;
  descrizione?: string;
  luogo?: string;
  data: string; // ISO yyyy-mm-dd
  ordineNelGiorno?: number;
  // assi canoniche
  fase: Fase;
  modo: Modo;
  conteggio: Conteggio;
  // preventivo
  periodo?: { dal: string; al: string } | null;
  prezzo?: number | null;
  /** Ciclo di vita del preventivo (rilevante solo se modo = "preventivo"). */
  statoPreventivo?: StatoPreventivo;
  /** Collocazione nel giorno: "orario" usa oraInizio/oraFine; le altre sono fasce grossolane. */
  fascia?: FasciaGiornata;
  // fascia oraria opzionale
  oraInizio?: string;
  oraFine?: string;
  /** €/ora cliente congelata: calcolo stabile anche se la tariffa cambia. */
  tariffaClienteSnapshot?: number | null;
  partecipanti: PartecipanteLavoro[];
  /** Default false: le mie ore entrano nel lordo ma non nel costo. */
  contaMieOreComeCosto?: boolean;
  note?: string;
  creatoIl: string;
  updatedAt: string;
  rev?: number;
  deleted?: boolean;
}

/** Unica fonte delle ore reali per tutti i calcoli. */
export interface RegistrazioneOre {
  id: string;
  clienteId?: string;
  lavoroId?: string;
  operatoreId?: string;
  data: string;
  ore: number;
  note?: string;
  creatoIl?: string;
  updatedAt: string;
  rev?: number;
  deleted?: boolean;
}

/** Pagamento del cliente (denaro IN ENTRATA). */
export interface Pagamento {
  id: string;
  clienteId: string;
  lavoroId?: string;
  origine: OriginePagamento;
  importoAtteso: number;
  importoIncassato: number;
  dataEmissione: string;
  dataScadenza?: string;
  dataIncasso?: string;
  metodo?: MetodoPagamento;
  note?: string;
  creatoIl?: string;
  updatedAt: string;
  rev?: number;
  deleted?: boolean;
}

/** Compenso all'operatore (denaro IN USCITA). */
export interface CompensoOperatore {
  id: string;
  operatoreId: string;
  importo: number;
  data: string;
  periodo?: string; // "YYYY-MM"
  metodo?: MetodoPagamento;
  note?: string;
  creatoIl?: string;
  updatedAt: string;
  rev?: number;
  deleted?: boolean;
}

export interface Spesa {
  id: string;
  categoria: CategoriaSpesa;
  importo: number;
  data: string;
  descrizione?: string;
  clienteId?: string;
  lavoroId?: string;
  attrezzoId?: string;
  creatoIl?: string;
  updatedAt: string;
  rev?: number;
  deleted?: boolean;
}

export type CategoriaAttrezzo = "auto" | "motore" | "elettrico" | "manuale";

/** Attrezzo/veicolo del «Garage». */
export interface Attrezzo {
  id: string;
  nome: string;
  categoria: CategoriaAttrezzo;
  prezzo?: number;
  dataAcquisto?: string; // ISO yyyy-mm-dd
  caratteristiche?: string;
  note?: string;
  // solo veicoli (categoria "auto")
  consumoMedio?: number; // litri / 100 km
  carburante?: string; // benzina · diesel · GPL · elettrico
  prezzoCarburante?: number; // €/litro
  updatedAt: string;
  rev?: number;
  deleted?: boolean;
}

/** Snapshot in memoria (idratato da Dexie) su cui operano i calcoli in src/lib. */
export interface Dati {
  clienti: Cliente[];
  operatori: Operatore[];
  lavori: Lavoro[];
  ore: RegistrazioneOre[];
  pagamenti: Pagamento[];
  compensi: CompensoOperatore[];
  spese: Spesa[];
  attrezzi: Attrezzo[];
}

export const DATI_VUOTI: Dati = {
  clienti: [],
  operatori: [],
  lavori: [],
  ore: [],
  pagamenti: [],
  compensi: [],
  spese: [],
  attrezzi: [],
};

export type CollezioneKey = keyof Dati;
