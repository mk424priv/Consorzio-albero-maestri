// Store dei dati (Zustand + persistenza in localStorage).
// Tutta la logica di mutazione del dominio. Per collegare un backend reale
// basta sostituire l'implementazione di queste azioni con chiamate HTTP.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Attrezzo,
  Cliente,
  CompensoOperatore,
  Database,
  Lavoro,
  Operatore,
  Pagamento,
  Preventivo,
  RegistrazioneOre,
  Spesa,
} from "@/lib/types";
import { datiIniziali } from "@/data/seed";
import { assegnaIniziali } from "@/lib/codice-parlante";
import { arrotonda } from "@/lib/format";
import { nuovoId } from "@/lib/id";

const PASSWORD_DEFAULT = "albero";
const oggiISO = () => new Date().toISOString().slice(0, 10);
type Parziale<T> = Partial<Omit<T, "id">>;

// helper per le azioni generiche (pannello admin → store app)
const arrDi = (db: Database, coll: keyof Database) => db[coll] as unknown as { id: string }[];
const conColl = (db: Database, coll: keyof Database, arr: unknown[]): Database =>
  ({ ...db, [coll]: arr } as unknown as Database);

function ricalcolaPagamento(p: Pagamento): Pagamento {
  const saldato = p.importoIncassato >= p.importoAtteso - 0.005 && p.importoAtteso > 0;
  const inRitardo = !saldato && !!p.dataScadenza && new Date(p.dataScadenza) < new Date();
  return {
    ...p,
    stato: saldato ? "pagato" : inRitardo ? "in_ritardo" : "in_attesa",
    dataIncasso: saldato ? (p.dataIncasso ?? oggiISO()) : null,
  };
}

interface Stato {
  db: Database;
  autenticato: boolean;

  login: (password: string) => boolean;
  logout: () => void;
  reseed: () => void;
  svuota: () => void;

  // clienti
  creaCliente: (i: {
    nome: string; cognome: string; telefono?: string | null; email?: string | null;
    luogo?: string | null; tariffaOraria?: number | null;
    modalitaPredefinita?: Cliente["modalitaPredefinita"]; note?: string | null;
  }) => string;
  aggiornaCliente: (id: string, patch: Parziale<Cliente>) => void;
  eliminaCliente: (id: string) => void;

  // operatori
  creaOperatore: (i: { nome: string; ruolo?: Operatore["ruolo"]; tariffaOraria?: number | null; telefono?: string | null; note?: string | null }) => string;
  aggiornaOperatore: (id: string, patch: Parziale<Operatore>) => void;
  eliminaOperatore: (id: string) => void;

  // compensi (uscite verso operatori)
  pagaOperatore: (i: { operatoreId: string; importo: number; data?: string; periodo?: string | null; metodo?: CompensoOperatore["metodo"]; note?: string | null }) => void;
  eliminaCompenso: (id: string) => void;

  // lavori
  creaLavoro: (i: Omit<Lavoro, "id" | "creatoIl" | "stato"> & { stato?: Lavoro["stato"] }) => void;
  aggiornaLavoro: (id: string, patch: Parziale<Lavoro>) => void;
  cambiaStatoLavoro: (id: string, stato: Lavoro["stato"]) => void;
  eliminaLavoro: (id: string) => void;

  // preventivi
  creaPreventivo: (i: { clienteId: string; lavoroId?: string | null; tipo: Preventivo["tipo"]; importoTotale: number; importoAcconto?: number | null; dataEmissione?: string; dataScadenza?: string | null; note?: string | null }) => void;
  aggiornaPreventivo: (id: string, patch: Parziale<Preventivo>) => void;
  eliminaPreventivo: (id: string) => void;

  // ore
  registraOre: (i: Omit<RegistrazioneOre, "id">) => void;
  aggiornaOre: (id: string, patch: Parziale<RegistrazioneOre>) => void;
  eliminaOre: (id: string) => void;
  generaCompensoCliente: (clienteId: string, anno: number, mese: number) => { ok: boolean; messaggio: string };

