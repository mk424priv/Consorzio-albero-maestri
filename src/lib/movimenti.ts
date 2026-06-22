// Flusso del denaro: movimenti unificati, riepilogo del mese, panoramica
// dello Spazio e feed di attività del cliente.

import { arrotonda } from "./format";
import { statoCalcolato } from "./conti";
import { libroOperatore } from "./squadra";
import type { Database } from "./types";
import type { StatoPagamento } from "./dominio";

export type TipoMovimento = "incasso" | "compenso" | "spesa";

export interface Movimento {
  id: string;
  tipo: TipoMovimento;
  data: string;
  importo: number; // valore assoluto
  segno: 1 | -1;
  titolo: string;
  sottotitolo?: string;
  controparteId?: string | null;
  statoPagamento?: StatoPagamento;
}

const nomeCliente = (db: Database, id?: string | null) => {
  const c = db.clienti.find((x) => x.id === id);
  return c ? `${c.nome} ${c.cognome}` : "—";
};
const nomeOperatore = (db: Database, id?: string | null) =>
  db.operatori.find((o) => o.id === id)?.nome ?? "—";

// Tutti i movimenti (incassi reali, compensi, spese). Se `periodo` (YYYY-MM)
// è dato, filtra per quel mese.
export function movimenti(db: Database, periodo?: string): Movimento[] {
  const dentro = (iso: string) => (periodo ? iso.slice(0, 7) === periodo : true);
  const out: Movimento[] = [];

  for (const p of db.pagamenti) {
    if (p.dataIncasso && p.importoIncassato > 0 && dentro(p.dataIncasso)) {
      out.push({
        id: `inc_${p.id}`,
        tipo: "incasso",
        data: p.dataIncasso,
        importo: p.importoIncassato,
        segno: 1,
        titolo: nomeCliente(db, p.clienteId),
        sottotitolo: "Incasso",
        controparteId: p.clienteId,
      });
    }
  }
  for (const c of db.compensi) {
    if (dentro(c.data)) {
      out.push({
        id: `cmp_${c.id}`,
        tipo: "compenso",
        data: c.data,
        importo: c.importo,
        segno: -1,
        titolo: nomeOperatore(db, c.operatoreId),
        sottotitolo: "Compenso squadra",
        controparteId: c.operatoreId,
      });
    }
  }
  for (const s of db.spese) {
    if (dentro(s.data)) {
      out.push({
        id: `spe_${s.id}`,
        tipo: "spesa",
        data: s.data,
        importo: s.importo,
        segno: -1,
        titolo: s.descrizione || "Spesa",
        sottotitolo: s.categoria,
        controparteId: s.clienteId ?? null,
      });
    }
  }
  return out.sort((a, b) => b.data.localeCompare(a.data));
}

export interface RiepilogoMese {
  incassato: number;
  spese: number;
  compensi: number;
  uscite: number;
  saldo: number;
  daIncassare: number;
  daPagareSquadra: number;
}

export function riepilogoMese(db: Database, anno: number, mese: number): RiepilogoMese {
  const periodo = `${anno}-${String(mese).padStart(2, "0")}`;
  const dentro = (iso: string) => iso.slice(0, 7) === periodo;

  const incassato = arrotonda(
    db.pagamenti
      .filter((p) => p.dataIncasso && dentro(p.dataIncasso))
      .reduce((a, p) => a + p.importoIncassato, 0),
  );
  const spese = arrotonda(db.spese.filter((s) => dentro(s.data)).reduce((a, s) => a + s.importo, 0));
  const compensi = arrotonda(db.compensi.filter((c) => dentro(c.data)).reduce((a, c) => a + c.importo, 0));
  const daIncassare = arrotonda(
    db.pagamenti.reduce((a, p) => a + Math.max(0, p.importoAtteso - p.importoIncassato), 0),
  );
  const daPagareSquadra = arrotonda(
    db.operatori.reduce((a, o) => a + Math.max(0, libroOperatore(db, o.id).saldo), 0),
  );
  const uscite = arrotonda(spese + compensi);
  return { incassato, spese, compensi, uscite, saldo: arrotonda(incassato - uscite), daIncassare, daPagareSquadra };
}

export interface PanoramicaSpazio {
  daIncassare: number;
  incassatoMese: number;
  lavoriOggi: number;
  daPagareSquadra: number;
  clientiInRitardo: number;
}

export function panoramicaSpazio(db: Database): PanoramicaSpazio {
  const oggi = new Date();
  const r = riepilogoMese(db, oggi.getFullYear(), oggi.getMonth() + 1);
  const oggiKey = oggi.toDateString();
  const lavoriOggi = db.lavori.filter((l) => new Date(l.data).toDateString() === oggiKey).length;
  const clientiInRitardo = new Set(
    db.pagamenti
      .filter((p) => statoCalcolato(p) === "in_ritardo")
      .map((p) => p.clienteId),
  ).size;
  return {
    daIncassare: r.daIncassare,
    incassatoMese: r.incassato,
    lavoriOggi,
    daPagareSquadra: r.daPagareSquadra,
    clientiInRitardo,
  };
}

/* ---- Feed di attività del cliente (Panoramica scheda cliente) ---- */
export type TipoEvento = "lavoro" | "ore" | "pagamento" | "spesa" | "preventivo";
export interface Evento {
  id: string;
  tipo: TipoEvento;
  data: string;
  titolo: string;
  dettaglio?: string;
}

export function feedCliente(db: Database, clienteId: string, limite = 12): Evento[] {
  const ev: Evento[] = [];
  for (const l of db.lavori.filter((x) => x.clienteId === clienteId)) {
    ev.push({ id: `l_${l.id}`, tipo: "lavoro", data: l.data, titolo: l.titolo, dettaglio: l.stato });
  }
  for (const o of db.ore.filter((x) => x.clienteId === clienteId)) {
    const op = db.operatori.find((p) => p.id === o.operatoreId)?.nome;
    ev.push({ id: `o_${o.id}`, tipo: "ore", data: o.data, titolo: `${o.ore} h`, dettaglio: op ?? undefined });
  }
  for (const p of db.pagamenti.filter((x) => x.clienteId === clienteId)) {
    ev.push({ id: `p_${p.id}`, tipo: "pagamento", data: p.dataIncasso ?? p.dataEmissione, titolo: p.origine, dettaglio: statoCalcolato(p) });
  }
  for (const s of db.spese.filter((x) => x.clienteId === clienteId)) {
    ev.push({ id: `s_${s.id}`, tipo: "spesa", data: s.data, titolo: s.descrizione || s.categoria });
  }
  for (const pr of db.preventivi.filter((x) => x.clienteId === clienteId)) {
    ev.push({ id: `pr_${pr.id}`, tipo: "preventivo", data: pr.dataEmissione, titolo: pr.tipo });
  }
  return ev.sort((a, b) => b.data.localeCompare(a.data)).slice(0, limite);
}
