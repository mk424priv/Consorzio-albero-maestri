// Motore dei conti: aggregazioni derivate dai dati.
// Tutto ciò che è calcolabile vive qui — mai duplicato a mano.

import { arrotonda, chiaveMese } from "./format";
import type { StatoPagamento } from "./dominio";
import type { Database, Pagamento } from "./types";

export function statoCalcolato(
  p: Pick<Pagamento, "importoAtteso" | "importoIncassato" | "stato" | "dataScadenza">,
  oggi = new Date(),
): StatoPagamento {
  if (p.importoIncassato >= p.importoAtteso && p.importoAtteso > 0) return "pagato";
  if (p.stato === "pagato") return "pagato";
  if (p.dataScadenza && new Date(p.dataScadenza) < oggi) return "in_ritardo";
  return "in_attesa";
}

export function giorniRitardo(
  dataScadenza: string | null | undefined,
  oggi = new Date(),
): number {
  if (!dataScadenza) return 0;
  const g = Math.floor((oggi.getTime() - new Date(dataScadenza).getTime()) / 86_400_000);
  return Math.max(0, g);
}

export type RiepilogoCliente = {
  totaleAtteso: number;
  totaleIncassato: number;
  saldoDaIncassare: number;
  numeroLavori: number;
  oreTotali: number;
  spese: number; // spese attribuite al cliente
  costoManodopera: number; // Σ ore × tariffa dell'operatore
  valoreFatturabile: number; // Σ ore × tariffa del cliente
  margine: number; // incassato − spese − costo manodopera
};

export function riepilogoCliente(db: Database, clienteId: string): RiepilogoCliente {
  const pagamenti = db.pagamenti.filter((p) => p.clienteId === clienteId);
  const totaleAtteso = arrotonda(pagamenti.reduce((a, p) => a + p.importoAtteso, 0));
  const totaleIncassato = arrotonda(pagamenti.reduce((a, p) => a + p.importoIncassato, 0));

  const cliente = db.clienti.find((c) => c.id === clienteId);
  const tariffaCliente = cliente?.tariffaOraria ?? 0;
  const tariffaOp = new Map(db.operatori.map((o) => [o.id, o.tariffaOraria ?? 0]));

  const ore = db.ore.filter((o) => o.clienteId === clienteId);
  const oreTotali = arrotonda(ore.reduce((a, o) => a + o.ore, 0));
  const costoManodopera = arrotonda(ore.reduce((a, o) => a + o.ore * (tariffaOp.get(o.operatoreId ?? "") ?? 0), 0));
  const valoreFatturabile = arrotonda(oreTotali * tariffaCliente);

  const spese = arrotonda(db.spese.filter((s) => s.clienteId === clienteId).reduce((a, s) => a + s.importo, 0));

  return {
    totaleAtteso,
    totaleIncassato,
    saldoDaIncassare: arrotonda(totaleAtteso - totaleIncassato),
    numeroLavori: db.lavori.filter((l) => l.clienteId === clienteId).length,
    oreTotali,
    spese,
    costoManodopera,
    valoreFatturabile,
    margine: arrotonda(totaleIncassato - spese - costoManodopera),
  };
}

export type RigaMese = {
  chiave: string;
  anno: number;
  mese: number;
  atteso: number;
  incassato: number;
  uscite: number; // spese + compensi
  saldo: number; // incassato - uscite
};

// Storico mensile: atteso (per emissione), incassato (per incasso),
// uscite = spese + compensi a operatori (per data). saldo = incassato - uscite.
export function storicoMensile(db: Database): RigaMese[] {
  const mappa = new Map<string, RigaMese>();
  const riga = (iso: string): RigaMese => {
    const d = new Date(iso);
    const k = chiaveMese(d);
    let r = mappa.get(k);
    if (!r) {
      r = { chiave: k, anno: d.getFullYear(), mese: d.getMonth() + 1, atteso: 0, incassato: 0, uscite: 0, saldo: 0 };
      mappa.set(k, r);
    }
    return r;
  };

  for (const p of db.pagamenti) {
    riga(p.dataEmissione).atteso += p.importoAtteso;
    if (p.dataIncasso && p.importoIncassato > 0) riga(p.dataIncasso).incassato += p.importoIncassato;
  }
  for (const s of db.spese) riga(s.data).uscite += s.importo;
  for (const c of db.compensi) riga(c.data).uscite += c.importo;

  const righe = [...mappa.values()].map((r) => ({
    ...r,
    atteso: arrotonda(r.atteso),
    incassato: arrotonda(r.incassato),
    uscite: arrotonda(r.uscite),
    saldo: arrotonda(r.incassato - r.uscite),
  }));
  righe.sort((a, b) => b.chiave.localeCompare(a.chiave));
  return righe;
}

export type Debitore = { id: string; nome: string; saldo: number; giorniRitardoMax: number };

// Clienti con saldo aperto, ordinati per importo.
export function debitori(db: Database, oggi = new Date()): Debitore[] {
  const saldo = new Map<string, number>();
  const ritardo = new Map<string, number>();
  for (const p of db.pagamenti) {
    const residuo = p.importoAtteso - p.importoIncassato;
    if (residuo > 0.005) {
      saldo.set(p.clienteId, (saldo.get(p.clienteId) ?? 0) + residuo);
      ritardo.set(p.clienteId, Math.max(ritardo.get(p.clienteId) ?? 0, giorniRitardo(p.dataScadenza, oggi)));
    }
  }
  const nomi = new Map(db.clienti.map((c) => [c.id, `${c.nome} ${c.cognome}`]));
  return [...saldo.entries()]
    .map(([id, s]) => ({ id, nome: nomi.get(id) ?? "—", saldo: arrotonda(s), giorniRitardoMax: ritardo.get(id) ?? 0 }))
    .sort((a, b) => b.saldo - a.saldo);
}
