import { create } from "zustand";
import { db } from "@/db/db";
import { adesso, nuovoId } from "@/lib/id";
import type { Integrazione, Progetto } from "@/lib/types";

interface StatoNexus {
  pronto: boolean;
  progetti: Progetto[];
  integrazioni: Integrazione[];

  idrata: () => Promise<void>;

  creaProgetto: (
    dati: Omit<Progetto, "id" | "createdAt" | "updatedAt" | "deleted">,
  ) => Promise<Progetto>;
  aggiornaProgetto: (
    id: string,
    patch: Partial<Omit<Progetto, "id" | "createdAt">>,
  ) => Promise<void>;
  eliminaProgetto: (id: string) => Promise<void>;

  creaIntegrazione: (
    dati: Omit<Integrazione, "id" | "createdAt" | "updatedAt" | "deleted">,
  ) => Promise<Integrazione>;
  eliminaIntegrazione: (id: string) => Promise<void>;
}

const vivi = <T extends { deleted: 0 | 1 }>(righe: T[]) =>
  righe.filter((r) => !r.deleted);

export const useStore = create<StatoNexus>((set, get) => ({
  pronto: false,
  progetti: [],
  integrazioni: [],

  idrata: async () => {
    const [progetti, integrazioni] = await Promise.all([
      db.progetti.orderBy("updatedAt").reverse().toArray(),
      db.integrazioni.orderBy("updatedAt").reverse().toArray(),
    ]);
    set({ progetti: vivi(progetti), integrazioni: vivi(integrazioni), pronto: true });
  },

  creaProgetto: async (dati) => {
    const t = adesso();
    const progetto: Progetto = { ...dati, id: nuovoId(), createdAt: t, updatedAt: t, deleted: 0 };
    await db.progetti.add(progetto);
    set({ progetti: [progetto, ...get().progetti] });
    return progetto;
  },

  aggiornaProgetto: async (id, patch) => {
    const updatedAt = adesso();
    await db.progetti.update(id, { ...patch, updatedAt });
    set({
      progetti: get().progetti.map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt } : p,
      ),
    });
  },

  eliminaProgetto: async (id) => {
    // tombstone, non cancellazione fisica: pronto per un sync futuro
    await db.progetti.update(id, { deleted: 1, updatedAt: adesso() });
    set({ progetti: get().progetti.filter((p) => p.id !== id) });
  },

  creaIntegrazione: async (dati) => {
    const t = adesso();
    const integrazione: Integrazione = { ...dati, id: nuovoId(), createdAt: t, updatedAt: t, deleted: 0 };
    await db.integrazioni.add(integrazione);
    set({ integrazioni: [integrazione, ...get().integrazioni] });
    return integrazione;
  },

  eliminaIntegrazione: async (id) => {
    await db.integrazioni.update(id, { deleted: 1, updatedAt: adesso() });
    set({ integrazioni: get().integrazioni.filter((i) => i.id !== id) });
  },
}));
