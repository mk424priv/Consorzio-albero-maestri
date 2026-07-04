import Dexie, { type EntityTable } from "dexie";
import type { Bozza } from "@/lib/types";

// NEXUS è local-first: IndexedDB è la fonte di verità sul dispositivo.
export const db = new Dexie("nexus") as Dexie & {
  bozze: EntityTable<Bozza, "id">;
};

// v1 storica (progetti/integrazioni, versione "centro di controllo").
db.version(1).stores({
  progetti: "id, tipo, stato, updatedAt, deleted",
  integrazioni: "id, updatedAt, deleted",
});

// v2: l'app si riduce al configuratore di bozze 3D.
db.version(2).stores({
  progetti: null,
  integrazioni: null,
  bozze: "id, updatedAt, deleted",
});
