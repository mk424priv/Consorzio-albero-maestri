import { adessoISO } from "@/lib/format";
import type { CollezioneKey, Dati } from "@/lib/types";
import type { Repository } from "./repository";
import { db } from "./schema";

const COLLEZIONI: CollezioneKey[] = [
  "clienti",
  "operatori",
  "lavori",
  "ore",
  "pagamenti",
  "compensi",
  "spese",
];

export class DexieRepository implements Repository {
  async caricaTutto(): Promise<Dati> {
    const out: Dati = {
      clienti: [],
      operatori: [],
      lavori: [],
      ore: [],
      pagamenti: [],
      compensi: [],
      spese: [],
    };
    await Promise.all(
      COLLEZIONI.map(async (k) => {
        const all = (await db.table(k).toArray()) as Array<{ deleted?: boolean }>;
        (out as Record<CollezioneKey, unknown[]>)[k] = all.filter((r) => !r.deleted);
      }),
    );
    return out;
  }

  async upsert<K extends CollezioneKey>(collezione: K, record: Dati[K][number]): Promise<void> {
    await db.table(collezione).put(record);
  }

  async rimuovi(collezione: CollezioneKey, id: string): Promise<void> {
    const rec = await db.table(collezione).get(id);
    if (rec) await db.table(collezione).put({ ...rec, deleted: true, updatedAt: adessoISO() });
  }

  async sostituisciTutto(dati: Dati): Promise<void> {
    await db.transaction(
      "rw",
      COLLEZIONI.map((k) => db.table(k)),
      async () => {
        for (const k of COLLEZIONI) {
          await db.table(k).clear();
          await db.table(k).bulkPut(dati[k]);
        }
      },
    );
  }

  async svuota(): Promise<void> {
    await db.transaction(
      "rw",
      COLLEZIONI.map((k) => db.table(k)),
      async () => {
        for (const k of COLLEZIONI) await db.table(k).clear();
      },
    );
  }
}

export const repository: Repository = new DexieRepository();
