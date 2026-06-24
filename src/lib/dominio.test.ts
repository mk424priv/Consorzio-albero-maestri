import { describe, expect, it } from "vitest";
import { etichetta, TONO_PREVENTIVO } from "./dominio";
import type { FasciaGiornata, MetodoPagamento, StatoPreventivo } from "./dominio";

describe("dominio — fascia, ciclo preventivo, metodo", () => {
  it("ogni fascia giornaliera ha un'etichetta dedicata", () => {
    const fasce: FasciaGiornata[] = ["giornata", "mattina", "pomeriggio", "orario"];
    for (const f of fasce) expect(etichetta(f)).not.toBe(f);
    expect(etichetta("mattina")).toBe("Mattina");
    expect(etichetta("giornata")).toBe("Giornata");
  });

  it("ogni stato del preventivo ha un'etichetta dedicata", () => {
    const stati: StatoPreventivo[] = ["da_fare", "inviato", "accettato", "rifiutato"];
    for (const s of stati) expect(etichetta(s)).not.toBe(s);
    expect(etichetta("da_fare")).toBe("Da fare");
    expect(etichetta("inviato")).toBe("Inviato");
    expect(etichetta("accettato")).toBe("Accettato");
  });

  it("i metodi di pagamento (inclusi carta/assegno) hanno etichetta", () => {
    const metodi: MetodoPagamento[] = ["contanti", "bonifico", "carta", "assegno", "altro"];
    for (const m of metodi) expect(etichetta(m)).not.toBe(m);
    expect(etichetta("carta")).toBe("Carta");
    expect(etichetta("assegno")).toBe("Assegno");
  });

  it("TONO_PREVENTIVO copre tutti gli stati del preventivo", () => {
    const stati: StatoPreventivo[] = ["da_fare", "inviato", "accettato", "rifiutato"];
    for (const s of stati) expect(TONO_PREVENTIVO[s]).toBeTruthy();
  });
});
