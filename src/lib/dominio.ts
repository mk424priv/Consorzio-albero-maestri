// Assi canoniche del lavoro + enum di dominio con etichette italiane. (canone 02 §2.6, §3)

// ── Assi del lavoro ──
export type Fase = "fatto" | "da_fare"; // temporale: svolto | programmato
export type Modo = "preventivo" | "ore"; // compenso
export type Conteggio = "totale" | "per_giorni"; // conteggio ore
export type StatoIncasso = "non_pagato" | "parziale" | "pagato"; // per-lavoro

// ── Altri enum ──
export type Modalita = "preventivo" | "ore"; // modo predefinito del cliente
export type RuoloOperatore = "titolare" | "collaboratore";
export type OriginePagamento = "preventivo" | "acconto" | "saldo" | "ore" | "manuale";
export type StatoPagamento = "in_attesa" | "pagato" | "in_ritardo"; // per-pagamento (invoice)
export type StatoCompenso = "da_pagare" | "parziale" | "saldato"; // per-operatore
export type CategoriaSpesa = "benzina" | "materiali" | "attrezzi" | "altro";
export type MetodoPagamento = "contanti" | "bonifico" | "altro";

export const ETICHETTE: Record<string, string> = {
  // modo / modalita / origine
  preventivo: "A preventivo",
  ore: "A ore",
  acconto: "Acconto",
  saldo: "Saldo",
  manuale: "Manuale",
  // fase
  fatto: "Fatto",
  da_fare: "Da fare",
  // conteggio
  totale: "Totale",
  per_giorni: "A giornate",
  // stato incasso
  non_pagato: "Non pagato",
  parziale: "Parziale",
  pagato: "Pagato",
  // stato pagamento
  in_attesa: "In attesa",
  in_ritardo: "In ritardo",
  // stato compenso
  da_pagare: "Da pagare",
  saldato: "Saldato",
  // categoria spesa
  benzina: "Benzina",
  materiali: "Materiali",
  attrezzi: "Attrezzi",
  altro: "Altro",
  // metodo
  contanti: "Contanti",
  bonifico: "Bonifico",
  // ruolo
  titolare: "Titolare",
  collaboratore: "Collaboratore",
};

export function etichetta(valore?: string | null): string {
  if (valore == null) return "—";
  return ETICHETTE[valore] ?? valore;
}

// ── Toni semantici per i badge ──
export type Tono = "positivo" | "attenzione" | "critico" | "lichene" | "ottone" | "neutro";

export const TONO_INCASSO: Record<StatoIncasso, Tono> = {
  non_pagato: "critico",
  parziale: "attenzione",
  pagato: "positivo",
};
export const TONO_PAGAMENTO: Record<StatoPagamento, Tono> = {
  in_attesa: "attenzione",
  pagato: "positivo",
  in_ritardo: "critico",
};
export const TONO_COMPENSO: Record<StatoCompenso, Tono> = {
  da_pagare: "attenzione",
  parziale: "lichene",
  saldato: "positivo",
};
