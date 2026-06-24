// Registro eventi unificato (canone 08 §6.1): incassi (+), compensi/prelievi (−), spese (−).
import { chiaveMese } from "./format";
import type { Dati } from "./types";

export type TipoMovimento = "incasso" | "compenso" | "prelievo" | "spesa";

export interface Movimento {
  id: string;
  tipo: TipoMovimento;
  data: string; // data contabile
  importo: number; // segno: + entrate, − uscite
  descrizione: string;
  clienteId?: string;
  operatoreId?: string;
  lavoroId?: string;
}

/** Tutti i fatti-evento come flusso ordinato (più recente prima). */
export function movimenti(dati: Dati): Movimento[] {
  const nomeCliente = (id?: string) => dati.clienti.find((c) => c.id === id)?.nome ?? "—";
  const nomeOp = (id?: string) => dati.operatori.find((o) => o.id === id)?.nome ?? "—";
  const out: Movimento[] = [];

  for (const p of dati.pagamenti) {
    if (p.deleted || !(p.importoIncassato > 0) || !p.dataIncasso) continue;
    out.push({ id: `pag-${p.id}`, tipo: "incasso", data: p.dataIncasso, importo: p.importoIncassato, descrizione: `Incasso · ${nomeCliente(p.clienteId)}`, clienteId: p.clienteId, lavoroId: p.lavoroId });
  }
  for (const c of dati.compensi) {
    if (c.deleted) continue;
    const prelievo = c.note === "prelievo";
    out.push({ id: `comp-${c.id}`, tipo: prelievo ? "prelievo" : "compenso", data: c.data, importo: -c.importo, descrizione: prelievo ? "Prelievo · io" : `Compenso · ${nomeOp(c.operatoreId)}`, operatoreId: c.operatoreId });
  }
  for (const s of dati.spese) {
    if (s.deleted) continue;
    out.push({ id: `spe-${s.id}`, tipo: "spesa", data: s.data, importo: -s.importo, descrizione: `Spesa · ${s.descrizione || s.categoria}`, clienteId: s.clienteId, lavoroId: s.lavoroId });
  }

  return out.sort((a, b) => b.data.localeCompare(a.data) || b.id.localeCompare(a.id));
}

export function movimentiMese(dati: Dati, mese: string): Movimento[] {
  return movimenti(dati).filter((m) => chiaveMese(m.data) === mese);
}
