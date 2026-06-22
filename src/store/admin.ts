// Store del pannello amministrativo (collezioni generiche + config), persistito.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nuovoId } from "@/lib/id";
import type { Item, Valore } from "@/lib/admin-moduli";
import { seedCollezioni, seedConfig } from "@/data/admin-seed";

interface StatoAdmin {
  collezioni: Record<string, Item[]>;
  config: Record<string, Valore>;
  upsert: (coll: string, item: Item) => string;
  rimuovi: (coll: string, id: string) => void;
  setConfig: (patch: Record<string, Valore>) => void;
  reseedAdmin: () => void;
}

export const useAdmin = create<StatoAdmin>()(
  persist(
    (set) => ({
      collezioni: seedCollezioni(),
      config: seedConfig(),
      upsert: (coll, item) => {
        const id = item.id || nuovoId("a");
        set((s) => {
          const lista = s.collezioni[coll] ?? [];
          const esiste = lista.some((x) => x.id === id);
          const nuovo = esiste ? lista.map((x) => (x.id === id ? { ...item, id } : x)) : [{ ...item, id }, ...lista];
          return { collezioni: { ...s.collezioni, [coll]: nuovo } };
        });
        return id;
      },
      rimuovi: (coll, id) =>
        set((s) => ({ collezioni: { ...s.collezioni, [coll]: (s.collezioni[coll] ?? []).filter((x) => x.id !== id) } })),
      setConfig: (patch) => set((s) => ({ config: { ...s.config, ...patch } })),
      reseedAdmin: () => set({ collezioni: seedCollezioni(), config: seedConfig() }),
    }),
    { name: "albero-admin", version: 1 },
  ),
);
