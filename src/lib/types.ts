// Dominio NEXUS — configuratore di bozze 3D.
// ID = ULID, updatedAt + tombstone `deleted` per sync futuro.

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

// ————— Bozza —————

export interface Bozza {
  id: string;
  nome: string;
  scena: Scena3D;
  createdAt: string; // ISO
  updatedAt: string;
  deleted: 0 | 1;
}
