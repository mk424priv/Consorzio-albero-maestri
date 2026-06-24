import Dexie, { type Table } from "dexie";
import type {
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
  }
}

export const db = new AlberoDB();
