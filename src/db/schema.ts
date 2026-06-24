import Dexie, { type Table } from "dexie";
import type {
  Appuntamento,
  Attrezzo,
  Cliente,
  CompensoOperatore,
  Lavoro,
  Operatore,
  Pagamento,
  RegistrazioneOre,
  Spesa,
} from "@/lib/types";

/** IndexedDB locale (local-first). Unica fonte di verita' dei fatti. */
export class AlberoDB extends Dexie {
  clienti!: Table<Cliente, string>;
  operatori!: Table<Operatore, string>;
  lavori!: Table<Lavoro, string>;
  ore!: Table<RegistrazioneOre, string>;
  pagamenti!: Table<Pagamento, string>;
  compensi!: Table<CompensoOperatore, string>;
  spese!: Table<Spesa, string>;
  attrezzi!: Table<Attrezzo, string>;
  appuntamenti!: Table<Appuntamento, string>;

  constructor() {
    super("albero-maestri");
    this.version(1).stores({
      clienti: "id, inizialiCodice, updatedAt",
      operatori: "id, ruolo, updatedAt",
      lavori: "id, clienteId, data, fase, updatedAt",
      ore: "id, lavoroId, operatoreId, clienteId, data",
      pagamenti: "id, clienteId, lavoroId, dataIncasso, updatedAt",
      compensi: "id, operatoreId, data, updatedAt",
      spese: "id, lavoroId, clienteId, data",
    });
    this.version(2).stores({
      attrezzi: "id, categoria, updatedAt",
    });
    // v3: indici updatedAt su ore/spese per il delta-sync (canone 08 §P5).
    this.version(3).stores({
      ore: "id, lavoroId, operatoreId, clienteId, data, updatedAt",
      spese: "id, lavoroId, clienteId, data, updatedAt",
    });
    // v4: tabella appuntamenti e promemoria.
    this.version(4).stores({
      appuntamenti: "id, clienteId, data, tipo, updatedAt",
    });
  }
}

export const db = new AlberoDB();