  // pagamenti (incassi)
  creaPagamento: (i: { clienteId: string; lavoroId?: string | null; importoAtteso: number; dataEmissione?: string; dataScadenza?: string | null; note?: string | null }) => void;
  registraIncasso: (id: string, importo?: number, dataIncasso?: string) => void;
  aggiornaPagamento: (id: string, patch: Parziale<Pagamento>) => void;
  eliminaPagamento: (id: string) => void;

  // spese
  creaSpesa: (i: Omit<Spesa, "id">) => void;
  aggiornaSpesa: (id: string, patch: Parziale<Spesa>) => void;
  eliminaSpesa: (id: string) => void;

  // officina
  creaAttrezzo: (i: Omit<Attrezzo, "id">) => void;
  aggiornaAttrezzo: (id: string, patch: Parziale<Attrezzo>) => void;
  eliminaAttrezzo: (id: string) => void;

  // generiche (usate dal pannello amministrativo)
  patchRecord: (coll: keyof Database, id: string, patch: Record<string, unknown>) => void;
  addRecord: (coll: keyof Database, rec: Record<string, unknown>) => string;
  removeRecord: (coll: keyof Database, id: string) => void;
}

export const useStore = create<Stato>()(
  persist(
    (set, get) => ({
      db: datiIniziali(),
      autenticato: false,

      login: (password) => {
        const ok = password === PASSWORD_DEFAULT;
        if (ok) set({ autenticato: true });
        return ok;
      },
      logout: () => set({ autenticato: false }),
      reseed: () => set({ db: datiIniziali() }),
      svuota: () =>
        set((s) => ({
          db: {
            clienti: [], operatori: s.db.operatori, lavori: [], preventivi: [],
            ore: [], pagamenti: [], compensi: [], spese: [], attrezzi: [],
          },
        })),

      // ---------------- clienti ----------------
      creaCliente: (i) => {
        const db = get().db;
        const id = nuovoId("cl");
        const cliente: Cliente = {
          id,
          nome: i.nome.trim(),
          cognome: i.cognome.trim(),
          inizialiCodice: assegnaIniziali(i.nome, i.cognome, db.clienti),
          telefono: i.telefono ?? null,
          email: i.email ?? null,
          luogo: i.luogo ?? null,
          tariffaOraria: i.tariffaOraria ?? null,
          modalitaPredefinita: i.modalitaPredefinita ?? "preventivo",
          note: i.note ?? null,
          creatoIl: new Date().toISOString(),
        };
        set({ db: { ...db, clienti: [...db.clienti, cliente] } });
        return id;
      },
      aggiornaCliente: (id, patch) =>
        set((s) => ({ db: { ...s.db, clienti: s.db.clienti.map((c) => (c.id === id ? { ...c, ...patch } : c)) } })),
      eliminaCliente: (id) =>
        set((s) => ({
          db: {
            ...s.db,
            clienti: s.db.clienti.filter((c) => c.id !== id),
            lavori: s.db.lavori.filter((l) => l.clienteId !== id),
            preventivi: s.db.preventivi.filter((p) => p.clienteId !== id),
            ore: s.db.ore.filter((o) => o.clienteId !== id),
            pagamenti: s.db.pagamenti.filter((p) => p.clienteId !== id),
            spese: s.db.spese.map((sp) => (sp.clienteId === id ? { ...sp, clienteId: null } : sp)),
          },
        })),

      // ---------------- operatori ----------------
      creaOperatore: (i) => {
        const id = nuovoId("op");
        const operatore: Operatore = {
          id,
          nome: i.nome.trim(),
          ruolo: i.ruolo ?? "collaboratore",
          tariffaOraria: i.tariffaOraria ?? null,
          telefono: i.telefono ?? null,
          attivo: true,
          note: i.note ?? null,
          creatoIl: new Date().toISOString(),
        };
        set((s) => ({ db: { ...s.db, operatori: [...s.db.operatori, operatore] } }));
        return id;
      },
      aggiornaOperatore: (id, patch) =>
        set((s) => ({ db: { ...s.db, operatori: s.db.operatori.map((o) => (o.id === id ? { ...o, ...patch } : o)) } })),
      eliminaOperatore: (id) =>
        set((s) => ({
          db: {
            ...s.db,
            operatori: s.db.operatori.filter((o) => o.id !== id),
            compensi: s.db.compensi.filter((c) => c.operatoreId !== id),
            lavori: s.db.lavori.map((l) => (l.operatoreId === id ? { ...l, operatoreId: null } : l)),
            ore: s.db.ore.map((o) => (o.operatoreId === id ? { ...o, operatoreId: null } : o)),
          },
        })),

      // ---------------- compensi ----------------
      pagaOperatore: (i) => {
        const compenso: CompensoOperatore = {
          id: nuovoId("co"),
          operatoreId: i.operatoreId,
          importo: arrotonda(i.importo),
          data: i.data ?? oggiISO(),
          periodo: i.periodo ?? (i.data ?? oggiISO()).slice(0, 7),
          metodo: i.metodo ?? null,
          note: i.note ?? null,
        };
        set((s) => ({ db: { ...s.db, compensi: [compenso, ...s.db.compensi] } }));
      },
      eliminaCompenso: (id) =>
        set((s) => ({ db: { ...s.db, compensi: s.db.compensi.filter((c) => c.id !== id) } })),

      // ---------------- lavori ----------------
      creaLavoro: (i) => {
        const lavoro: Lavoro = { ...i, id: nuovoId("lv"), stato: i.stato ?? "da_fare", creatoIl: new Date().toISOString() };
        set((s) => ({ db: { ...s.db, lavori: [...s.db.lavori, lavoro] } }));
      },
      aggiornaLavoro: (id, patch) =>
        set((s) => ({ db: { ...s.db, lavori: s.db.lavori.map((l) => (l.id === id ? { ...l, ...patch } : l)) } })),
      cambiaStatoLavoro: (id, stato) =>
        set((s) => ({ db: { ...s.db, lavori: s.db.lavori.map((l) => (l.id === id ? { ...l, stato } : l)) } })),
      eliminaLavoro: (id) =>
        set((s) => ({ db: { ...s.db, lavori: s.db.lavori.filter((l) => l.id !== id) } })),

      // ---------------- preventivi ----------------
      creaPreventivo: (i) => {
        const emissione = i.dataEmissione ?? oggiISO();
        const scadenza = i.dataScadenza ?? null;
        const lavoroId = i.lavoroId ?? null;
        const prevId = nuovoId("pr");
        let acconto: number | null = null;
        let saldo: number | null = null;
        if (i.tipo === "acconto_saldo") {
          acconto = i.importoAcconto ?? arrotonda(i.importoTotale / 2);
          saldo = arrotonda(i.importoTotale - acconto);
        }
        const preventivo: Preventivo = {
          id: prevId, clienteId: i.clienteId, lavoroId, tipo: i.tipo,
          importoTotale: i.importoTotale, importoAcconto: acconto, importoSaldo: saldo,
          dataEmissione: emissione, note: i.note ?? null,
        };
        const pagamenti: Pagamento[] =
          i.tipo === "acconto_saldo"
            ? [
                { id: nuovoId("pa"), clienteId: i.clienteId, lavoroId, preventivoId: prevId, origine: "acconto", importoAtteso: acconto!, importoIncassato: 0, stato: "in_attesa", dataEmissione: emissione, dataScadenza: scadenza, dataIncasso: null },
                { id: nuovoId("pa"), clienteId: i.clienteId, lavoroId, preventivoId: prevId, origine: "saldo", importoAtteso: saldo!, importoIncassato: 0, stato: "in_attesa", dataEmissione: emissione, dataScadenza: scadenza, dataIncasso: null },
              ]
            : [
                { id: nuovoId("pa"), clienteId: i.clienteId, lavoroId, preventivoId: prevId, origine: "preventivo", importoAtteso: i.importoTotale, importoIncassato: 0, stato: "in_attesa", dataEmissione: emissione, dataScadenza: scadenza, dataIncasso: null },
              ];
        set((s) => ({ db: { ...s.db, preventivi: [preventivo, ...s.db.preventivi], pagamenti: [...pagamenti, ...s.db.pagamenti] } }));
      },
      aggiornaPreventivo: (id, patch) =>
        set((s) => ({ db: { ...s.db, preventivi: s.db.preventivi.map((p) => (p.id === id ? { ...p, ...patch } : p)) } })),
      eliminaPreventivo: (id) =>
        set((s) => ({ db: { ...s.db, preventivi: s.db.preventivi.filter((p) => p.id !== id), pagamenti: s.db.pagamenti.filter((p) => p.preventivoId !== id) } })),

      // ---------------- ore ----------------
      registraOre: (i) => {
        const reg: RegistrazioneOre = { ...i, id: nuovoId("or") };
        set((s) => ({ db: { ...s.db, ore: [reg, ...s.db.ore] } }));
      },
      aggiornaOre: (id, patch) =>
        set((s) => ({ db: { ...s.db, ore: s.db.ore.map((o) => (o.id === id ? { ...o, ...patch } : o)) } })),
      eliminaOre: (id) =>
        set((s) => ({ db: { ...s.db, ore: s.db.ore.filter((o) => o.id !== id) } })),
      generaCompensoCliente: (clienteId, anno, mese) => {
        const db = get().db;
        const cliente = db.clienti.find((c) => c.id === clienteId);
        if (!cliente) return { ok: false, messaggio: "Cliente non trovato." };
        const tariffa = cliente.tariffaOraria ?? 0;
        if (tariffa <= 0) return { ok: false, messaggio: "Imposta prima una tariffa al cliente." };
        const inizio = new Date(anno, mese - 1, 1);
        const fine = new Date(anno, mese, 1);
        const oreTot = db.ore
          .filter((o) => { const d = new Date(o.data); return o.clienteId === clienteId && d >= inizio && d < fine; })
          .reduce((a, o) => a + o.ore, 0);
        if (oreTot <= 0) return { ok: false, messaggio: "Nessuna ora nel mese." };
        const importo = arrotonda(oreTot * tariffa);
        const scadenza = new Date(fine.getTime() + 30 * 86_400_000).toISOString().slice(0, 10);
        const pagamento: Pagamento = {
          id: nuovoId("pa"), clienteId, origine: "ore", importoAtteso: importo, importoIncassato: 0,
          stato: "in_attesa", dataEmissione: oggiISO(), dataScadenza: scadenza, dataIncasso: null,
          note: `Compenso a ore ${String(mese).padStart(2, "0")}/${anno}: ${oreTot} h × ${tariffa} €/h`,
        };
        set((s) => ({ db: { ...s.db, pagamenti: [pagamento, ...s.db.pagamenti] } }));
        return { ok: true, messaggio: `Incasso atteso generato: ${importo.toFixed(2)} €.` };
      },

      // ---------------- pagamenti ----------------
      creaPagamento: (i) => {
        const pagamento: Pagamento = {
          id: nuovoId("pa"), clienteId: i.clienteId, lavoroId: i.lavoroId ?? null, origine: "manuale", importoAtteso: i.importoAtteso,
          importoIncassato: 0, stato: "in_attesa", dataEmissione: i.dataEmissione ?? oggiISO(),
          dataScadenza: i.dataScadenza ?? null, dataIncasso: null, note: i.note ?? null,
        };
        set((s) => ({ db: { ...s.db, pagamenti: [pagamento, ...s.db.pagamenti] } }));
      },
      registraIncasso: (id, importo, dataIncasso) =>
        set((s) => ({
          db: {
            ...s.db,
            pagamenti: s.db.pagamenti.map((p) => {
              if (p.id !== id) return p;
              const quota = importo ?? p.importoAtteso - p.importoIncassato;
              const nuovoIncassato = arrotonda(p.importoIncassato + quota);
              const saldato = nuovoIncassato >= p.importoAtteso - 0.005;
              return { ...p, importoIncassato: nuovoIncassato, stato: saldato ? "pagato" : p.stato === "in_ritardo" ? "in_ritardo" : "in_attesa", dataIncasso: saldato ? (dataIncasso ?? oggiISO()) : p.dataIncasso };
            }),
          },
        })),
      aggiornaPagamento: (id, patch) =>
        set((s) => ({ db: { ...s.db, pagamenti: s.db.pagamenti.map((p) => (p.id === id ? ricalcolaPagamento({ ...p, ...patch }) : p)) } })),
      eliminaPagamento: (id) =>
        set((s) => ({ db: { ...s.db, pagamenti: s.db.pagamenti.filter((p) => p.id !== id) } })),

      // ---------------- spese ----------------
      creaSpesa: (i) => {
        const spesa: Spesa = { ...i, id: nuovoId("sp") };
        set((s) => ({ db: { ...s.db, spese: [spesa, ...s.db.spese] } }));
      },
      aggiornaSpesa: (id, patch) =>
        set((s) => ({ db: { ...s.db, spese: s.db.spese.map((sp) => (sp.id === id ? { ...sp, ...patch } : sp)) } })),
      eliminaSpesa: (id) =>
        set((s) => ({ db: { ...s.db, spese: s.db.spese.filter((sp) => sp.id !== id) } })),

      // ---------------- officina ----------------
      creaAttrezzo: (i) => {
        const attrezzo: Attrezzo = { ...i, id: nuovoId("at") };
        set((s) => ({ db: { ...s.db, attrezzi: [...s.db.attrezzi, attrezzo] } }));
      },
      aggiornaAttrezzo: (id, patch) =>
        set((s) => ({ db: { ...s.db, attrezzi: s.db.attrezzi.map((a) => (a.id === id ? { ...a, ...patch } : a)) } })),
      eliminaAttrezzo: (id) =>
        set((s) => ({ db: { ...s.db, attrezzi: s.db.attrezzi.filter((a) => a.id !== id) } })),

      // ---------------- generiche (pannello admin) ----------------
      patchRecord: (coll, id, patch) =>
        set((s) => ({ db: conColl(s.db, coll, arrDi(s.db, coll).map((x) => (x.id === id ? { ...x, ...patch } : x))) })),
      removeRecord: (coll, id) => {
        if (coll === "clienti") return get().eliminaCliente(id);
        if (coll === "operatori") return get().eliminaOperatore(id);
        set((s) => ({ db: conColl(s.db, coll, arrDi(s.db, coll).filter((x) => x.id !== id)) }));
      },
      addRecord: (coll, rec) => {
        const db = get().db;
        const id = nuovoId(coll.slice(0, 2));
        const now = new Date().toISOString();
        let record: Record<string, unknown>;
        if (coll === "clienti") {
          const nome = String(rec.nome ?? ""); const cognome = String(rec.cognome ?? "");
          record = { modalitaPredefinita: "preventivo", ...rec, id, nome, cognome, inizialiCodice: assegnaIniziali(nome, cognome, db.clienti), creatoIl: now };
        } else if (coll === "operatori") {
          record = { ruolo: "collaboratore", attivo: true, ...rec, id, creatoIl: now };
        } else if (coll === "lavori") {
          record = { stato: "da_fare", tipoCompenso: "preventivo", ...rec, id, creatoIl: now };
        } else if (coll === "spese") {
          record = { categoria: "altro", data: now.slice(0, 10), ...rec, id };
        } else if (coll === "attrezzi") {
          record = { stato: "ok", ...rec, id };
        } else {
          record = { ...rec, id };
        }
        set((s) => ({ db: conColl(s.db, coll, [record, ...arrDi(s.db, coll)]) }));
        return id;
      },
    }),
    {
      name: "albero-maestri",
      version: 2,
      migrate: (persisted, version) => {
        // dalla v1 (modello "Persona") si riparte dai nuovi dati d'esempio
        if (version < 2) return { db: datiIniziali(), autenticato: false };
        return persisted as { db: Database; autenticato: boolean };
      },
      partialize: (s) => ({ db: s.db, autenticato: s.autenticato }),
    },
  ),
);
