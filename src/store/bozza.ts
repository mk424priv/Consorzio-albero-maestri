import { create } from "zustand";
import type { CategoriaSpesa, Fase } from "@/lib/dominio";
import { arrotonda, oggiISO } from "@/lib/format";
import { nuovoId } from "@/lib/id";
import { calcoloLavoro, operatoreIo } from "@/lib/lavoro-calc";
import type { Lavoro } from "@/lib/types";
import { useStore } from "./store";

export type ModoCalc = "preventivo" | "ore" | "giornate" | "totale";

export interface BozzaPartecipante {
  collaboratoreId: string;
  tariffaSnapshot: number;
  ore: number; // totale per ore/totale; per giornate si deriva dalle righe
}
export interface RigaGiornata {
  id: string;
  data: string;
  ore: Record<string, number>; // collaboratoreId -> ore
}
export interface BozzaSpesa {
  id: string;
  categoria: CategoriaSpesa;
  descrizione: string;
  importo: number;
}

export interface Bozza {
  fase: Fase;
  modoCalc: ModoCalc | null;
  clienteId: string | null;
  titolo: string;
  data: string;
  periodo: { dal: string; al: string } | null;
  prezzo: number | null;
  tariffaCliente: number | null;
  tariffaModificata: boolean;
  partecipanti: BozzaPartecipante[]; // include "io"
  giornate: RigaGiornata[];
  spese: BozzaSpesa[];
  mostraSpese: boolean;
  mostraOperai: boolean;
  contaMieOreComeCosto: boolean;
  giaIncassato: "no" | "tutto" | "parte";
  importoParte: number;
}

function bozzaIniziale(): Bozza {
  return {
    fase: "fatto",
    modoCalc: null,
    clienteId: null,
    titolo: "",
    data: oggiISO(),
    periodo: null,
    prezzo: null,
    tariffaCliente: null,
    tariffaModificata: false,
    partecipanti: [],
    giornate: [],
    spese: [],
    mostraSpese: false,
    mostraOperai: false,
    contaMieOreComeCosto: false,
    giaIncassato: "no",
    importoParte: 0,
  };
}

interface BozzaStore {
  b: Bozza;
  apri: (ctx?: { data?: string; clienteId?: string; operatoreId?: string; fase?: Fase }) => void;
  set: (patch: Partial<Bozza>) => void;
  reset: () => void;
}

export const useBozza = create<BozzaStore>((set) => ({
  b: bozzaIniziale(),
  apri: (ctx) => {
    const { dati } = useStore.getState();
    const io = operatoreIo(dati);
    const base = bozzaIniziale();
    if (ctx?.fase) base.fase = ctx.fase;
    if (ctx?.data) base.data = ctx.data;
    if (ctx?.clienteId) {
      base.clienteId = ctx.clienteId;
      const c = dati.clienti.find((x) => x.id === ctx.clienteId);
      base.tariffaCliente = c?.tariffaOraria ?? null;
    }
    const primi: BozzaPartecipante[] = [];
    if (io) primi.push({ collaboratoreId: io.id, tariffaSnapshot: io.tariffaOraria ?? 0, ore: 0 });
    if (ctx?.operatoreId && ctx.operatoreId !== io?.id) {
      const op = dati.operatori.find((x) => x.id === ctx.operatoreId);
      if (op) {
        primi.push({ collaboratoreId: op.id, tariffaSnapshot: op.tariffaOraria ?? 0, ore: 0 });
        base.mostraOperai = true;
      }
    }
    base.partecipanti = primi;
    set({ b: base });
  },
  set: (patch) => set((s) => ({ b: { ...s.b, ...patch } })),
  reset: () => set({ b: bozzaIniziale() }),
}));

// ── Derivati della bozza (live) ──
export function orePartecipante(b: Bozza, collaboratoreId: string): number {
  if (b.modoCalc === "giornate") {
    return arrotonda(b.giornate.reduce((a, g) => a + (g.ore[collaboratoreId] || 0), 0));
  }
  return arrotonda(b.partecipanti.find((p) => p.collaboratoreId === collaboratoreId)?.ore ?? 0);
}
export function oreTotaliBozza(b: Bozza): number {
  return arrotonda(b.partecipanti.reduce((a, p) => a + orePartecipante(b, p.collaboratoreId), 0));
}
export function lordoBozza(b: Bozza): number {
  if (b.modoCalc === "preventivo") return arrotonda(b.prezzo ?? 0);
  return arrotonda(oreTotaliBozza(b) * (b.tariffaCliente ?? 0));
}

