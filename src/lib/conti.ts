// Motore dei conti (PRD §8): aggregazioni derivate dai dati.
// Tutto ciò che è calcolabile vive qui — mai duplicato a mano.

import { db } from "@/lib/db";
import { arrotonda, chiaveMese } from "@/lib/format";
import type { StatoPagamento } from "@/lib/dominio";

// Stato del pagamento calcolato (in_ritardo se scaduto e non saldato).
export function statoCalcolato(p: {
  importoAtteso: number;
  importoIncassato: number;
  stato: string;
  dataScadenza: Date | null;
}, oggi = new Date()): StatoPagamento {
  if (p.importoIncassato >= p.importoAtteso && p.importoAtteso > 0) return "pagato";
  if (p.stato === "pagato") return "pagato";
  if (p.dataScadenza && p.dataScadenza < oggi) return "in_ritardo";
  return "in_attesa";
}

export function giorniRitardo(dataScadenza: Date | null, oggi = new Date()): number {
  if (!dataScadenza) return 0;
  const g = Math.floor((oggi.getTime() - dataScadenza.getTime()) / 86_400_000);
  return Math.max(0, g);
}

export type RiepilogoCliente = {
  totaleAtteso: number;
  totaleIncassato: number;
  saldoDaIncassare: number;
  numeroLavori: number;
  oreTotali: number;
};

export async function riepilogoCliente(clienteId: string): Promise<RiepilogoCliente> {
  const [pagamenti, numeroLavori, ore] = await Promise.all([
    db.pagamento.findMany({
      where: { clienteId },
      select: { importoAtteso: true, importoIncassato: true },
    }),
    db.lavoro.count({ where: { clienteId } }),
    db.registrazioneOre.aggregate({ where: { clienteId }, _sum: { ore: true } }),
  ]);

  const totaleAtteso = arrotonda(pagamenti.reduce((a, p) => a + p.importoAtteso, 0));
  const totaleIncassato = arrotonda(
    pagamenti.reduce((a, p) => a + p.importoIncassato, 0),
  );
  return {
    totaleAtteso,
    totaleIncassato,
    saldoDaIncassare: arrotonda(totaleAtteso - totaleIncassato),
    numeroLavori,
    oreTotali: arrotonda(ore._sum.ore ?? 0),
  };
}

export type RigaMese = {
  chiave: string; // "2026-06"
  anno: number;
  mese: number; // 1..12
  atteso: number;
  incassato: number;
  uscite: number;
  saldo: number; // incassato - uscite
};

// Storico mensile: atteso (per data emissione), incassato (per data incasso),
// uscite (spese per data). saldo = incassato - uscite.
export async function storicoMensile(): Promise<RigaMese[]> {
  const [pagamenti, spese] = await Promise.all([
    db.pagamento.findMany({
      select: {
        importoAtteso: true,
        importoIncassato: true,
        dataEmissione: true,
        dataIncasso: true,
      },
    }),
    db.spesa.findMany({ select: { importo: true, data: true } }),
  ]);

  const mappa = new Map<string, RigaMese>();
  const riga = (d: Date): RigaMese => {
    const k = chiaveMese(d);
    let r = mappa.get(k);
    if (!r) {
      r = { chiave: k, anno: d.getFullYear(), mese: d.getMonth() + 1, atteso: 0, incassato: 0, uscite: 0, saldo: 0 };
      mappa.set(k, r);
    }
    return r;
  };

  for (const p of pagamenti) {
    riga(p.dataEmissione).atteso += p.importoAtteso;
    if (p.dataIncasso && p.importoIncassato > 0) {
      riga(p.dataIncasso).incassato += p.importoIncassato;
    }
  }
  for (const s of spese) riga(s.data).uscite += s.importo;

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

export type Cruscotto = {
  incassato: number;
  speso: number;
  resta: number;
  daIncassare: number;
  debitori: { id: string; nome: string; saldo: number; giorniRitardoMax: number }[];
  lavoriOggi: number;
};

export async function cruscotto(
  da?: Date,
  a?: Date,
): Promise<Cruscotto> {
  const oggi = new Date();
  const filtroData = da && a ? { gte: da, lte: a } : undefined;

  const [pagamenti, spese, clienti] = await Promise.all([
    db.pagamento.findMany({
      select: {
        clienteId: true,
        importoAtteso: true,
        importoIncassato: true,
        stato: true,
        dataIncasso: true,
        dataScadenza: true,
      },
    }),
    db.spesa.findMany({
      where: filtroData ? { data: filtroData } : undefined,
      select: { importo: true },
    }),
    db.cliente.findMany({ select: { id: true, nome: true, cognome: true } }),
  ]);

  let incassato = 0;
  const saldoPerCliente = new Map<string, number>();
  const ritardoPerCliente = new Map<string, number>();
  let daIncassare = 0;

  for (const p of pagamenti) {
    const inPeriodo =
      !filtroData ||
      (p.dataIncasso && p.dataIncasso >= filtroData.gte && p.dataIncasso <= filtroData.lte);
    if (inPeriodo) incassato += p.importoIncassato;

    const residuo = p.importoAtteso - p.importoIncassato;
    if (residuo > 0.005) {
      daIncassare += residuo;
      saldoPerCliente.set(p.clienteId, (saldoPerCliente.get(p.clienteId) ?? 0) + residuo);
      const gr = giorniRitardo(p.dataScadenza, oggi);
      ritardoPerCliente.set(
        p.clienteId,
        Math.max(ritardoPerCliente.get(p.clienteId) ?? 0, gr),
      );
    }
  }

  const speso = arrotonda(spese.reduce((a, s) => a + s.importo, 0));
  const nomi = new Map(clienti.map((c) => [c.id, `${c.nome} ${c.cognome}`]));
  const debitori = [...saldoPerCliente.entries()]
    .map(([id, saldo]) => ({
      id,
      nome: nomi.get(id) ?? "—",
      saldo: arrotonda(saldo),
      giorniRitardoMax: ritardoPerCliente.get(id) ?? 0,
    }))
    .sort((x, y) => y.saldo - x.saldo);

  const inizioGiorno = new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate());
  const fineGiorno = new Date(inizioGiorno.getTime() + 86_400_000 - 1);
  const lavoriOggi = await db.lavoro.count({
    where: { data: { gte: inizioGiorno, lte: fineGiorno } },
  });

  incassato = arrotonda(incassato);
  return {
    incassato,
    speso,
    resta: arrotonda(incassato - speso),
    daIncassare: arrotonda(daIncassare),
    debitori,
    lavoriOggi,
  };
}
