import { describe, expect, it } from "vitest";
import { fondi } from "./backup";
import { DATI_VUOTI, type Cliente, type Dati, type Lavoro } from "./types";

function snap(clienti: Cliente[]): Dati {
  return { ...DATI_VUOTI, clienti };
}
function cli(id: string, nome: string, rev: number, updatedAt: string, deleted = false): Cliente {
  return { id, nome, inizialiCodice: "XX", modalitaPredefinita: "ore", creatoIl: "2026-01-01", rev, updatedAt, deleted };
}
function lav(id: string, rev: number, updatedAt: string, extra: Partial<Lavoro> = {}): Lavoro {
  return { id, titolo: "t", data: "2026-06-10", fase: "fatto", modo: "preventivo", conteggio: "totale", partecipanti: [], creatoIl: "2026-01-01", rev, updatedAt, ...extra };
}

describe("fondi (merge LWW)", () => {
  it("rev più alto vince", () => {
    const a = snap([cli("1", "Vecchio", 1, "2026-01-01T00:00:00Z")]);
    const b = snap([cli("1", "Nuovo", 2, "2026-01-01T00:00:00Z")]);
    const m = fondi(a, b);
    expect(m.clienti).toHaveLength(1);
    expect(m.clienti[0].nome).toBe("Nuovo");
  });

  it("a parità di rev vince updatedAt", () => {
    const a = snap([cli("1", "Prima", 3, "2026-01-01T10:00:00Z")]);
    const b = snap([cli("1", "Dopo", 3, "2026-01-02T10:00:00Z")]);
    expect(fondi(a, b).clienti[0].nome).toBe("Dopo");
  });

  it("tombstone più recente cancella", () => {
    const a = snap([cli("1", "Vivo", 1, "2026-01-01T00:00:00Z", false)]);
    const b = snap([cli("1", "Vivo", 2, "2026-01-02T00:00:00Z", true)]);
    expect(fondi(a, b).clienti[0].deleted).toBe(true);
  });

  it("record più recente resuscita un tombstone vecchio", () => {
    const a = snap([cli("1", "Vivo", 5, "2026-01-05T00:00:00Z", false)]);
    const b = snap([cli("1", "Vivo", 2, "2026-01-02T00:00:00Z", true)]);
    expect(fondi(a, b).clienti[0].deleted).toBe(false);
  });

  it("i campi nuovi (fascia, statoPreventivo) sopravvivono al merge", () => {
    const a: Dati = { ...DATI_VUOTI, lavori: [lav("L", 1, "2026-01-01T00:00:00Z")] };
    const b: Dati = { ...DATI_VUOTI, lavori: [lav("L", 2, "2026-01-02T00:00:00Z", { fascia: "mattina", statoPreventivo: "inviato" })] };
    const m = fondi(a, b);
    expect(m.lavori[0].fascia).toBe("mattina");
    expect(m.lavori[0].statoPreventivo).toBe("inviato");
  });

  it("unione di id disgiunti, commutativa e idempotente", () => {
    const a = snap([cli("1", "A", 1, "2026-01-01T00:00:00Z")]);
    const b = snap([cli("2", "B", 1, "2026-01-01T00:00:00Z")]);
    const ab = fondi(a, b);
    const ba = fondi(b, a);
    expect(ab.clienti.map((c) => c.id).sort()).toEqual(["1", "2"]);
    expect(ba.clienti.map((c) => c.id).sort()).toEqual(["1", "2"]);
    expect(fondi(ab, ab).clienti).toHaveLength(2); // idempotente
  });
});
