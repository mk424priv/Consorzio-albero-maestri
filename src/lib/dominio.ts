import type {
  Ambiente3D,
  CategoriaCosto,
  StatoProgetto,
  TipoProgetto,
} from "./types";

export const TIPI_PROGETTO: Record<TipoProgetto, { label: string; icona: string }> = {
  auto: { label: "Restauro auto", icona: "🔧" },
  casa: { label: "Lavori in casa", icona: "🏠" },
  mobili: { label: "Mobili", icona: "🪑" },
  giardino: { label: "Giardino", icona: "🌿" },
  van: { label: "Van / Camper", icona: "🚐" },
  acquisto: { label: "Acquisto", icona: "🛒" },
  tech: { label: "Tech", icona: "⚡" },
  altro: { label: "Altro", icona: "◇" },
};

export const STATI_PROGETTO: Record<
  StatoProgetto,
  { label: string; colore: string }
> = {
  idea: { label: "IDEA", colore: "var(--color-ghost)" },
  pianificazione: { label: "PIANIFICAZIONE", colore: "var(--color-cyan)" },
  "in-corso": { label: "IN CORSO", colore: "var(--color-neon)" },
  "in-pausa": { label: "IN PAUSA", colore: "var(--color-amber)" },
  completato: { label: "COMPLETATO", colore: "var(--color-ice)" },
};

export const CATEGORIE_COSTO: Record<CategoriaCosto, string> = {
  materiali: "Materiali",
  attrezzi: "Attrezzi",
  componenti: "Componenti",
  manodopera: "Manodopera",
  trasporto: "Trasporto",
  altro: "Altro",
};

export const AMBIENTI_3D: Record<
  Ambiente3D,
  { label: string; larghezza: number; profondita: number; altezza: number }
> = {
  giardino: { label: "Giardino", larghezza: 20, profondita: 14, altezza: 0 },
  stanza: { label: "Stanza", larghezza: 5, profondita: 4, altezza: 2.7 },
  van: { label: "Van / Camper", larghezza: 1.9, profondita: 4.2, altezza: 1.9 },
  garage: { label: "Garage", larghezza: 6, profondita: 5, altezza: 2.4 },
};

export const ORDINE_TIPI = Object.keys(TIPI_PROGETTO) as TipoProgetto[];
export const ORDINE_STATI = Object.keys(STATI_PROGETTO) as StatoProgetto[];
export const ORDINE_CATEGORIE = Object.keys(CATEGORIE_COSTO) as CategoriaCosto[];
export const ORDINE_AMBIENTI = Object.keys(AMBIENTI_3D) as Ambiente3D[];
