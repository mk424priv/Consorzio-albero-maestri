// Aggregati per Soldi e Dashboard (derivati a lettura). (canone 02 §9, §5.7-5.11)
import { arrotonda, chiaveMese, SOGLIA } from "./format";
import { calcoloLavoro } from "./lavoro-calc";
import type { StatoCompenso, StatoPagamento } from "./dominio";
import type { Dati, Lavoro, Pagamento } from "./types";

/** Stato di un pagamento-come-invoice (scala per-pagamento). */
export function statoPagamento(p: Pagamento, oggiIso: string): StatoPagamento {
  const residuo = p.importoAtteso - p.importoIncassato;
  if (residuo <= SOGLIA) return "pagato";
  if (p.dataScadenza && p.dataScadenza < oggiIso) return "in_ritardo";
  return "in_attesa";
}

export interface RiepilogoSoldi {
  guadagnatoMese: number; // lordo dei lavori svolti nel mese
  incassatoMese: number; // incassato nel mese
  daIncassare: number; // residuo aperto su tutti i lavori svolti
  daPagareOperai: number; // compensi dovuti agli operai
  nLavoriSvolti: number;
}

/** Riepilogo per il centro Soldi e il blocco a 3 dashboard. */
export function riepilogoSoldi(dati: Dati, meseChiave: string): RiepilogoSoldi {
  const svolti = dati.lavori.filter((l) => !l.deleted && l.fase === "fatto");
  let guadagnatoMese = 0;
  let daIncassare = 0;
  let nLavoriSvolti = 0;
  for (const l of svolti) {
    const c = calcoloLavoro(dati, l);
    daIncassare += c.daIncassare;
    if (chiaveMese(l.data) === meseChiave) {
      guadagnatoMese += c.lordo;
      nLavoriSvolti++;
    }
  }
  const incassatoMese = dati.pagamenti
    .filter((p) => !p.deleted && p.dataIncasso && chiaveMese(p.dataIncasso) === meseChiave)
    .reduce((a, p) => a + p.importoIncassato, 0);

  return {
    guadagnatoMese: arrotonda(guadagnatoMese),
    incassatoMese: arrotonda(incassatoMese),
    daIncassare: arrotonda(daIncassare),
    daPagareOperai: totaleDaPagareOperai(dati),
    nLavoriSvolti,
  };
}

export interface DovutoOperatore {
  maturato: number;
  versato: number;
  daPagare: number;
  stato: StatoCompenso;
}

/** Costo lavoro maturato da un operatore meno i compensi gia' versati. */
export function dovutoOperatore(dati: Dati, operatoreId: string): DovutoOperatore {
  let maturato = 0;
  for (const l of dati.lavori.filter((l) => !l.deleted && l.fase === "fatto")) {
    const c = calcoloLavoro(dati, l);
    const p = c.partecipanti.find((x) => x.collaboratoreId === operatoreId);
    if (p) maturato += p.costo;
  }
  const versato = dati.compensi
    .filter((c) => c.operatoreId === operatoreId && !c.deleted)
    .reduce((a, c) => a + c.importo, 0);
  const m = arrotonda(maturato);
  const v = arrotonda(versato);
  return { maturato: m, versato: v, daPagare: arrotonda(Math.max(0, m - v)), stato: statoCompenso(m, v) };
}

export interface LibroOperatore {
  ore: number;
  dovuto: number;
  pagato: number;
  saldo: number;
  stato: StatoCompenso;
  lavori: Lavoro[];
}

/** Libro di un operaio: ore, dovuto, pagato, saldo + lavori a cui ha partecipato. */
export function libroOperatore(dati: Dati, operatoreId: string): LibroOperatore {
  const d = dovutoOperatore(dati, operatoreId);
  const lavori = dati.lavori
    .filter((l) => !l.deleted && l.partecipanti.some((p) => p.collaboratoreId === operatoreId))
    .sort((a, b) => b.data.localeCompare(a.data));
  let ore = 0;
  for (const l of lavori) {
    ore += dati.ore
      .filter((o) => o.lavoroId === l.id && o.operatoreId === operatoreId && !o.deleted)
      .reduce((a, o) => a + o.ore, 0);
  }
  return { ore: arrotonda(ore), dovuto: d.maturato, pagato: d.versato, saldo: d.daPagare, stato: d.stato, lavori };
}

export function statoCompenso(maturato: number, versato: number): StatoCompenso {
  if (versato <= SOGLIA) return "da_pagare";
  if (versato >= maturato - SOGLIA) return "saldato";
  return "parziale";
}