/** Materializza la bozza: crea Lavoro + RegistrazioneOre + Spese + Pagamento. */
export async function salvaBozza(): Promise<string> {
  const { b } = useBozza.getState();
  const { salva } = useStore.getState();

  const modo: "preventivo" | "ore" = b.modoCalc === "preventivo" ? "preventivo" : "ore";
  const conteggio: "totale" | "per_giorni" = b.modoCalc === "giornate" ? "per_giorni" : "totale";
  const lavoroId = nuovoId();
  const titolo = b.titolo.trim() || (modo === "preventivo" ? "Lavoro a preventivo" : "Lavoro a ore");
  const cId = b.clienteId ?? undefined;

  const lavoro: Lavoro = {
    id: lavoroId,
    clienteId: cId,
    titolo,
    data: b.data,
    fase: b.fase,
    modo,
    conteggio,
    periodo: b.periodo,
    prezzo: modo === "preventivo" ? b.prezzo ?? 0 : null,
    tariffaClienteSnapshot: modo === "ore" ? b.tariffaCliente ?? 0 : null,
    partecipanti: b.partecipanti.map((p) => ({
      collaboratoreId: p.collaboratoreId,
      tariffaSnapshot: p.tariffaSnapshot,
      oreTotale: orePartecipante(b, p.collaboratoreId),
    })),
    contaMieOreComeCosto: b.contaMieOreComeCosto,
    creatoIl: oggiISO(),
    updatedAt: "",
  };
  await salva("lavori", lavoro);

  // Le ore reali vivono in db.ore solo per svolto (nel programmato sono solo intenzione).
  if (b.fase === "fatto" && modo === "ore") {
    if (conteggio === "per_giorni") {
      for (const g of b.giornate) {
        for (const p of b.partecipanti) {
          const ore = g.ore[p.collaboratoreId] || 0;
          if (ore > 0) {
            await salva("ore", { id: nuovoId(), lavoroId, clienteId: cId, operatoreId: p.collaboratoreId, data: g.data, ore, updatedAt: "" });
          }
        }
      }
    } else {
      for (const p of b.partecipanti) {
        if (p.ore > 0) {
          await salva("ore", { id: nuovoId(), lavoroId, clienteId: cId, operatoreId: p.collaboratoreId, data: b.periodo?.al ?? b.data, ore: p.ore, updatedAt: "" });
        }
      }
    }
  }

  // Spese
  for (const s of b.spese) {
    if (s.importo > 0) {
      await salva("spese", { id: nuovoId(), categoria: s.categoria, importo: s.importo, data: b.data, descrizione: s.descrizione || undefined, clienteId: cId, lavoroId, updatedAt: "" });
    }
  }

  // Pagamento (solo svolto) — uso il lordo reale calcolato dal motore dopo aver salvato le ore
  if (b.fase === "fatto") {
    const datiAgg = useStore.getState().dati;
    const lavoroAgg = datiAgg.lavori.find((l) => l.id === lavoroId);
    const lordo = lavoroAgg ? calcoloLavoro(datiAgg, lavoroAgg).lordo : 0;
    if (lordo > 0) {
      let incassato = 0;
      if (b.giaIncassato === "tutto") incassato = lordo;
      else if (b.giaIncassato === "parte") incassato = Math.min(arrotonda(b.importoParte), lordo);
      await salva("pagamenti", {
        id: nuovoId(),
        clienteId: b.clienteId ?? "",
        lavoroId,
        origine: modo === "preventivo" ? "preventivo" : "ore",
        importoAtteso: lordo,
        importoIncassato: arrotonda(incassato),
        dataEmissione: b.data,
        dataIncasso: incassato > 0 ? oggiISO() : undefined,
        updatedAt: "",
      });
    }
  }

  useBozza.getState().reset();
  return lavoroId;
}
