// Store centrale dell'app (Zustand + persistenza in localStorage).
// Sostituisce le "Server Actions" + database del progetto originale:
// qui i dati vivono nel browser, ma la logica di dominio è la stessa.
//
// Per collegare un vero backend in futuro basta sostituire l'implementazione
// di queste azioni con chiamate HTTP — l'interfaccia resta identica.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Attrezzo,
  Cliente,
  Database,
  Lavoro,
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

interface Stato {
  db: Database;
  autenticato: boolean;

  // auth
  login: (password: string) => boolean;
  logout: () => void;

  // dati
  reseed: () => void;
  svuota: () => void;

  // clienti
  creaCliente: (input: {
    nome: string;
    cognome: string;
    telefono?: string | null;
    email?: string | null;
    luogo?: string | null;
    tariffaOraria?: number | null;
    modalitaPredefinita?: Cliente["modalitaPredefinita"];
    note?: string | null;
  }) => string;
  aggiornaCliente: (id: string, patch: Parziale<Cliente>) => void;
  eliminaCliente: (id: string) => void;

  // lavori
  creaLavoro: (input: Omit<Lavoro, "id" | "creatoIl" | "stato"> & { stato?: Lavoro["stato"] }) => void;
  aggiornaLavoro: (id: string, patch: Parziale<Lavoro>) => void;
  cambiaStatoLavoro: (id: string, stato: Lavoro["stato"]) => void;
  eliminaLavoro: (id: string) => void;

  // preventivi (genera i pagamenti attesi)
  creaPreventivo: (input: {
    clienteId: string;
    lavoroId?: string | null;
    tipo: Preventivo["tipo"];
    importoTotale: number;
    importoAcconto?: number | null;
    dataEmissione?: string;
    dataScadenza?: string | null;
    note?: string | null;
  }) => void;
  aggiornaPreventivo: (id: string, patch: Parziale<Preventivo>) => void;
  eliminaPreventivo: (id: string) => void;

  // ore
  registraOre: (input: Omit<RegistrazioneOre, "id">) => void;
  aggiornaOre: (id: string, patch: Parziale<RegistrazioneOre>) => void;
  eliminaOre: (id: string) => void;
  generaCompensoMese: (clienteId: string, anno: number, mese: number) => { ok: boolean; messaggio: string };

  // pagamenti
  creaPagamento: (input: { clienteId: string; importoAtteso: number; dataEmissione?: string; dataScadenza?: string | null; note?: string | null }) => void;
  registraIncasso: (id: string, importo?: number, dataIncasso?: string) => void;
  aggiornaPagamento: (id: string, patch: Parziale<Pagamento>) => void;
  eliminaPagamento: (id: string) => void;

  // spese
  creaSpesa: (input: Omit<Spesa, "id">) => void;
  aggiornaSpesa: (id: string, patch: Parziale<Spesa>) => void;
  eliminaSpesa: (id: string) => void;

  // officina
  creaAttrezzo: (input: Omit<Attrezzo, "id">) => void;
  aggiornaAttrezzo: (id: string, patch: Parziale<Attrezzo>) => void;
  eliminaAttrezzo: (id: string) => void;
}

