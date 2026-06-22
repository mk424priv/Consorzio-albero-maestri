// Motore dei conti: aggregazioni derivate dai dati.
// Tutto ciò che è calcolabile vive qui — mai duplicato a mano.

import { arrotonda, chiaveMese } from "./format";
import type { StatoPagamento } from "./dominio";
import type { Database, Pagamento } from "./types";

// Stato del pagamento calcolato (in_ritardo se scaduto e non saldato).
export function statoCalcolato(
  p: Pick<
    Pagamento,
    "importoAtteso" | "importoIncassato" | "stato" | "dataScadenza"
  >,
  oggi = new Date(),
): StatoPagamento {
  if (p.importoIncassato >= p.importoAtteso && p.importoAtteso > 0)
    return "pagato";
  if (p.stato === "pagato") return "pagato";
  if (p.dataScadenza && new Date(p.dataScadenza) < oggi) return "in_ritardo";
  return "in_attesa";
}

export function giorniRitardo(
  dataScadenza: string | null | undefined,
  oggi = new Date(),
): number {
  if (!dataScadenza) return 0;
  const g = Math.floor(
    (oggi.getTime() - new Date(dataScadenza).getTime()) / 86_400_000,
  );
  return Math.max(0, g);
}

export type RiepilogoCliente = {
  totaleAtteso: number;
  totaleIncassato: number;
  saldoDaIncassare: number;
  numeroLavori: number;
  oreTotali: number;
};

export function riepilogoCliente(
  db: Database,
  clienteId: string,
): RiepilogoCliente {
  const pagamenti = db.pagamenti.filter((p) => p.clienteId === clienteId);
  const totaleAtteso = arrotonda(
    pagamenti.reduce((a, p) => a + p.importoAtteso, 0),
  );
  const totaleIncassato = arrotonda(
    pagamenti.reduce((a, p) => a + p.importoIncassato, 0),
  );
  const oreTotali = arrotonda(
    db.ore
      .filter((o) => o.clienteId === clienteId)
      .reduce((a, o) => a + o.ore, 0),
  );
  return {
    totaleAtteso,
    totaleIncassato,
    saldoDaIncassare: arrotonda(totaleAtteso - totaleIncassato),
    numeroLavori: db.lavori.filter((l) => l.clienteId === clienteId).length,
    oreTotali,
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
export function storicoMensile(db: Database): RigaMese[] {
  const mappa = new Map<string, RigaMese>();
  const riga = (iso: string): RigaMese => {
    const d = new Date(iso);
    const k = chiaveMese(d);
    let r = mappa.get(k);
    if (!r) {
      r = {
        chiave: k,
        anno: d.getFullYear(),
        mese: d.getMonth() + 1,
        atteso: 0,
        incassato: 0,
        uscite: 0,
        saldo: 0,
      };
      mappa.set(k, r);
    }
    return r;
  };

  for (const p of db.pagamenti) {
    riga(p.dataEmissione).atteso += p.importoAtteso;
    if (p.dataIncasso && p.importoIncassato > 0) {
      riga(p.dataIncasso).incassato += p.importoIncassato;
    }
  }
  for (const s of db.spese) riga(s.data).uscite += s.importo;

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

export type Debitore = {
  id: string;
  nome: string;
  saldo: number;
  giorniRitardoMax: number;
};

export type Cruscotto = {
  incassato: number;
  speso: number;
  resta: number;
  daIncassare: number;
  debitori: Debitore[];
  lavoriOggi: number;
};

export function cruscotto(db: Database, da?: Date, a?: Date): Cruscotto {
  const oggi = new Date();
  const inPeriodo = (iso: string | null | undefined): boolean => {
    if (!da || !a) return true;
    if (!iso) return false;
    const t = new Date(iso).getTime();
    return t >= da.getTime() && t <= a.getTime();
  };

  let incassato = 0;
  let daIncassare = 0;
  const saldoPerCliente = new Map<string, number>();
  const ritardoPerCliente = new Map<string, number>();

  for (const p of db.pagamenti) {
    if (!da || !a || inPeriodo(p.dataIncasso)) incassato += p.importoIncassato;

    const residuo = p.importoAtteso - p.importoIncassato;
    if (residuo > 0.005) {
      daIncassare += residuo;
      saldoPerCliente.set(
        p.clienteId,
        (saldoPerCliente.get(p.clienteId) ?? 0) + residuo,
      );
      const gr = giorniRitardo(p.dataScadenza, oggi);
      ritardoPerCliente.set(
        p.clienteId,
        Math.max(ritardoPerCliente.get(p.clienteId) ?? 0, gr),
      );
    }
  }

  const speso = arrotonda(
    db.spese
      .filter((s) => inPeriodo(s.data))
      .reduce((acc, s) => acc + s.importo, 0),
  );

  const nomi = new Map(
    db.clienti.map((c) => [c.id, `${c.nome} ${c.cognome}`]),
  );
  const debitori = [...saldoPerCliente.entries()]
    .map(([id, saldo]) => ({
      id,
      nome: nomi.get(id) ?? "—",
      saldo: arrotonda(saldo),
      giorniRitardoMax: ritardoPerCliente.get(id) ?? 0,
    }))
    .sort((x, y) => y.saldo - x.saldo);

  const oggiKey = oggi.toDateString();
  const lavoriOggi = db.lavori.filter(
    (l) => new Date(l.data).toDateString() === oggiKey,
  ).length;

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
