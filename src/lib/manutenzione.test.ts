import { describe, expect, it } from "vitest";
import { aggiungiIntervallo, giorniAllaScadenza, prossimaScadenza, statoScadenza } from "./manutenzione";

describe("motore manutenzione", () => {
  it("aggiunge giorni, mesi o anni a una data", () => {
    expect(aggiungiIntervallo(new Date(2026, 0, 10), 15, "giorni")).toEqual(new Date(2026, 0, 25));
    expect(aggiungiIntervallo(new Date(2026, 0, 10), 2, "mesi")).toEqual(new Date(2026, 2, 10));
    expect(aggiungiIntervallo(new Date(2026, 0, 10), 1, "anni")).toEqual(new Date(2027, 0, 10));
  });

  it("calcola la prossima scadenza da dataUltimo + intervallo", () => {
    const scadenza = prossimaScadenza({
      dataUltimo: "2026-06-01",
      intervalloValore: 30,
      intervalloUnita: "giorni",
    });
    expect(scadenza).toEqual(new Date(2026, 6, 1));
  });

  it("giorni alla scadenza: positivo se futura, negativo se scaduta, zero se oggi", () => {
    const riferimento = new Date(2026, 5, 20);
    expect(giorniAllaScadenza(new Date(2026, 5, 25), riferimento)).toBe(5);
    expect(giorniAllaScadenza(new Date(2026, 5, 10), riferimento)).toBe(-10);
    expect(giorniAllaScadenza(new Date(2026, 5, 20), riferimento)).toBe(0);
  });

  it("stato scadenza: scaduto sotto zero, urgente entro 7 giorni, ok oltre", () => {
    expect(statoScadenza(-1)).toBe("scaduto");
    expect(statoScadenza(0)).toBe("urgente");
    expect(statoScadenza(7)).toBe("urgente");
    expect(statoScadenza(8)).toBe("ok");
  });
});
