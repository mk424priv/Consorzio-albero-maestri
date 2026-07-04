import type { Ambiente3D } from "./types";

export const AMBIENTI_3D: Record<
  Ambiente3D,
  { label: string; larghezza: number; profondita: number; altezza: number }
> = {
  giardino: { label: "Giardino", larghezza: 20, profondita: 14, altezza: 0 },
  stanza: { label: "Stanza", larghezza: 5, profondita: 4, altezza: 2.7 },
  van: { label: "Van / Camper", larghezza: 1.9, profondita: 4.2, altezza: 1.9 },
  garage: { label: "Garage", larghezza: 6, profondita: 5, altezza: 2.4 },
};

export const ORDINE_AMBIENTI = Object.keys(AMBIENTI_3D) as Ambiente3D[];
