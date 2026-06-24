import { describe, expect, it } from "vitest";
import { calcoloLavoro } from "./lavoro-calc";
import type { Dati, Lavoro, Operatore } from "./types";

function dati(p: Partial<Dati> = {}): Dati {
  return { clienti: [], operatori: [], lavori: [], ore: [], pagamenti: [], compensi: [], spese: [], attrezzi: [], appuntamenti: [], ...p };
}

const io: Operatore = { id: "io", nome: "Io", ruolo: "titolare", tariffaOraria: null, attivo: true, creatoIl: "x", updatedAt: "x" };
const luca: Operatore = { id: "luca", nome: "Luca", ruolo: "collaboratore", tariffaOraria: 12, attivo: true, creatoIl: "x", updatedAt: "x" };

function lavoro(p: Partial<Lavoro>): Lavoro {
  return { id: "L", titolo: "t", data: "2026-06-10", fase: "fatto", modo: "ore", conteggio: "totale", partecipanti: [], creatoIl: "x", updatedAt: "x", ...p };
}

describe("calcoloLavoro", () => {
  it("modo ore: lordo = ore cliente * tariffa, io escluso dal costo", () => {
    const l = lavoro({
      clienteId: "c",
      tariffaClienteSnapshot: 25,
      partecipanti: [
        { collaboratoreId: "io", tariffaSnapshot: 0 },
        { collaboratoreId: "luca", tariffaSnapshot: 12 },
      ],
    });
    const d = dati({
      operatori: [io, luca],
      lavori: [l],
      ore: [
        { id: "o1", lavoroId: "L", operatoreId: "io", data: "2026-06-10", ore: 6, updatedAt: "x" },
        { id: "o2", lavoroId: "L", operatoreId: "luca", data: "2026-06-10", ore: 6, updatedAt: "x" },
      ],
    });
    const c = calcoloLavoro(d, l);
    expect(c.oreTotali).toBe(12);
    expect(c.lordo).toBe(300);
    expect(c.costoCollaboratori).toBe(72);
    expect(c.netto).toBe(228);
    expect(c.statoIncasso).toBe("non_pagato");
  });

  it("contaMieOreComeCosto=true include il costo di io", () => {
    const l = lavoro({
      tariffaClienteSnapshot: 25,
      contaMieOreComeCosto: true,
      partecipanti: [{ collaboratoreId: "io", tariffaSnapshot: 10 }],
    });
    const d = dati({ operatori: [io], lavori: [l], ore: [{ id: "o", lavoroId: "L", operatoreId: "io", data: "2026-06-10", ore: 4, updatedAt: "x" }] });
    const c = calcoloLavoro(d, l);
    expect(c.lordo).toBe(100);
    expect(c.costoCollaboratori).toBe(40);
    expect(c.netto).toBe(60);
  });

  it("modo preventivo: lordo = prezzo, indipendente dalle ore", () => {
    const l = lavoro({ modo: "preventivo", prezzo: 800, partecipanti: [{ collaboratoreId: "io", tariffaSnapshot: 0 }] });
    const c = calcoloLavoro(dati({ operatori: [io], lavori: [l] }), l);
    expect(c.lordo).toBe(800);
  });

  it("fase da_fare forza incassato = 0", () => {
    const l = lavoro({ fase: "da_fare", modo: "preventivo", prezzo: 500, partecipanti: [{ collaboratoreId: "io", tariffaSnapshot: 0 }] });
    const d = dati({
      operatori: [io],
      lavori: [l],
      pagamenti: [{ id: "p", clienteId: "c", lavoroId: "L", origine: "preventivo", importoAtteso: 500, importoIncassato: 500, dataEmissione: "2026-06-10", updatedAt: "x" }],
    });
    const c = calcoloLavoro(d, l);
    expect(c.incassato).toBe(0);
    expect(c.daIncassare).toBe(500);
  });

  it("statoIncasso: parziale e pagato", () => {
    const l = lavoro({ modo: "preventivo", prezzo: 800, partecipanti: [{ collaboratoreId: "io", tariffaSnapshot: 0 }] });
    const parz = dati({ operatori: [io], lavori: [l], pagamenti: [{ id: "p", clienteId: "c", lavoroId: "L", origine: "acconto", importoAtteso: 800, importoIncassato: 300, dataEmissione: "2026-06-10", updatedAt: "x" }] });
    expect(calcoloLavoro(parz, l).statoIncasso).toBe("parziale");
    const pag = dati({ operatori: [io], lavori: [l], pagamenti: [{ id: "p", clienteId: "c", lavoroId: "L", origine: "saldo", importoAtteso: 800, importoIncassato: 800, dataEmissione: "2026-06-10", updatedAt: "x" }] });
    expect(calcoloLavoro(pag, l).statoIncasso).toBe("pagato");
  });

  it("spese riducono il netto", () => {
    const l = lavoro({ modo: "preventivo", prezzo: 1000, partecipanti: [{ collaboratoreId: "io", tariffaSnapshot: 0 }] });
    const d = dati({ operatori: [io], lavori: [l], spese: [{ id: "s", categoria: "materiali", importo: 150, data: "2026-06-10", lavoroId: "L", updatedAt: "x" }] });
    const c = calcoloLavoro(d, l);
    expect(c.speseTotali).toBe(150);
    expect(c.netto).toBe(850);
  });
});
