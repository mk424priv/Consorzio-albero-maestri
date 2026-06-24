import { describe, expect, it } from "vitest";
import { CATEGORIA_DI_MODELLO, normalizza, risolviModelloLocale, TUTTE_LE_CHIAVI } from "./modelli-3d";
import type { CategoriaAttrezzo } from "./types";

describe("modelli-3d — normalizzazione", () => {
  it("minuscola e rimuove accenti", () => {
    expect(normalizza("Decespugliatóre")).toBe("decespugliatore");
    expect(normalizza("Tagliasièpi  PRO")).toBe("tagliasiepi pro");
    expect(normalizza("àèìòù")).toBe("aeiou");
  });
});

describe("modelli-3d — match per nome dentro la categoria giusta", () => {
  const casi: Array<[string, CategoriaAttrezzo, string]> = [
    ["Motosega Stihl MS 261", "motore", "chainsaw"],
    ["Decespugliatore a spalla", "motore", "brushcutter"],
    ["Tagliasiepi elettrico", "motore", "hedgetrimmer"],
    ["Tagliaerba semovente", "motore", "mower"],
    ["Rasaerba Honda", "motore", "mower"],
    ["Idropulitrice Karcher", "motore", "pressurewasher"],
    ["Soffiatore foglie", "motore", "leafblower"],
    ["Motozappa", "motore", "tiller"],
    ["Generatore di corrente", "motore", "generator"],
    ["Trapano avvitatore", "elettrico", "drill"],
    ["Smerigliatrice angolare", "elettrico", "grinder"],
    ["Sega circolare", "elettrico", "circularsaw"],
    ["Levigatrice orbitale", "elettrico", "sander"],
    ["Saldatrice a filo", "elettrico", "welder"],
    ["Martello da carpentiere", "manuale", "hammer"],
    ["Segaccio", "manuale", "handsaw"],
    ["Ascia da spacco", "manuale", "axe"],
    ["Pala badile", "manuale", "shovel"],
    ["Rastrello", "manuale", "rake"],
    ["Chiave inglese", "manuale", "wrench"],
    ["Cacciavite a stella", "manuale", "screwdriver"],
    ["Pinza universale", "manuale", "pliers"],
    ["Carriola da cantiere", "manuale", "wheelbarrow"],
    ["Scala telescopica", "manuale", "ladder"],
    ["Cesoie da potatura", "manuale", "shears"],
    ["Furgone Fiat Ducato", "auto", "van"],
    ["Trattore agricolo", "auto", "tractor"],
    ["Camion ribaltabile", "auto", "truck"],
    ["Pickup 4x4", "auto", "pickup"],
    ["Scooter Vespa", "auto", "scooter"],
    ["Auto aziendale", "auto", "car"],
  ];
  for (const [nome, cat, atteso] of casi) {
    it(`"${nome}" (${cat}) → ${atteso}`, () => {
      const e = risolviModelloLocale(nome, undefined, cat);
      expect(e.key).toBe(atteso);
      expect(e.certo).toBe(true);
    });
  }
});

describe("modelli-3d — disambiguazione e incertezza", () => {
  it("'sega circolare' non diventa 'handsaw' (vince la regola specifica)", () => {
    expect(risolviModelloLocale("sega circolare", undefined, "elettrico").key).toBe("circularsaw");
  });
  it("'motosega' non viene rubata da 'sega' generica", () => {
    expect(risolviModelloLocale("motosega", undefined, "motore").key).toBe("chainsaw");
  });
  it("nome ignoto → nessun match", () => {
    const e = risolviModelloLocale("aggeggio misterioso", undefined, "manuale");
    expect(e.key).toBeNull();
    expect(e.certo).toBe(false);
  });
  it("match in categoria diversa da quella scelta → proposto ma incerto", () => {
    // "martello" è manuale; l'utente però ha scelto "auto"
    const e = risolviModelloLocale("martello", undefined, "auto");
    expect(e.key).toBe("hammer");
    expect(e.certo).toBe(false);
  });
  it("usa anche le caratteristiche, non solo il nome", () => {
    const e = risolviModelloLocale("Stihl", "motosega professionale", "motore");
    expect(e.key).toBe("chainsaw");
  });
});

describe("modelli-3d — invarianti del catalogo categorie", () => {
  it("ogni chiave ha una categoria valida", () => {
    const valide: CategoriaAttrezzo[] = ["auto", "motore", "elettrico", "manuale"];
    for (const k of TUTTE_LE_CHIAVI) expect(valide).toContain(CATEGORIA_DI_MODELLO[k]);
  });
});
