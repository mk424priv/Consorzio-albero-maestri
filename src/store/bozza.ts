import { create } from "zustand";
import type { CategoriaSpesa, Fase, FasciaGiornata, MetodoPagamento, StatoPreventivo } from "@/lib/dominio";
import { arrotonda, oggiISO, SOGLIA } from "@/lib/format";
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
  id: string | null; // null = nuovo record, valorizzato = modifica
  fase: Fase;
  modoCalc: ModoCalc | null;
  clienteId: string | null;
  titolo: string;
  data: string;
  oraInizio: string; // "HH:MM" — ora d'arrivo al cantiere
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
  luogo: string;
  fascia: FasciaGiornata | null;
  statoPreventivo: StatoPreventivo | null;
  metodoPagamento: MetodoPagamento | null;
  scadenzaIncasso: string; // ISO yyyy-mm-dd o ""
}

function bozzaIniziale(): Bozza {
  return {
    id: null,
    fase: "fatto",
    modoCalc: null,
    clienteId: null,
    titolo: "",
    data: oggiISO(),
    oraInizio: "",
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
    luogo: "",
    fascia: null,
    statoPreventivo: null,
    metodoPagamento: null,
    scadenzaIncasso: "",
  };
}

const BOZZA_KEY = "albero:bozza";

/** Una bozza «da riprendere»: nuova (id null) e con qualcosa dentro. */
export function bozzaNonVuota(b: Bozza): boolean {
  if (b.id !== null) return false;
  return Boolean(
    b.titolo.trim() ||
      b.modoCalc ||
      b.clienteId ||
      b.spese.length ||
      b.partecipanti.some((p) => p.ore > 0) ||
      b.giornate.some((g) => Object.values(g.ore).some((n) => n > 0)),
  );
}

function persisti(b: Bozza) {
  try {
    if (bozzaNonVuota(b)) localStorage.setItem(BOZZA_KEY, JSON.stringify(b));
    else localStorage.removeItem(BOZZA_KEY);
  } catch {
    /* storage non disponibile: ignora */
  }
}

function caricaPersistita(): Bozza | null {
  try {
    const t = localStorage.getItem(BOZZA_KEY);
    if (!t) return null;
    const b = JSON.parse(t) as Bozza;
    return bozzaNonVuota(b) ? b : null;
  } catch {
    return null;
  }
}

interface BozzaStore {
  b: Bozza;
  apri: (ctx?: { data?: string; clienteId?: string; operatoreId?: string; fase?: Fase; lavoroId?: string }) => void;
  set: (patch: Partial<Bozza>) => void;
  reset: () => void;
}

