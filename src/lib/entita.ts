// Mappa centrale delle "tinte-guida" per entità e degli stati.
// IMPORTANTE: le classi sono stringhe LETTERALI (non composte a runtime),
// così Tailwind le rileva e le genera.

import {
  Banknote,
  Clock,
  Coins,
  Fuel,
  HandCoins,
  Hammer,
  ReceiptText,
  Sprout,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type ChiaveEntita =
  | "cliente"
  | "operatore"
  | "lavoro"
  | "preventivo"
  | "entrata"
  | "uscita"
  | "spesa"
  | "patrimonio"
  | "ore";

export interface MetaEntita {
  label: string;
  Icon: LucideIcon;
  soft: string; // sfondo tenue + testo
  solid: string; // sfondo pieno + testo bianco
  chip: string; // badge tenue con anello
  dot: string; // pallino colorato
  ring: string; // anello/bordo colorato
  text: string; // solo testo
  grad: string; // gradiente (per avatar/hero)
}

export const ENTITA: Record<ChiaveEntita, MetaEntita> = {
  cliente: {
    label: "Cliente",
    Icon: Sprout,
    soft: "bg-cliente-50 text-cliente-600",
    solid: "bg-cliente-500 text-white",
    chip: "bg-cliente-50 text-cliente-600 ring-1 ring-cliente-100",
    dot: "bg-cliente-500",
    ring: "ring-cliente-100",
    text: "text-cliente-600",
    grad: "bg-gradient-to-br from-cliente-500 to-brand-700",
  },
  operatore: {
    label: "Operatore",
    Icon: Users,
    soft: "bg-operatore-50 text-operatore-600",
    solid: "bg-operatore-500 text-white",
    chip: "bg-operatore-50 text-operatore-600 ring-1 ring-operatore-100",
    dot: "bg-operatore-500",
    ring: "ring-operatore-100",
    text: "text-operatore-600",
    grad: "bg-gradient-to-br from-operatore-500 to-operatore-600",
  },
  lavoro: {
    label: "Lavoro",
    Icon: Hammer,
    soft: "bg-lavoro-50 text-lavoro-600",
    solid: "bg-lavoro-500 text-white",
    chip: "bg-lavoro-50 text-lavoro-600 ring-1 ring-lavoro-100",
    dot: "bg-lavoro-500",
    ring: "ring-lavoro-100",
    text: "text-lavoro-600",
    grad: "bg-gradient-to-br from-lavoro-500 to-lavoro-600",
  },
  preventivo: {
    label: "Preventivo",
    Icon: ReceiptText,
    soft: "bg-preventivo-50 text-preventivo-600",
    solid: "bg-preventivo-500 text-white",
    chip: "bg-preventivo-50 text-preventivo-600 ring-1 ring-preventivo-100",
    dot: "bg-preventivo-500",
    ring: "ring-preventivo-100",
    text: "text-preventivo-600",
    grad: "bg-gradient-to-br from-preventivo-500 to-preventivo-600",
  },
  entrata: {
    label: "Incasso",
    Icon: Banknote,
    soft: "bg-entrata-50 text-entrata-600",
    solid: "bg-entrata-500 text-white",
    chip: "bg-entrata-50 text-entrata-600 ring-1 ring-entrata-100",
    dot: "bg-entrata-500",
    ring: "ring-entrata-100",
    text: "text-entrata-600",
    grad: "bg-gradient-to-br from-entrata-500 to-entrata-600",
  },
  uscita: {
    label: "Compenso",
    Icon: HandCoins,
    soft: "bg-uscita-50 text-uscita-600",
    solid: "bg-uscita-500 text-white",
    chip: "bg-uscita-50 text-uscita-600 ring-1 ring-uscita-100",
    dot: "bg-uscita-500",
    ring: "ring-uscita-100",
    text: "text-uscita-600",
    grad: "bg-gradient-to-br from-uscita-500 to-uscita-600",
  },
  spesa: {
    label: "Spesa",
    Icon: Fuel,
    soft: "bg-spesa-50 text-spesa-600",
    solid: "bg-spesa-500 text-white",
    chip: "bg-spesa-50 text-spesa-600 ring-1 ring-spesa-100",
    dot: "bg-spesa-500",
    ring: "ring-spesa-100",
    text: "text-spesa-600",
    grad: "bg-gradient-to-br from-spesa-500 to-spesa-600",
  },
  patrimonio: {
    label: "Patrimonio",
    Icon: Wrench,
    soft: "bg-patrimonio-50 text-patrimonio-600",
    solid: "bg-patrimonio-500 text-white",
    chip: "bg-patrimonio-50 text-patrimonio-600 ring-1 ring-patrimonio-100",
    dot: "bg-patrimonio-500",
    ring: "ring-patrimonio-100",
    text: "text-patrimonio-600",
    grad: "bg-gradient-to-br from-patrimonio-500 to-patrimonio-600",
  },
  ore: {
    label: "Ore",
    Icon: Clock,
    soft: "bg-operatore-50 text-operatore-600",
    solid: "bg-operatore-500 text-white",
    chip: "bg-operatore-50 text-operatore-600 ring-1 ring-operatore-100",
    dot: "bg-operatore-500",
    ring: "ring-operatore-100",
    text: "text-operatore-600",
    grad: "bg-gradient-to-br from-operatore-500 to-operatore-600",
  },
};

export { Coins };

/* ---- Tono semantico per gli stati (badge) ---- */
export type Tono = "success" | "warn" | "danger" | "info" | "neutral" | "brand";

export const TONO_CLASSI: Record<Tono, string> = {
  success: "bg-success-soft text-success",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  neutral: "bg-[#eef1ea] text-muted",
  brand: "bg-brand-50 text-brand-600",
};

export const STATO_PAGAMENTO_TONO: Record<string, Tono> = {
  in_attesa: "warn",
  in_ritardo: "danger",
  pagato: "success",
};
export const STATO_LAVORO_TONO: Record<string, Tono> = {
  da_fare: "neutral",
  in_corso: "warn",
  fatto: "success",
};
export const STATO_COMPENSO_TONO: Record<string, Tono> = {
  da_pagare: "warn",
  parziale: "info",
  saldato: "success",
};
export const STATO_ATTREZZO_TONO: Record<string, Tono> = {
  ok: "success",
  manutenzione: "warn",
  dismesso: "neutral",
};
