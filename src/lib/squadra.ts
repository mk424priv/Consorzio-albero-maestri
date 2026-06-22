// Libro mastro della squadra: ore di un operatore → dovuto, pagato, saldo.

import { arrotonda } from "./format";
import type { StatoCompenso } from "./dominio";
import type { CompensoOperatore, Database } from "./types";

export function statoCompenso(dovuto: number, pagato: number): StatoCompenso {
  if (pagato >= dovuto - 0.005 && dovuto > 0) return "saldato";
  if (pagato > 0.005) return "parziale";
  return "da_pagare";
}

export type VoceClienteOperatore = { clienteId: string; nome: string; ore: number; importo: number };

export type LibroOperatore = {
  ore: number;
  dovuto: number; // Σ ore × tariffa
  pagato: number; // Σ compensi
  saldo: number; // dovuto − pagato
  stato: StatoCompenso;
  perCliente: VoceClienteOperatore[];
  compensi: CompensoOperatore[];
};

// Se `periodo` (YYYY-MM) è dato, considera solo ore e compensi di quel mese.
export function libroOperatore(
  db: Database,
  operatoreId: string,
  periodo?: string,
): LibroOperatore {
  const op = db.operatori.find((o) => o.id === operatoreId);
  const tariffa = op?.tariffaOraria ?? 0;
  const nelPeriodo = (iso: string) => (periodo ? iso.slice(0, 7) === periodo : true);

  const oreFiltrate = db.ore.filter((o) => o.operatoreId === operatoreId && nelPeriodo(o.data));
  const perClienteMap = new Map<string, VoceClienteOperatore>();
  let oreTot = 0;
  for (const o of oreFiltrate) {
    oreTot += o.ore;
    const cl = db.clienti.find((c) => c.id === o.clienteId);
    const k = o.clienteId;
    const v = perClienteMap.get(k) ?? { clienteId: k, nome: cl ? `${cl.nome} ${cl.cognome}` : "—", ore: 0, importo: 0 };
    v.ore += o.ore;
    v.importo += o.ore * tariffa;
    perClienteMap.set(k, v);
  }

  const compensi = db.compensi
    .filter((c) => c.operatoreId === operatoreId && nelPeriodo(c.data))
    .sort((a, b) => b.data.localeCompare(a.data));

  const dovuto = arrotonda(oreTot * tariffa);
  const pagato = arrotonda(compensi.reduce((a, c) => a + c.importo, 0));
  const perCliente = [...perClienteMap.values()]
    .map((v) => ({ ...v, ore: arrotonda(v.ore), importo: arrotonda(v.importo) }))
    .sort((a, b) => b.importo - a.importo);

  return {
    ore: arrotonda(oreTot),
    dovuto,
    pagato,
    saldo: arrotonda(dovuto - pagato),
    stato: statoCompenso(dovuto, pagato),
    perCliente,
    compensi,
  };
}