export const useBozza = create<BozzaStore>((set) => ({
  b: caricaPersistita() ?? bozzaIniziale(),
  apri: (ctx) => {
    const { dati } = useStore.getState();
    const io = operatoreIo(dati);
    const base = bozzaIniziale();

    // ── MODIFICA di un lavoro esistente: reverse-map completo ──
    if (ctx?.lavoroId) {
      const l = dati.lavori.find((x) => x.id === ctx.lavoroId && !x.deleted);
      if (l) {
        base.id = l.id;
        base.fase = l.fase;
        base.modoCalc = l.modo === "preventivo" ? "preventivo" : l.conteggio === "per_giorni" ? "giornate" : "ore";
        base.clienteId = l.clienteId ?? null;
        base.titolo = l.titolo;
        base.luogo = l.luogo ?? "";
        base.data = l.data;
        base.oraInizio = l.oraInizio ?? "";
        base.fascia = l.fascia ?? null;
        base.periodo = l.periodo ?? null;
        base.statoPreventivo = l.statoPreventivo ?? null;
        base.prezzo = l.prezzo ?? null;
        base.tariffaCliente = l.tariffaClienteSnapshot ?? dati.clienti.find((c) => c.id === l.clienteId)?.tariffaOraria ?? null;
        base.tariffaModificata = l.tariffaClienteSnapshot != null;
        base.contaMieOreComeCosto = l.contaMieOreComeCosto ?? false;
        const oreDi = (id: string) => arrotonda(dati.ore.filter((o) => o.lavoroId === l.id && o.operatoreId === id && !o.deleted).reduce((a, o) => a + o.ore, 0));
        base.partecipanti = l.partecipanti.map((p) => ({ collaboratoreId: p.collaboratoreId, tariffaSnapshot: p.tariffaSnapshot, ore: oreDi(p.collaboratoreId) }));
        if (io && !base.partecipanti.some((p) => p.collaboratoreId === io.id)) {
          base.partecipanti.unshift({ collaboratoreId: io.id, tariffaSnapshot: io.tariffaOraria ?? 0, ore: 0 });
        }
        base.mostraOperai = base.partecipanti.some((p) => p.collaboratoreId !== io?.id);
        if (base.modoCalc === "giornate") {
          const perData = new Map<string, RigaGiornata>();
          for (const o of dati.ore.filter((x) => x.lavoroId === l.id && !x.deleted)) {
            const g = perData.get(o.data) ?? { id: nuovoId(), data: o.data, ore: {} };
            if (o.operatoreId) g.ore[o.operatoreId] = (g.ore[o.operatoreId] ?? 0) + o.ore;
            perData.set(o.data, g);
          }
          base.giornate = [...perData.values()].sort((a, b) => a.data.localeCompare(b.data));
          if (base.giornate.length === 0) base.giornate = [{ id: nuovoId(), data: l.data, ore: {} }];
        }
        base.spese = dati.spese.filter((s) => s.lavoroId === l.id && !s.deleted).map((s) => ({ id: s.id, categoria: s.categoria, descrizione: s.descrizione ?? "", importo: s.importo }));
        base.mostraSpese = base.spese.length > 0;
        const pag = dati.pagamenti.find((p) => p.lavoroId === l.id && !p.deleted);
        const inc = pag?.importoIncassato ?? 0;
        const atteso = pag?.importoAtteso ?? 0;
        if (inc <= SOGLIA) base.giaIncassato = "no";
        else if (inc >= atteso - SOGLIA) base.giaIncassato = "tutto";
        else { base.giaIncassato = "parte"; base.importoParte = inc; }
        base.metodoPagamento = pag?.metodo ?? null;
        base.scadenzaIncasso = pag?.dataScadenza ?? "";
        persisti(base);
        set({ b: base });
        return;
      }
    }

    // ── NUOVO record ──
    if (ctx?.fase) base.fase = ctx.fase;
    if (ctx?.data) base.data = ctx.data;
    if (ctx?.clienteId) {
      base.clienteId = ctx.clienteId;
      const c = dati.clienti.find((x) => x.id === ctx.clienteId);
      base.tariffaCliente = c?.tariffaOraria ?? null;
      base.luogo = c?.luogo ?? "";
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
    persisti(base);
    set({ b: base });
  },
  set: (patch) =>
    set((s) => {
      const b = { ...s.b, ...patch };
      persisti(b);
      return { b };
    }),
  reset: () => {
    persisti(bozzaIniziale());
    set({ b: bozzaIniziale() });
  },
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

/** Ora di uscita = ora d'arrivo + ore (auto). "" se input incompleto. */
export function oraUscita(oraInizio: string, ore: number): string {
  if (!/^\d{1,2}:\d{2}$/.test(oraInizio) || !(ore > 0)) return "";
  const [h, m] = oraInizio.split(":").map(Number);
  const tot = h * 60 + m + Math.round(ore * 60);
  const hh = Math.floor((tot % 1440) / 60);
  const mm = tot % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** Materializza la bozza: crea Lavoro + RegistrazioneOre + Spese + Pagamento. */
export async function salvaBozza(): Promise<string> {
  const { b } = useBozza.getState();
  const { salva, elimina } = useStore.getState();
  const datiPrima = useStore.getState().dati;

  const modo: "preventivo" | "ore" = b.modoCalc === "preventivo" ? "preventivo" : "ore";
  const conteggio: "totale" | "per_giorni" = b.modoCalc === "giornate" ? "per_giorni" : "totale";
  const editing = b.id != null;
  const lavoroId = b.id ?? nuovoId();
  const titolo = b.titolo.trim() || (modo === "preventivo" ? "Lavoro a preventivo" : "Lavoro a ore");
  const cId = b.clienteId ?? undefined;

  const ioId = operatoreIo(datiPrima)?.id;
  const oreIo = ioId ? orePartecipante(b, ioId) : 0;
  const oraFineCalc = oraUscita(b.oraInizio, oreIo) || undefined;

  // in modifica: ore ricreate; SPESE riconciliate per id (no churn); il registro
  // PAGAMENTI è sacro e non si tocca mai per ricrearlo (canone 08 §2.1).
  if (editing) {
    for (const o of datiPrima.ore.filter((o) => o.lavoroId === lavoroId && !o.deleted)) await elimina("ore", o.id);
    const idsSpeseBozza = new Set(b.spese.map((s) => s.id));
    for (const s of datiPrima.spese.filter((s) => s.lavoroId === lavoroId && !s.deleted && !idsSpeseBozza.has(s.id))) await elimina("spese", s.id);
  }

  const lavoro: Lavoro = {
    id: lavoroId,
    clienteId: cId,
    titolo,
    luogo: b.luogo.trim() || undefined,
    data: b.data,
    oraInizio: b.oraInizio || undefined,
    oraFine: oraFineCalc,
    fase: b.fase,
    modo,
    conteggio,
    fascia: b.fascia ?? undefined,
    periodo: b.periodo,
    statoPreventivo: modo === "preventivo" ? b.statoPreventivo ?? undefined : undefined,
    prezzo: modo === "preventivo" ? b.prezzo ?? 0 : null,
    tariffaClienteSnapshot: modo === "ore" ? b.tariffaCliente : null,
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
            await salva("ore", { id: nuovoId(), lavoroId, clienteId: cId, operatoreId: p.collaboratoreId, data: g.data, ore, creatoIl: oggiISO(), updatedAt: "" });
          }
        }
      }
    } else {
      for (const p of b.partecipanti) {
        if (p.ore > 0) {
          await salva("ore", { id: nuovoId(), lavoroId, clienteId: cId, operatoreId: p.collaboratoreId, data: b.periodo?.al ?? b.data, ore: p.ore, creatoIl: oggiISO(), updatedAt: "" });
        }
      }
    }
  }

  // Spese — riusa l'id della bozza (upsert, no churn di ULID)
  for (const s of b.spese) {
    if (s.importo > 0) {
      await salva("spese", { id: s.id, categoria: s.categoria, importo: s.importo, data: b.data, descrizione: s.descrizione || undefined, clienteId: cId, lavoroId, creatoIl: oggiISO(), updatedAt: "" });
    }
  }

  // Pagamento — registro sacro: in MODIFICA si aggiorna solo l'atteso (preserva
  // incassi/date/metodo); alla CREAZIONE si crea secondo «già incassato?» (08 §2.1).
  if (b.fase === "fatto") {
    const datiAgg = useStore.getState().dati;
    const lavoroAgg = datiAgg.lavori.find((l) => l.id === lavoroId);
    const lordo = lavoroAgg ? calcoloLavoro(datiAgg, lavoroAgg).lordo : 0;
    const pagEsistente = datiAgg.pagamenti.find((p) => p.lavoroId === lavoroId && !p.deleted);
    if (editing && pagEsistente) {
      if (arrotonda(pagEsistente.importoAtteso) !== lordo) {
        await salva("pagamenti", { ...pagEsistente, importoAtteso: lordo });
      }
    } else if (lordo > 0) {
      let incassato = 0;
      if (!editing) {
        if (b.giaIncassato === "tutto") incassato = lordo;
        else if (b.giaIncassato === "parte") incassato = Math.min(arrotonda(b.importoParte), lordo);
      }
      await salva("pagamenti", {
        id: nuovoId(),
        clienteId: b.clienteId ?? "",
        lavoroId,
        origine: modo === "preventivo" ? "preventivo" : "ore",
        importoAtteso: lordo,
        importoIncassato: arrotonda(incassato),
        dataEmissione: b.data,
        dataScadenza: b.scadenzaIncasso || undefined,
        dataIncasso: incassato > 0 ? oggiISO() : undefined,
        metodo: b.metodoPagamento ?? undefined,
        creatoIl: oggiISO(),
        updatedAt: "",
      });
    }
  }

  useBozza.getState().reset();
  return lavoroId;
}
