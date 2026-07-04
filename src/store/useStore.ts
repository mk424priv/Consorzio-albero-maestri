import { create } from "zustand";
import { db } from "@/db/db";
import { adesso, nuovoId } from "@/lib/id";
import type { Bozza } from "@/lib/types";

interface StatoNexus {
  pronto: boolean;
  bozze: Bozza[];

  idrata: () => Promise<void>;

  creaBozza: (dati: Omit<Bozza, "id" | "createdAt" | "updatedAt" | "deleted">) => Promise<Bozza>;
  aggiornaBozza: (id: string, patch: Partial<Omit<Bozza, "id" | "createdAt">>) => Promise<void>;
  eliminaBozza: (id: string) => Promise<void>;
}

const vivi = <T extends { deleted: 0 | 1 }>(righe: T[]) =>
  righe.filter((r) => !r.deleted);

export const useStore = create<StatoNexus>((set, get) => ({
  pronto: false,
  bozze: [],

  idrata: async () => {
    const bozze = await db.bozze.orderBy("updatedAt").reverse().toArray();
    set({ bozze: vivi(bozze), pronto: true });
  },

  creaBozza: async (dati) => {
    const t = adesso();
    const bozza: Bozza = { ...dati, id: nuovoId(), createdAt: t, updatedAt: t, deleted: 0 };
    await db.bozze.add(bozza);
    set({ bozze: [bozza, ...get().bozze] });
    return bozza;
  },

  aggiornaBozza: async (id, patch) => {
    const updatedAt = adesso();
    await db.bozze.update(id, { ...patch, updatedAt });
    set({
      bozze: get().bozze.map((b) => (b.id === id ? { ...b, ...patch, updatedAt } : b)),
    });
  },

  eliminaBozza: async (id) => {
    // tombstone, non cancellazione fisica: pronto per un sync futuro
    await db.bozze.update(id, { deleted: 1, updatedAt: adesso() });
    set({ bozze: get().bozze.filter((b) => b.id !== id) });
  },
}));
