import { describe, expect, it } from "vitest";
import { AMBIENTI_3D } from "@/lib/dominio";
import { CATALOGO, SUGGERITI } from "./catalogo";

describe("catalogo oggetti 3D", () => {
  it("non ha tipi duplicati", () => {
    const tipi = CATALOGO.map((d) => d.tipo);
    expect(new Set(tipi).size).toBe(tipi.length);
  });

  it("suggerisce solo tipi presenti nel catalogo", () => {
    const tipiCatalogo = new Set(CATALOGO.map((d) => d.tipo));
    for (const tipi of Object.values(SUGGERITI)) {
      for (const tipo of tipi) {
        expect(tipiCatalogo.has(tipo)).toBe(true);
      }
    }
  });

  it("ha suggerimenti per ogni ambiente conosciuto", () => {
    for (const ambiente of Object.keys(AMBIENTI_3D)) {
      expect(SUGGERITI).toHaveProperty(ambiente);
    }
  });
});
