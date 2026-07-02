import { describe, expect, it } from "vitest";
import {
  scostamentoBudget,
  totaleCosti,
  totaleSpeso,
  totaleVoce,
  totaliPerCategoria,
} from "./costi";
import type { VoceCosto } from "./types";

const voce = (over: Partial<VoceCosto>): VoceCosto => ({
  id: "v1",
  descrizione: "test",
  categoria: "materiali",
  quantita: 1,
  prezzoUnitario: 0,
  acquistato: false,
  ...over,
});

describe("motore costi", () => {
  it("totale voce = quantità × prezzo, arrotondato ai centesimi", () => {
    expect(totaleVoce(voce({ quantita: 3, prezzoUnitario: 19.99 }))).toBe(59.97);
    expect(totaleVoce(voce({ quantita: 0.5, prezzoUnitario: 0.03 }))).toBe(0.02);
  });

  it("totale costi somma tutte le voci", () => {
    const voci = [
      voce({ quantita: 2, prezzoUnitario: 10 }),
      voce({ id: "v2", quantita: 1, prezzoUnitario: 5.5 }),
    ];
    expect(totaleCosti(voci)).toBe(25.5);
    expect(totaleCosti([])).toBe(0);
  });

  it("totale speso conta solo le voci acquistate", () => {
    const voci = [
      voce({ quantita: 1, prezzoUnitario: 100, acquistato: true }),
      voce({ id: "v2", quantita: 1, prezzoUnitario: 40 }),
    ];
    expect(totaleSpeso(voci)).toBe(100);
  });

  it("raggruppa i totali per categoria", () => {
    const voci = [
      voce({ quantita: 1, prezzoUnitario: 10 }),
      voce({ id: "v2", categoria: "attrezzi", quantita: 2, prezzoUnitario: 7 }),
      voce({ id: "v3", categoria: "materiali", quantita: 1, prezzoUnitario: 5 }),
    ];
    expect(totaliPerCategoria(voci)).toEqual({ materiali: 15, attrezzi: 14 });
  });

  it("scostamento budget: positivo se sforato, null senza budget", () => {
    const costi = [voce({ quantita: 1, prezzoUnitario: 120 })];
    expect(scostamentoBudget({ budget: 100, costi })).toBe(20);
    expect(scostamentoBudget({ budget: 150, costi })).toBe(-30);
    expect(scostamentoBudget({ budget: null, costi })).toBeNull();
  });
});
