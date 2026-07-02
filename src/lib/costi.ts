import type { CategoriaCosto, Progetto, VoceCosto } from "./types";

// Motore costi — tutto derivato alla lettura, mai salvato.

export const totaleVoce = (v: VoceCosto): number =>
  round2(v.quantita * v.prezzoUnitario);

export const totaleCosti = (voci: VoceCosto[]): number =>
  round2(voci.reduce((acc, v) => acc + totaleVoce(v), 0));

export const totaleSpeso = (voci: VoceCosto[]): number =>
  round2(voci.filter((v) => v.acquistato).reduce((acc, v) => acc + totaleVoce(v), 0));

export const totaliPerCategoria = (
  voci: VoceCosto[],
): Partial<Record<CategoriaCosto, number>> => {
  const out: Partial<Record<CategoriaCosto, number>> = {};
  for (const v of voci) {
    out[v.categoria] = round2((out[v.categoria] ?? 0) + totaleVoce(v));
  }
  return out;
};

/** Scostamento dal budget: negativo = sotto budget, positivo = sforato. */
export const scostamentoBudget = (p: Pick<Progetto, "budget" | "costi">): number | null =>
  p.budget == null ? null : round2(totaleCosti(p.costi) - p.budget);

const round2 = (n: number): number => Math.round(n * 100) / 100;
