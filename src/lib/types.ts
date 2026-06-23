// Modello dati di Albero Maestri 2.0 (lato client).
// Le date sono stringhe ISO (yyyy-mm-dd): comode per localStorage e per gli
// <input type="date">. Il cliente resta la radice; la squadra (operatori) e i
// loro compensi sono ora entità di primo piano.

import type {
  Modalita,
  StatoLavoro,
  TipoCompenso,
  TipoPreventivo,
  OriginePagamento,
  StatoPagamento,
  CategoriaSpesa,
  StatoAttrezzo,
  RuoloOperatore,
  MetodoPagamento,
} from "./dominio";

export type ISODate = string;

export interface Cliente {
  id: string;
  nome: string;
  cognome: string;
  inizialiCodice: string; // parte fissa del codice parlante (es. MR, MR1)
  telefono?: string | null;
  email?: string | null;
  luogo?: string | null;
  tariffaOraria?: number | null; // €/h fatturati al cliente
  modalitaPredefinita: Modalita;
  note?: string | null;
  creatoIl: ISODate;
}

export interface Operatore {
  id: string;
  nome: string;
  ruolo: RuoloOperatore; // titolare | collaboratore
  tariffaOraria?: number | null; // €/h riconosciuti all'operatore (costo)
  telefono?: string | null;
  attivo: boolean;
  note?: string | null;
  creatoIl: ISODate;
}

// Partecipante a un lavoro: chi + costo orario "congelato" al momento.
export interface PartecipanteLavoro {
  collaboratoreId: string;
  tariffaSnapshot: number; // €/h costo (mia spesa), fissato alla creazione
  oreTotale?: number; // per conteggio="totale"
}

// Riga giornaliera (conteggio="per_giorni"): ore di ogni partecipante in un giorno.
export interface RigaGiorno {
  data: ISODate;
  ore: Record<string, number>; // collaboratoreId -> ore
}

export interface Lavoro {
  id: string;
  clienteId: string;
  titolo: string;
  descrizione?: string | null;
  luogo?: string | null;
  data: ISODate;
  ordineNelGiorno?: number | null;
  stato: StatoLavoro; // legacy (da_fare/in_corso/fatto) — sincronizzato da `fase`
  tipoCompenso: TipoCompenso; // legacy — sincronizzato da `modo`
  durataPrevistaOre?: number | null;
  operatoreId?: string | null; // legacy (primo partecipante)
  note?: string | null;
  creatoIl: ISODate;
  // --- CANONE (tutti opzionali → retrocompatibile con i lavori legacy) ---
  fase?: "fatto" | "da_fare"; // asse temporale
  modo?: "preventivo" | "ore"; // asse di compenso
  conteggio?: "totale" | "per_giorni"; // come si contano le ore
  periodo?: { dal: ISODate; al: ISODate } | null; // etichetta per preventivo
  prezzo?: number | null; // per preventivo
  tariffaClienteSnapshot?: number | null; // €/h cliente fissato (calcolo ore stabile)
  partecipanti?: PartecipanteLavoro[]; // min. io
  contaMieOreComeCosto?: boolean; // default false (le mie ore = profitto)
}

export interface Preventivo {
  id: string;
  clienteId: string;
  lavoroId?: string | null;
  tipo: TipoPreventivo;
  importoTotale: number;
  importoAcconto?: number | null;
  importoSaldo?: number | null;
  dataEmissione: ISODate;
  note?: string | null;
}

export interface RegistrazioneOre {
  id: string;
  clienteId: string;
  lavoroId?: string | null;
  operatoreId?: string | null;
  data: ISODate;
  ore: number;
  note?: string | null;
}

export interface Pagamento {
  id: string;
  clienteId: string;
  lavoroId?: string | null;
  preventivoId?: string | null;
  origine: OriginePagamento;
  importoAtteso: number;
  importoIncassato: number;
  stato: StatoPagamento;
  dataEmissione: ISODate;
  dataScadenza?: ISODate | null;
  dataIncasso?: ISODate | null;
  note?: string | null;
}

// Soldi in USCITA verso un operatore (saldo delle sue ore).
export interface CompensoOperatore {
  id: string;
  operatoreId: string;
  importo: number;
  data: ISODate;
  periodo?: string | null; // "YYYY-MM"
  metodo?: MetodoPagamento | null;
  note?: string | null;
}

export interface Spesa {
  id: string;
  categoria: CategoriaSpesa;
  importo: number;
  data: ISODate;
  descrizione?: string | null;
  clienteId?: string | null;
  lavoroId?: string | null;
}

export interface Attrezzo {
  id: string;
  nome: string;
  costoAcquisto?: number | null;
  dataAcquisto?: ISODate | null;
  stato: StatoAttrezzo;
  note?: string | null;
}

export interface Database {
  clienti: Cliente[];
  operatori: Operatore[];
  lavori: Lavoro[];
  preventivi: Preventivo[];
  ore: RegistrazioneOre[];
  pagamenti: Pagamento[];
  compensi: CompensoOperatore[];
  spese: Spesa[];
  attrezzi: Attrezzo[];
}
