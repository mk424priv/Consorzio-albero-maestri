// Azioni di dominio: ogni mutazione passa dallo store (canone AGENTS / 02 §6,§9).
// Ogni azione critica ritorna una funzione `Annulla` per l'undo (cancellazioni soft).
import type { MetodoPagamento } from "@/lib/dominio";
import { arrotonda, oggiISO } from "@/lib/format";
import { nuovoId } from "@/lib/id";
import { operatoreIo, pagamentoApertoLavoro } from "@/lib/lavoro-calc";
import type { Pagamento } from "@/lib/types";
import { useStore } from "./store";

export type Annulla = () => Promise<void>;
const noop: Annulla = async () => {};

/** Registra un incasso su un lavoro: aggiorna il pagamento aperto o ne crea uno. */
export async function incassaLavoro(lavoroId: string, importo: number): Promise<Annulla> {
  const { dati, salva, elimina } = useStore.getState();
  const lavoro = dati.lavori.find((l) => l.id === lavoroId);
  if (!lavoro || importo <= 0) return noop;

  const aperto = pagamentoApertoLavoro(dati, lavoroId);
  if (aperto) {
    const prima = { ...aperto };
    await salva("pagamenti", { ...aperto, importoIncassato: arrotonda(aperto.importoIncassato + importo), dataIncasso: oggiISO() });
    return async () => { await salva("pagamenti", prima); };
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
  return async () => { await elimina("pagamenti", nuovo.id); };
}

/** Converte programmato -> svolto (la card "si posa"). */
export async function segnaSvolto(lavoroId: string): Promise<Annulla> {
  const { dati, salva } = useStore.getState();
  const l = dati.lavori.find((x) => x.id === lavoroId);
  if (!l || l.fase === "fatto") return noop;
  const prima = { ...l };
  await salva("lavori", { ...l, fase: "fatto" });
  return async () => { await salva("lavori", prima); };
}

/** Riporta svolto -> programmato. */
export async function riprogramma(lavoroId: string, nuovaData?: string): Promise<Annulla> {
  const { dati, salva } = useStore.getState();
  const l = dati.lavori.find((x) => x.id === lavoroId);
  if (!l) return noop;
  const prima = { ...l };
  await salva("lavori", { ...l, fase: "da_fare", data: nuovaData ?? l.data });
  return async () => { await salva("lavori", prima); };
}

export async function eliminaLavoro(lavoroId: string): Promise<Annulla> {
  const { dati, elimina, salva } = useStore.getState();
  const l = dati.lavori.find((x) => x.id === lavoroId);
  await elimina("lavori", lavoroId);
  if (!l) return noop;
  return async () => { await salva("lavori", { ...l, deleted: false }); };
}

/** Incasso subito: lavoro preventivo fatto + pagamento gia' incassato, zero ore. */
export async function incassaSubito(opts: {
  clienteId?: string;
  titolo: string;
  importo: number;
  data?: string;
  metodo?: MetodoPagamento;
}): Promise<{ id: string; annulla: Annulla }> {
  const { dati, salva, elimina } = useStore.getState();
  const io = operatoreIo(dati);
  const lavoroId = nuovoId();
  const pagamentoId = nuovoId();
  const data = opts.data ?? oggiISO();
  await salva("lavori", {
    id: lavoroId,
    clienteId: opts.clienteId,
    titolo: opts.titolo.trim() || "Incasso subito",
    data,
    fase: "fatto",
    modo: "preventivo",
    conteggio: "totale",
    prezzo: arrotonda(opts.importo),
    periodo: null,
    tariffaClienteSnapshot: null,
    partecipanti: io ? [{ collaboratoreId: io.id, tariffaSnapshot: io.tariffaOraria ?? 0 }] : [],
    contaMieOreComeCosto: false,
    creatoIl: data,
    updatedAt: "",
  });
  await salva("pagamenti", {
    id: pagamentoId,
    clienteId: opts.clienteId ?? "",
    lavoroId,
    origine: "preventivo",
    importoAtteso: arrotonda(opts.importo),
    importoIncassato: arrotonda(opts.importo),
    dataEmissione: data,
    dataIncasso: data,
    note: opts.metodo,
    updatedAt: "",
  });
  const annulla: Annulla = async () => {
    await elimina("pagamenti", pagamentoId);
    await elimina("lavori", lavoroId);
  };
  return { id: lavoroId, annulla };
}

/** Prelievo del titolare (denaro in uscita): CompensoOperatore(io) con note "prelievo". */
export async function prelievoTitolare(importo: number, data?: string): Promise<Annulla> {
  const { dati, salva, elimina } = useStore.getState();
  const io = operatoreIo(dati);
  if (!io || importo <= 0) return noop;
  const id = nuovoId();
  await salva("compensi", { id, operatoreId: io.id, importo: arrotonda(importo), data: data ?? oggiISO(), note: "prelievo", updatedAt: "" });
  return async () => { await elimina("compensi", id); };
}

/** Paga un operaio: crea un CompensoOperatore (denaro in uscita). */
export async function pagaOperaio(operatoreId: string, importo: number, metodo?: MetodoPagamento, periodo?: string): Promise<Annulla> {
  const { salva, elimina } = useStore.getState();
  if (importo <= 0) return noop;
  const id = nuovoId();
  await salva("compensi", { id, operatoreId, importo: arrotonda(importo), data: oggiISO(), periodo, metodo, updatedAt: "" });
  return async () => { await elimina("compensi", id); };
}
