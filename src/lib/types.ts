// Dominio NEXUS — centro di controllo dei progetti personali.
// Derived-not-stored: i totali si ricalcolano alla lettura (src/lib/costi.ts);
// il DB salva solo fatti. ID = ULID, updatedAt + tombstone `deleted` per sync futuro.

export type TipoProgetto =
  | "auto"      // restauro auto / moto
  | "casa"      // lavori in casa
  | "mobili"    // costruzione mobili
  | "giardino"  // progettazione esterni
  | "van"       // allestimento van / camper
  | "acquisto"  // acquisto pianificato
  | "tech"      // progetti software / elettronica
  | "altro";

export type StatoProgetto =
  | "idea"
  | "pianificazione"
  | "in-corso"
  | "in-pausa"
  | "completato";

export type CategoriaCosto =
  | "materiali"
  | "attrezzi"
  | "componenti"
  | "manodopera"
  | "trasporto"
  | "altro";

export interface VoceCosto {
  id: string;
  descrizione: string;
  categoria: CategoriaCosto;
  quantita: number;
  prezzoUnitario: number; // in euro
  acquistato: boolean;
  link?: string; // link al prodotto (per gli acquisti)
}

// ————— Bozza 3D —————

export type Ambiente3D = "giardino" | "stanza" | "van" | "garage";

export type TipoOggetto3D =
  | "box"
  | "capanna"
  | "albero"
  | "pianta"
  | "tavolo"
  | "sedia"
  | "armadio"
  | "letto"
  | "divano"
  | "cucina"
  | "auto";

export interface OggettoScena {
  id: string;
  tipo: TipoOggetto3D;
  nome: string;
  posizione: [number, number, number];
  rotazioneY: number; // radianti
  scala: [number, number, number];
  colore: string;
}

export interface Scena3D {
  ambiente: Ambiente3D;
  // dimensioni dello spazio in metri
  larghezza: number;
  profondita: number;
  altezza: number;
  oggetti: OggettoScena[];
}

// ————— Progetto —————

export interface Progetto {
  id: string;
  nome: string;
  tipo: TipoProgetto;
  stato: StatoProgetto;
  descrizione: string;
  budget: number | null; // euro; null = nessun budget fissato
  costi: VoceCosto[];
  scena: Scena3D | null;
  createdAt: string; // ISO
  updatedAt: string;
  deleted: 0 | 1;
}

// ————— Integrazioni (web-app esterne come sotto-applicazioni) —————

export interface Integrazione {
  id: string;
  nome: string;
  url: string;
  descrizione: string;
  // "iframe" = incorporata dentro NEXUS; "link" = si apre in una nuova scheda
  modalita: "iframe" | "link";
  createdAt: string;
  updatedAt: string;
  deleted: 0 | 1;
}
