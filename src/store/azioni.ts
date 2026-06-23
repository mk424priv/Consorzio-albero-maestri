// Azioni di dominio: ogni mutazione passa dallo store (canone AGENTS / 02 §6,§9).
import type { MetodoPagamento } from "@/lib/dominio";
import { arrotonda, oggiISO } from "@/lib/format";
import { nuovoId } from "@/lib/id";
import { pagamentoApertoLavoro } from "@/lib/lavoro-calc";
import type { Pagamento } from "@/lib/types";
import { useStore } from "./store";

/** Registra un incasso su un lavoro: aggiorna il pagamento aperto o ne crea uno. */
export async function incassaLavoro(lavoroId: string, importo: number): Promise<void> {
  const { dati, salva } = useStore.getState();
  const lavoro = dati.lavori.find((l) => l.id === lavoroId);
  if (!lavoro || importo <= 0) return;

  const aperto = pagamentoApertoLavoro(dati, lavoroId);
  if (aperto) {
    await salva("pagamenti", {
      ...aperto,
      importoIncassato: arrotonda(aperto.importoIncassato + importo),
      dataIncasso: oggiISO(),
    });
    return;
  }
  const nuovo: Pagamento = {
    id: nuovoId(),
    clienteId: lavoro.clienteId ?? "",
    lavoroId,
    origine: lavoro.modo === "preventivo" ? "preventivo" : "ore",
    importoAtteso: arrotonda(importo),
    importoIncassato: arrotonda(importo),
    dataEmissione: oggiISO(),
    dataIncasso: oggiISO(),
    updatedAt: "",
  };
  await salva("pagamenti", nuovo);
}

/** Converte programmato -> svolto (la card "si posa"). */
export async function segnaSvolto(lavoroId: string): Promise<void> {
  const { dati, salva } = useStore.getState();
  const l = dati.lavori.find((x) => x.id === lavoroId);
  if (l && l.fase !== "fatto") await salva("lavori", { ...l, fase: "fatto" });
}

/** Riporta svolto -> programmato. */
export async function riprogramma(lavoroId: string, nuovaData?: string): Promise<void> {
  const { dati, salva } = useStore.getState();
  const l = dati.lavori.find((x) => x.id === lavoroId);
  if (l) await salva("lavori", { ...l, fase: "da_fare", data: nuovaData ?? l.data });
}

export async function eliminaLavoro(lavoroId: string): Promise<void> {
  await useStore.getState().elimina("lavori", lavoroId);
}

/** Paga un operaio: crea un CompensoOperatore (denaro in uscita). */
export async function pagaOperaio(operatoreId: string, importo: number, metodo?: MetodoPagamento, periodo?: string): Promise<void> {
  const { salva } = useStore.getState();
  if (importo <= 0) return;
  await salva("compensi", {
    id: nuovoId(),
    operatoreId,
    importo: arrotonda(importo),
    data: oggiISO(),
    periodo,
    metodo,
    updatedAt: "",
  });
}
