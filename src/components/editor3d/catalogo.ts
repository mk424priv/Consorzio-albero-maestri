import type { Ambiente3D, TipoOggetto3D } from "@/lib/types";

export interface DefOggetto {
  tipo: TipoOggetto3D;
  nome: string;
  icona: string;
  colore: string; // colore iniziale, poi personalizzabile
}

// Catalogo di oggetti parametrici (primitive three.js, ~metri reali).
export const CATALOGO: DefOggetto[] = [
  { tipo: "box", nome: "Volume", icona: "▦", colore: "#8fa3b8" },
  { tipo: "capanna", nome: "Capanna", icona: "⌂", colore: "#b08a5e" },
  { tipo: "albero", nome: "Albero", icona: "♠", colore: "#3f9e5f" },
  { tipo: "pianta", nome: "Pianta", icona: "❀", colore: "#57b06b" },
  { tipo: "tavolo", nome: "Tavolo", icona: "π", colore: "#a97c50" },
  { tipo: "sedia", nome: "Sedia", icona: "ℎ", colore: "#c9a06a" },
  { tipo: "armadio", nome: "Armadio", icona: "▯", colore: "#7d6248" },
  { tipo: "letto", nome: "Letto", icona: "▭", colore: "#7f8fb8" },
  { tipo: "divano", nome: "Divano", icona: "◗", colore: "#5f7d99" },
  { tipo: "cucina", nome: "Cucina / mobile van", icona: "▤", colore: "#96876e" },
  { tipo: "auto", nome: "Auto", icona: "⌁", colore: "#b8434e" },
];

// Suggerimenti per ambiente: quali oggetti mostrare per primi.
export const SUGGERITI: Record<Ambiente3D, TipoOggetto3D[]> = {
  giardino: ["capanna", "albero", "pianta", "tavolo", "sedia", "box"],
  stanza: ["letto", "armadio", "divano", "tavolo", "sedia", "pianta", "box"],
  van: ["cucina", "letto", "armadio", "box", "sedia"],
  garage: ["auto", "box", "tavolo", "armadio"],
};
