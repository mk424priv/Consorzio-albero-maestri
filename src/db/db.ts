import Dexie, { type EntityTable } from "dexie";
import type { Integrazione, Progetto } from "@/lib/types";

// NEXUS è local-first: IndexedDB è la fonte di verità sul dispositivo.
// Database nuovo ("nexus"), separato da qualunque dato dell'app precedente.
export const db = new Dexie("nexus") as Dexie & {
  progetti: EntityTable<Progetto, "id">;
  integrazioni: EntityTable<Integrazione, "id">;
};

db.version(1).stores({
  progetti: "id, tipo, stato, updatedAt, deleted",
  integrazioni: "id, updatedAt, deleted",
});
