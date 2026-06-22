// Valori "enum" del dominio (stringhe) + etichette in italiano per l'interfaccia.

export const MODALITA = ["preventivo", "ore", "misto"] as const;
export type Modalita = (typeof MODALITA)[number];

export const STATO_LAVORO = ["da_fare", "in_corso", "fatto"] as const;
export type StatoLavoro = (typeof STATO_LAVORO)[number];

export const TIPO_COMPENSO = ["preventivo", "ore", "misto"] as const;
export type TipoCompenso = (typeof TIPO_COMPENSO)[number];

export const TIPO_PREVENTIVO = ["unico", "acconto_saldo"] as const;
export type TipoPreventivo = (typeof TIPO_PREVENTIVO)[number];

export const ORIGINE_PAGAMENTO = [
  "preventivo",
  "acconto",
  "saldo",
  "ore",
  "manuale",
] as const;
export type OriginePagamento = (typeof ORIGINE_PAGAMENTO)[number];

export const STATO_PAGAMENTO = ["in_attesa", "pagato", "in_ritardo"] as const;
export type StatoPagamento = (typeof STATO_PAGAMENTO)[number];

export const STATO_COMPENSO = ["da_pagare", "parziale", "saldato"] as const;
export type StatoCompenso = (typeof STATO_COMPENSO)[number];

export const CATEGORIA_SPESA = [
  "benzina",
  "materiali",
  "attrezzi",
  "altro",
] as const;
export type CategoriaSpesa = (typeof CATEGORIA_SPESA)[number];

export const STATO_ATTREZZO = ["ok", "manutenzione", "dismesso"] as const;
export type StatoAttrezzo = (typeof STATO_ATTREZZO)[number];

export const RUOLO_OPERATORE = ["titolare", "collaboratore"] as const;
export type RuoloOperatore = (typeof RUOLO_OPERATORE)[number];

export const METODO_PAGAMENTO = ["contanti", "bonifico", "altro"] as const;
export type MetodoPagamento = (typeof METODO_PAGAMENTO)[number];

export const ETICHETTE: Record<string, string> = {
  // modalita / tipo compenso
  preventivo: "A preventivo",
  ore: "A ore",
  misto: "Misto",
  // stato lavoro
  da_fare: "Da fare",
  in_corso: "In corso",
  fatto: "Fatto",
  // tipo preventivo
  unico: "Cifra unica",
  acconto_saldo: "Acconto + saldo",
  // origine pagamento
  acconto: "Acconto",
  saldo: "Saldo",
  manuale: "Manuale",
  // stato pagamento
  in_attesa: "In attesa",
  pagato: "Pagato",
  in_ritardo: "In ritardo",
  // stato compenso
  da_pagare: "Da pagare",
  parziale: "Parziale",
  saldato: "Saldato",
  // categoria spesa
  benzina: "Benzina",
  materiali: "Materiali",
  attrezzi: "Attrezzi",
  altro: "Altro",
  // stato attrezzo
  ok: "In uso",
  manutenzione: "Manutenzione",
  dismesso: "Dismesso",
  // ruolo
  titolare: "Titolare",
  collaboratore: "Collaboratore",
  // metodo
  contanti: "Contanti",
  bonifico: "Bonifico",
};

export function etichetta(valore: string | null | undefined): string {
  if (!valore) return "—";
  return ETICHETTE[valore] ?? valore;
}
