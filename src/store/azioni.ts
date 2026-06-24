// Azioni di dominio: ogni mutazione passa dallo store (canone AGENTS / 02 §6,§9).
// Ogni azione critica ritorna una funzione `Annulla` per l'undo (cancellazioni soft).
import type { MetodoPagamento } from "@/lib/dominio";
import { arrotonda, dataDaISO, oggiISO } from "@/lib/format";
import { nuovoId } from "@/lib/id";
import { dovutoOperatore } from "@/lib/conti";
import { calcoloLavoro, operatoreIo, pagamentoApertoLavoro } from "@/lib/lavoro-calc";
import type { Lavoro, Pagamento } from "@/lib/types";
import { useStore } from "./store";

export type Annulla = () => Promise<void>;
const noop: Annulla = async () => {};

/** Registra un incasso su un lavoro: aggiorna il pagamento aperto o ne crea uno. */
export async function incassaLavoro(lavoroId: string, importo: number): Promise<Annulla> {
  const { dati, salva, elimina } = useStore.getState();
  const lavoro = dati.lavori.find((l) => l.id === lavoroId);
  if (!lavoro) return noop;
  // VINCOLO: mai incassare più del residuo aperto del lavoro (niente over-incasso).
  const residuo = calcoloLavoro(dati, lavoro).daIncassare;
  const eff = Math.min(arrotonda(importo), residuo);
  if (eff <= 0) return noop;

  const aperto = pagamentoApertoLavoro(dati, lavoroId);
  if (aperto) {
    const prima = { ...aperto };
    await salva("pagamenti", { ...aperto, importoIncassato: arrotonda(aperto.importoIncassato + eff), dataIncasso: oggiISO() });
    return async () => { await salva("pagamenti", prima); };
  }
  const nuovo: Pagamento = {
    id: nuovoId(),
    clienteId: lavoro.clienteId ?? "",
    lavoroId,
    origine: lavoro.modo === "preventivo" ? "preventivo" : "ore",
    importoAtteso: arrotonda(eff),
    importoIncassato: arrotonda(eff),
    dataEmissione: oggiISO(),
    dataIncasso: oggiISO(),
    creatoIl: oggiISO(),
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

/** Duplica un lavoro come nuovo PROGRAMMATO (oggi), senza ore/incassi. */
export async function duplicaLavoro(lavoroId: string): Promise<{ id: string; annulla: Annulla } | null> {
  const { dati, salva, elimina } = useStore.getState();
  const l = dati.lavori.find((x) => x.id === lavoroId);
  if (!l) return null;
  const id = nuovoId();
  await salva("lavori", {
    ...l,
    id,
    fase: "da_fare",
    data: oggiISO(),
    creatoIl: oggiISO(),
    partecipanti: l.partecipanti.map((p) => ({ ...p, oreTotale: 0 })),
    rev: undefined,
    deleted: false,
    updatedAt: "",
  });
  return { id, annulla: async () => { await elimina("lavori", id); } };
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
    metodo: opts.metodo,
    creatoIl: data,
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
  await salva("compensi", { id, operatoreId: io.id, importo: arrotonda(importo), data: data ?? oggiISO(), note: "prelievo", creatoIl: oggiISO(), updatedAt: "" });
  return async () => { await elimina("compensi", id); };
}

/** Elimina (soft) un attrezzo/veicolo del Garage. */
export async function eliminaAttrezzo(id: string): Promise<Annulla> {
  const { dati, elimina, salva } = useStore.getState();
  const a = dati.attrezzi.find((x) => x.id === id);
  await elimina("attrezzi", id);
  if (!a) return noop;
  return async () => { await salva("attrezzi", { ...a, deleted: false }); };
}

/** Elimina (soft) un cliente. I lavori collegati restano nei conti. */
export async function eliminaCliente(id: string): Promise<Annulla> {
  const { dati, elimina, salva } = useStore.getState();
  const c = dati.clienti.find((x) => x.id === id);
  await elimina("clienti", id);
  if (!c) return noop;
  return async () => { await salva("clienti", { ...c, deleted: false }); };
}

/** Elimina (soft) un operaio collaboratore (mai il titolare). */
export async function eliminaOperaio(id: string): Promise<Annulla> {
  const { dati, elimina, salva } = useStore.getState();
  const o = dati.operatori.find((x) => x.id === id);
  if (!o || o.ruolo === "titolare") return noop;
  await elimina("operatori", id);
  return async () => { await salva("operatori", { ...o, deleted: false }); };
}

/** Paga un operaio: crea un CompensoOperatore (denaro in uscita). */
export async function pagaOperaio(operatoreId: string, importo: number, metodo?: MetodoPagamento, periodo?: string): Promise<Annulla> {
  const { dati, salva, elimina } = useStore.getState();
  // VINCOLO: mai pagare più del dovuto all'operaio.
  const dovuto = dovutoOperatore(dati, operatoreId).daPagare;
  const eff = Math.min(arrotonda(importo), dovuto);
  if (eff <= 0) return noop;
  const id = nuovoId();
  await salva("compensi", { id, operatoreId, importo: arrotonda(eff), data: oggiISO(), periodo, metodo, creatoIl: oggiISO(), updatedAt: "" });
  return async () => { await elimina("compensi", id); };
}

/** Storno: riduce l'incassato di un lavoro (clamp ≥0); se va a 0 riapre il pagamento. (08 §5.2) */
export async function stornaIncasso(lavoroId: string, importo: number): Promise<Annulla> {
  const { dati, salva } = useStore.getState();
  const pag = dati.pagamenti.find((p) => p.lavoroId === lavoroId && !p.deleted && p.importoIncassato > 0);
  if (!pag || importo <= 0) return noop;
  const prima = { ...pag };
  const nuovoInc = arrotonda(Math.max(0, pag.importoIncassato - importo));
  await salva("pagamenti", { ...pag, importoIncassato: nuovoInc, dataIncasso: nuovoInc > 0 ? pag.dataIncasso : undefined });
  return async () => { await salva("pagamenti", prima); };
}

/** Spezza: il corrente diventa svolto (parte fatta) + nuovo programmato «· resto». (08 §5.1) */
export async function spezzaLavoro(lavoroId: string): Promise<{ id: string; annulla: Annulla } | null> {
  const { dati, salva, elimina } = useStore.getState();
  const l = dati.lavori.find((x) => x.id === lavoroId);
  if (!l) return null;
  const prima = { ...l };
  await salva("lavori", { ...l, fase: "fatto" });
  const id = nuovoId();
  await salva("lavori", {
    ...l, id, fase: "da_fare", data: oggiISO(), titolo: `${l.titolo} · resto`, creatoIl: oggiISO(),
    partecipanti: l.partecipanti.map((p) => ({ ...p, oreTotale: 0 })), rev: undefined, deleted: false, updatedAt: "",
  });
  return { id, annulla: async () => { await elimina("lavori", id); await salva("lavori", prima); } };
}

/** Crea N occorrenze future di un programmato (settimanale/mensile). (08 §5.4) */
export async function creaRicorrenze(lavoroId: string, periodicita: "settimana" | "mese", volte: number): Promise<Annulla> {
  const { dati, salva, elimina } = useStore.getState();
  const l = dati.lavori.find((x) => x.id === lavoroId);
  if (!l || volte <= 0) return noop;
  const isoDi = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const base = dataDaISO(l.data);
  const creati: string[] = [];
  for (let i = 1; i <= volte; i++) {
    const d = new Date(base);
    if (periodicita === "settimana") d.setDate(d.getDate() + 7 * i);
    else d.setMonth(d.getMonth() + i);
    const id = nuovoId();
    await salva("lavori", {
      ...l, id, fase: "da_fare", data: isoDi(d), creatoIl: oggiISO(),
      partecipanti: l.partecipanti.map((p) => ({ ...p, oreTotale: 0 })), rev: undefined, deleted: false, updatedAt: "",
    });
    creati.push(id);
  }
  return async () => { for (const id of creati) await elimina("lavori", id); };
}

/** Converte programmato → svolto chiedendo ore reali (modo ore) o prezzo (preventivo). (08 §5.3) */
export async function convertiSvolto(lavoroId: string, ore?: number, prezzo?: number): Promise<Annulla> {
  const { dati, salva, elimina } = useStore.getState();
  const l = dati.lavori.find((x) => x.id === lavoroId);
  if (!l || l.fase === "fatto") return noop;
  const prima = { ...l };
  const io = operatoreIo(dati);
  const patch: Partial<Lavoro> = { fase: "fatto" };
  if (l.modo === "preventivo" && prezzo != null && prezzo > 0) patch.prezzo = arrotonda(prezzo);
  await salva("lavori", { ...l, ...patch });
  const oreCreate: string[] = [];
  if (l.modo === "ore" && ore && ore > 0 && io) {
    const id = nuovoId();
    await salva("ore", { id, lavoroId, clienteId: l.clienteId, operatoreId: io.id, data: l.data, ore, creatoIl: oggiISO(), updatedAt: "" });
    oreCreate.push(id);
  }
  return async () => { for (const id of oreCreate) await elimina("ore", id); await salva("lavori", prima); };
}
