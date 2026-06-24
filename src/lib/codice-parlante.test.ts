import { describe, expect, it } from "vitest";
import { assegnaIniziali, calcolaParti, codiceCliente, inizialiDa, leggiCodice } from "./codice-parlante";
import type { Cliente, Dati } from "./types";

const cliente = (p: Partial<Cliente> & { id: string; inizialiCodice: string }): Cliente => ({
  nome: "M",
  cognome: "R",
  modalitaPredefinita: "ore",
  creatoIl: "x",
  updatedAt: "x",
  ...p,
});

describe("codice parlante", () => {
  it("iniziali da nome e cognome", () => {
    expect(inizialiDa("Mario", "Rossi")).toBe("MR");
    expect(inizialiDa("anna", "verdi")).toBe("AV");
    expect(inizialiDa("", "")).toBe("X");
  });

  it("assegna iniziali risolvendo le collisioni", () => {
    const clienti: Cliente[] = [cliente({ id: "1", nome: "Mario", cognome: "Rossi", inizialiCodice: "MR" })];
    expect(assegnaIniziali("Marco", "Russo", clienti)).toBe("MR1");
    expect(assegnaIniziali("Luca", "Bianchi", clienti)).toBe("LB");
  });

  it("formato II-GG-SS-AA, tutto zero senza dati", () => {
    const dati: Dati = { clienti: [cliente({ id: "c", inizialiCodice: "MR" })], operatori: [], lavori: [], ore: [], pagamenti: [], compensi: [], spese: [], attrezzi: [] };
    const cod = codiceCliente(dati, "c", Date.parse("2026-06-24"));
    expect(cod).toMatch(/^MR-\d{2}-\d{2}-\d{2}$/);
    expect(cod).toBe("MR-00-00-00");
  });

  it("GG e SS dai pagamenti incassati", () => {
    const dati: Dati = {
      clienti: [cliente({ id: "c", inizialiCodice: "MR" })],
      operatori: [],
      lavori: [{ id: "L", clienteId: "c", titolo: "t", data: "2026-06-01", fase: "fatto", modo: "ore", conteggio: "totale", partecipanti: [], creatoIl: "x", updatedAt: "x" }],
      ore: [],
      pagamenti: [{ id: "p", clienteId: "c", lavoroId: "L", origine: "ore", importoAtteso: 100, importoIncassato: 100, dataEmissione: "2026-06-01", dataIncasso: "2026-06-06", updatedAt: "x" }],
      compensi: [],
      spese: [],
      attrezzi: [],
    };
    const parti = calcolaParti(dati, "c", Date.parse("2026-06-24"));
    expect(parti.gg).toBeCloseTo(5);
    expect(parti.ss).toBeCloseTo(2);
  });

  it("leggiCodice inverte la lettura", () => {
    expect(leggiCodice("MR-05-02-01")).toEqual({ iniziali: "MR", giorniMedi: 5, spesaMedia: 100, anni: 1 });
    expect(leggiCodice("malformato")).toBeNull();
  });
});
