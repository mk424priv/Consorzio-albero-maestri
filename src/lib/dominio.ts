// Valori "enum" del dominio (modellati come stringhe per portabilità DB)
// + etichette in italiano per l'interfaccia.

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

export const CATEGORIA_SPESA = [
  "benzina",
  "materiali",
  "attrezzi",
  "altro",
] as const;
export type CategoriaSpesa = (typeof CATEGORIA_SPESA)[number];

export const STATO_ATTREZZO = ["ok", "manutenzione", "dismesso"] as const;
export type StatoAttrezzo = (typeof STATO_ATTREZZO)[number];

export const RUOLO = ["titolare", "operatore"] as const;
export type Ruolo = (typeof RUOLO)[number];

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
  // categoria spesa
  benzina: "Benzina",
  materiali: "Materiali",
  attrezzi: "Attrezzi",
  altro: "Altro",
  // stato attrezzo
  ok: "In uso",
  manutenzione: "In manutenzione",
  dismesso: "Dismesso",
  // ruolo
  titolare: "Titolare",
  operatore: "Operatore",
};

export function etichetta(valore: string | null | undefined): string {
  if (!valore) return "—";
  return ETICHETTE[valore] ?? valore;
}
