import { create } from "zustand";
import { repository } from "@/db/dexie-repository";
import { fondi } from "@/lib/backup";
import { adessoISO } from "@/lib/format";
import { creaSeed } from "@/data/seed";
import { DATI_VUOTI, type CollezioneKey, type Dati } from "@/lib/types";

interface StoreState {
  dati: Dati;
  pronto: boolean;
  carica: () => Promise<void>;
  /** Crea o aggiorna un record (stampa updatedAt, persiste, aggiorna lo snapshot). */
  salva: <K extends CollezioneKey>(collezione: K, record: Dati[K][number]) => Promise<void>;
  /** Soft-delete. */
  elimina: (collezione: CollezioneKey, id: string) => Promise<void>;
  importa: (dati: Dati) => Promise<void>;
  /** Import «Unisci»: merge LWW con i dati locali (multi-dispositivo). */
  importaUnisci: (dati: Dati) => Promise<void>;
  /** Hard-delete definitivo (dal Cestino). */
  rimuoviDefinitivo: (collezione: CollezioneKey, id: string) => Promise<void>;
  reset: () => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  dati: DATI_VUOTI,
  pronto: false,

  async carica() {
    let dati = await repository.caricaTutto();
    const vuoto = dati.operatori.length === 0 && dati.clienti.length === 0 && dati.lavori.length === 0;
    if (vuoto) {
      dati = creaSeed();
      await repository.sostituisciTutto(dati);
    }
    set({ dati, pronto: true });
  },

  async salva(collezione, record) {
    const id = (record as { id: string }).id;
    const corrente = (get().dati[collezione] as Array<{ id: string; rev?: number }>).find((r) => r.id === id);
    const rev = (corrente?.rev ?? 0) + 1;
    const stamped = { ...record, updatedAt: adessoISO(), rev } as Dati[typeof collezione][number] & { id: string };
    await repository.upsert(collezione, stamped);
    set((s) => {
      const arr = (s.dati[collezione] as Array<{ id: string }>).filter((r) => r.id !== stamped.id);
      arr.push(stamped);
      return { dati: { ...s.dati, [collezione]: arr } };
    });
  },

  async elimina(collezione, id) {
    await repository.rimuovi(collezione, id);
    set((s) => ({
      dati: {
        ...s.dati,
        [collezione]: (s.dati[collezione] as Array<{ id: string }>).filter((r) => r.id !== id),
      },
    }));
  },

  async importa(dati) {
    await repository.sostituisciTutto(dati);
    set({ dati });
  },

  async importaUnisci(dati) {
    const merged = fondi(get().dati, dati);
    await repository.sostituisciTutto(merged);
    set({ dati: merged });
  },

  async rimuoviDefinitivo(collezione, id) {
    await repository.rimuoviDefinitivo(collezione, id);
    set((s) => ({
      dati: {
        ...s.dati,
        [collezione]: (s.dati[collezione] as Array<{ id: string }>).filter((r) => r.id !== id),
      },
    }));
  },

  async reset() {
    await repository.svuota();
    const dati = creaSeed();
    await repository.sostituisciTutto(dati);
    set({ dati });
  },
}));
