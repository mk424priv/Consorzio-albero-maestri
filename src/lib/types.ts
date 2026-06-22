// Modello dati di Albero Maestri (lato client).
// Le date sono stringhe ISO (yyyy-mm-dd o ISO completa): comode da
// serializzare in localStorage e da usare negli <input type="date">.

import type {
  Modalita,
  StatoLavoro,
  TipoCompenso,
  TipoPreventivo,
  OriginePagamento,
  StatoPagamento,
  CategoriaSpesa,
  StatoAttrezzo,
  Ruolo,
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
  tariffaOraria?: number | null;
  modalitaPredefinita: Modalita;
  note?: string | null;
  creatoIl: ISODate;
}

export interface Persona {
  id: string;
  nome: string;
  ruolo: Ruolo;
  attivo: boolean;
}

export interface Lavoro {
  id: string;
  clienteId: string;
  titolo: string;
  descrizione?: string | null;
  luogo?: string | null;
  data: ISODate;
  ordineNelGiorno?: number | null;
  stato: StatoLavoro;
  tipoCompenso: TipoCompenso;
  durataPrevistaOre?: number | null;
  personaId?: string | null;
  note?: string | null;
  creatoIl: ISODate;
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
  personaId?: string | null;
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
  persone: Persona[];
  lavori: Lavoro[];
  preventivi: Preventivo[];
  ore: RegistrazioneOre[];
  pagamenti: Pagamento[];
  spese: Spesa[];
  attrezzi: Attrezzo[];
}