// ricalcola stato + dataIncasso di un pagamento in base agli importi
function ricalcolaPagamento(p: Pagamento): Pagamento {
  const saldato = p.importoIncassato >= p.importoAtteso - 0.005 && p.importoAtteso > 0;
  const inRitardo = !saldato && !!p.dataScadenza && new Date(p.dataScadenza) < new Date();
  return {
    ...p,
    stato: saldato ? "pagato" : inRitardo ? "in_ritardo" : "in_attesa",
    dataIncasso: saldato ? (p.dataIncasso ?? oggiISO()) : null,
  };
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
        set({
          db: {
            clienti: [],
            persone: get().db.persone,
            lavori: [],
            preventivi: [],
            ore: [],
            pagamenti: [],
            spese: [],
            attrezzi: [],
          },
        }),

      // ---------------- clienti ----------------
      creaCliente: (input) => {
        const db = get().db;
        const id = nuovoId("cl");
        const cliente: Cliente = {
          id,
          nome: input.nome.trim(),
          cognome: input.cognome.trim(),
          inizialiCodice: assegnaIniziali(input.nome, input.cognome, db.clienti),
          telefono: input.telefono ?? null,
          email: input.email ?? null,
          luogo: input.luogo ?? null,
          tariffaOraria: input.tariffaOraria ?? null,
          modalitaPredefinita: input.modalitaPredefinita ?? "preventivo",
          note: input.note ?? null,
          creatoIl: new Date().toISOString(),
        };
        set({ db: { ...db, clienti: [...db.clienti, cliente] } });
        return id;
      },
      aggiornaCliente: (id, patch) =>
        set((s) => ({
          db: {
            ...s.db,
            clienti: s.db.clienti.map((c) => (c.id === id ? { ...c, ...patch } : c)),
          },
        })),
      eliminaCliente: (id) =>
        set((s) => ({
          db: {
            ...s.db,
            clienti: s.db.clienti.filter((c) => c.id !== id),
            lavori: s.db.lavori.filter((l) => l.clienteId !== id),
            preventivi: s.db.preventivi.filter((p) => p.clienteId !== id),
            ore: s.db.ore.filter((o) => o.clienteId !== id),
            pagamenti: s.db.pagamenti.filter((p) => p.clienteId !== id),
            spese: s.db.spese.map((sp) =>
              sp.clienteId === id ? { ...sp, clienteId: null } : sp,
            ),
          },
        })),

      // ---------------- lavori ----------------
      creaLavoro: (input) => {
        const lavoro: Lavoro = {
          ...input,
          id: nuovoId("lv"),
          stato: input.stato ?? "da_fare",
          creatoIl: new Date().toISOString(),
        };
        set((s) => ({ db: { ...s.db, lavori: [...s.db.lavori, lavoro] } }));
      },
      aggiornaLavoro: (id, patch) =>
        set((s) => ({
          db: { ...s.db, lavori: s.db.lavori.map((l) => (l.id === id ? { ...l, ...patch } : l)) },
        })),
      cambiaStatoLavoro: (id, stato) =>
        set((s) => ({
          db: { ...s.db, lavori: s.db.lavori.map((l) => (l.id === id ? { ...l, stato } : l)) },
        })),
      eliminaLavoro: (id) =>
        set((s) => ({ db: { ...s.db, lavori: s.db.lavori.filter((l) => l.id !== id) } })),

      // ---------------- preventivi ----------------
      creaPreventivo: (input) => {
        const emissione = input.dataEmissione ?? oggiISO();
        const scadenza = input.dataScadenza ?? null;
        const lavoroId = input.lavoroId ?? null;
        const prevId = nuovoId("pr");

        let importoAcconto: number | null = null;
        let importoSaldo: number | null = null;
        if (input.tipo === "acconto_saldo") {
          importoAcconto = input.importoAcconto ?? arrotonda(input.importoTotale / 2);
          importoSaldo = arrotonda(input.importoTotale - importoAcconto);
        }

        const preventivo: Preventivo = {
          id: prevId,
          clienteId: input.clienteId,
          lavoroId,
          tipo: input.tipo,
          importoTotale: input.importoTotale,
          importoAcconto,
          importoSaldo,
          dataEmissione: emissione,
          note: input.note ?? null,
        };

        const nuoviPagamenti: Pagamento[] =
          input.tipo === "acconto_saldo"
            ? [
                { id: nuovoId("pa"), clienteId: input.clienteId, lavoroId, preventivoId: prevId, origine: "acconto", importoAtteso: importoAcconto!, importoIncassato: 0, stato: "in_attesa", dataEmissione: emissione, dataScadenza: scadenza, dataIncasso: null },
                { id: nuovoId("pa"), clienteId: input.clienteId, lavoroId, preventivoId: prevId, origine: "saldo", importoAtteso: importoSaldo!, importoIncassato: 0, stato: "in_attesa", dataEmissione: emissione, dataScadenza: scadenza, dataIncasso: null },
              ]
            : [
                { id: nuovoId("pa"), clienteId: input.clienteId, lavoroId, preventivoId: prevId, origine: "preventivo", importoAtteso: input.importoTotale, importoIncassato: 0, stato: "in_attesa", dataEmissione: emissione, dataScadenza: scadenza, dataIncasso: null },
              ];

        set((s) => ({
          db: {
            ...s.db,
            preventivi: [preventivo, ...s.db.preventivi],
            pagamenti: [...nuoviPagamenti, ...s.db.pagamenti],
          },
        }));
      },
      aggiornaPreventivo: (id, patch) =>
        set((s) => ({
          db: { ...s.db, preventivi: s.db.preventivi.map((p) => (p.id === id ? { ...p, ...patch } : p)) },
        })),
      eliminaPreventivo: (id) =>
        set((s) => ({
          db: {
            ...s.db,
            preventivi: s.db.preventivi.filter((p) => p.id !== id),
            pagamenti: s.db.pagamenti.filter((p) => p.preventivoId !== id),
          },
        })),

      // ---------------- ore ----------------
      registraOre: (input) => {
        const reg: RegistrazioneOre = { ...input, id: nuovoId("or") };
        set((s) => ({ db: { ...s.db, ore: [reg, ...s.db.ore] } }));
      },
      aggiornaOre: (id, patch) =>
        set((s) => ({
          db: { ...s.db, ore: s.db.ore.map((o) => (o.id === id ? { ...o, ...patch } : o)) },
        })),
      eliminaOre: (id) =>
        set((s) => ({ db: { ...s.db, ore: s.db.ore.filter((o) => o.id !== id) } })),
      generaCompensoMese: (clienteId, anno, mese) => {
        const db = get().db;
        const cliente = db.clienti.find((c) => c.id === clienteId);
        if (!cliente) return { ok: false, messaggio: "Cliente non trovato." };
        const tariffa = cliente.tariffaOraria ?? 0;
        if (tariffa <= 0) return { ok: false, messaggio: "Imposta prima una tariffa oraria." };

        const inizio = new Date(anno, mese - 1, 1);
        const fine = new Date(anno, mese, 1);
        const oreTot = db.ore
          .filter((o) => {
            const d = new Date(o.data);
            return o.clienteId === clienteId && d >= inizio && d < fine;
          })
          .reduce((a, o) => a + o.ore, 0);
        if (oreTot <= 0) return { ok: false, messaggio: "Nessuna ora nel mese." };

        const importo = arrotonda(oreTot * tariffa);
        const scadenza = new Date(fine.getTime() + 30 * 86_400_000).toISOString().slice(0, 10);
        const pagamento: Pagamento = {
          id: nuovoId("pa"),
          clienteId,
          origine: "ore",
          importoAtteso: importo,
          importoIncassato: 0,
          stato: "in_attesa",
          dataEmissione: oggiISO(),
          dataScadenza: scadenza,
          dataIncasso: null,
          note: `Compenso a ore ${String(mese).padStart(2, "0")}/${anno}: ${oreTot} h × ${tariffa} €/h`,
        };
        set((s) => ({ db: { ...s.db, pagamenti: [pagamento, ...s.db.pagamenti] } }));
        return { ok: true, messaggio: `Compenso generato: ${importo.toFixed(2)} €.` };
      },

      // ---------------- pagamenti ----------------
      creaPagamento: (input) => {
        const pagamento: Pagamento = {
          id: nuovoId("pa"),
          clienteId: input.clienteId,
          origine: "manuale",
          importoAtteso: input.importoAtteso,
          importoIncassato: 0,
          stato: "in_attesa",
          dataEmissione: input.dataEmissione ?? oggiISO(),
          dataScadenza: input.dataScadenza ?? null,
          dataIncasso: null,
          note: input.note ?? null,
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
              return {
                ...p,
                importoIncassato: nuovoIncassato,
                stato: saldato ? "pagato" : p.stato === "in_ritardo" ? "in_ritardo" : "in_attesa",
                dataIncasso: saldato ? (dataIncasso ?? oggiISO()) : p.dataIncasso,
              };
            }),
          },
        })),
      aggiornaPagamento: (id, patch) =>
        set((s) => ({
          db: {
            ...s.db,
            pagamenti: s.db.pagamenti.map((p) =>
              p.id === id ? ricalcolaPagamento({ ...p, ...patch }) : p,
            ),
          },
        })),
      eliminaPagamento: (id) =>
        set((s) => ({ db: { ...s.db, pagamenti: s.db.pagamenti.filter((p) => p.id !== id) } })),

      // ---------------- spese ----------------
      creaSpesa: (input) => {
        const spesa: Spesa = { ...input, id: nuovoId("sp") };
        set((s) => ({ db: { ...s.db, spese: [spesa, ...s.db.spese] } }));
      },
      aggiornaSpesa: (id, patch) =>
        set((s) => ({
          db: { ...s.db, spese: s.db.spese.map((sp) => (sp.id === id ? { ...sp, ...patch } : sp)) },
        })),
      eliminaSpesa: (id) =>
        set((s) => ({ db: { ...s.db, spese: s.db.spese.filter((sp) => sp.id !== id) } })),

      // ---------------- officina ----------------
      creaAttrezzo: (input) => {
        const attrezzo: Attrezzo = { ...input, id: nuovoId("at") };
        set((s) => ({ db: { ...s.db, attrezzi: [...s.db.attrezzi, attrezzo] } }));
      },
      aggiornaAttrezzo: (id, patch) =>
        set((s) => ({
          db: { ...s.db, attrezzi: s.db.attrezzi.map((a) => (a.id === id ? { ...a, ...patch } : a)) },
        })),
      eliminaAttrezzo: (id) =>
        set((s) => ({ db: { ...s.db, attrezzi: s.db.attrezzi.filter((a) => a.id !== id) } })),
    }),
    {
      name: "albero-maestri",
      version: 1,
      partialize: (s) => ({ db: s.db, autenticato: s.autenticato }),
    },
  ),
);