/** Totale dovuto a TUTTI gli operai tranne "io". */
export function totaleDaPagareOperai(dati: Dati): number {
  const io = dati.operatori.find((o) => o.ruolo === "titolare");
  let tot = 0;
  for (const op of dati.operatori.filter((o) => !o.deleted && o.id !== io?.id)) {
    tot += dovutoOperatore(dati, op.id).daPagare;
  }
  return arrotonda(tot);
}

// ── Rollup per-cliente (Dashboard modo Clienti) ──
export interface RigaCliente {
  clienteId: string;
  lordo: number;
  incassato: number;
  daIncassare: number;
  nLavori: number;
}

export interface RiepilogoCliente {
  saldoDaIncassare: number;
  totaleIncassato: number;
  valoreFatturabile: number;
  costoManodopera: number;
  spese: number;
  margine: number;
  numeroLavori: number;
  oreTotali: number;
}

/** Riepilogo economico di un cliente (solo lavori svolti per i soldi). */
export function riepilogoCliente(dati: Dati, clienteId: string): RiepilogoCliente {
  const lavori = dati.lavori.filter((l) => !l.deleted && l.clienteId === clienteId);
  let fatturabile = 0;
  let incassato = 0;
  let daIncassare = 0;
  let costo = 0;
  let spese = 0;
  let margine = 0;
  let ore = 0;
  for (const l of lavori) {
    const c = calcoloLavoro(dati, l);
    ore += c.oreTotali;
    if (l.fase === "fatto") {
      fatturabile += c.lordo;
      incassato += c.incassato;
      daIncassare += c.daIncassare;
      costo += c.costoCollaboratori;
      spese += c.speseTotali;
      margine += c.netto;
    }
  }
  return {
    saldoDaIncassare: arrotonda(daIncassare),
    totaleIncassato: arrotonda(incassato),
    valoreFatturabile: arrotonda(fatturabile),
    costoManodopera: arrotonda(costo),
    spese: arrotonda(spese),
    margine: arrotonda(margine),
    numeroLavori: lavori.length,
    oreTotali: arrotonda(ore),
  };
}

export function perCliente(dati: Dati): RigaCliente[] {
  const map = new Map<string, RigaCliente>();
  for (const l of dati.lavori.filter((l) => !l.deleted && l.fase === "fatto")) {
    if (!l.clienteId) continue;
    const c = calcoloLavoro(dati, l);
    const r =
      map.get(l.clienteId) ?? { clienteId: l.clienteId, lordo: 0, incassato: 0, daIncassare: 0, nLavori: 0 };
    r.lordo += c.lordo;
    r.incassato += c.incassato;
    r.daIncassare += c.daIncassare;
    r.nLavori++;
    map.set(l.clienteId, r);
  }
  return [...map.values()].map((r) => ({
    ...r,
    lordo: arrotonda(r.lordo),
    incassato: arrotonda(r.incassato),
    daIncassare: arrotonda(r.daIncassare),
  }));
}

export interface OperaioCliente {
  operatoreId: string;
  nome: string;
  ore: number;
}

/** Operai (incluso «io») che hanno lavorato per un cliente, con ore totali. */
export function squadraDelCliente(dati: Dati, clienteId: string): OperaioCliente[] {
  const lavoriIds = new Set(
    dati.lavori.filter((l) => !l.deleted && l.clienteId === clienteId).map((l) => l.id),
  );
  const map = new Map<string, number>();
  for (const o of dati.ore) {
    if (o.deleted || !o.operatoreId || !o.lavoroId || !lavoriIds.has(o.lavoroId)) continue;
    map.set(o.operatoreId, (map.get(o.operatoreId) ?? 0) + o.ore);
  }
  return [...map.entries()]
    .map(([operatoreId, ore]) => ({
      operatoreId,
      nome: dati.operatori.find((op) => op.id === operatoreId)?.nome ?? "—",
      ore: arrotonda(ore),
    }))
    .sort((a, b) => b.ore - a.ore);
}

/** L'entità ha relazioni? Allora si ARCHIVIA (reversibile), non si elimina (08 §2.3). */
export function haRelazioni(dati: Dati, tipo: "cliente" | "operatore" | "attrezzo", id: string): boolean {
  if (tipo === "cliente") {
    return (
      dati.lavori.some((l) => !l.deleted && l.clienteId === id) ||
      dati.pagamenti.some((p) => !p.deleted && p.clienteId === id)
    );
  }
  if (tipo === "operatore") {
    return (
      dati.lavori.some((l) => !l.deleted && l.partecipanti.some((p) => p.collaboratoreId === id)) ||
      dati.ore.some((o) => !o.deleted && o.operatoreId === id) ||
      dati.compensi.some((c) => !c.deleted && c.operatoreId === id)
    );
  }
  return dati.spese.some((s) => !s.deleted && s.attrezzoId === id);
}
