import type { CollezioneKey, Dati } from "@/lib/types";

/*
  La cucitura architetturale (canone 02 §1.4): la UI parla solo con lo store,
  lo store parla con questo contratto. Cambiare l'implementazione (Dexie -> sync
  -> HTTP) non tocca nessuno schermo.
*/
export interface Repository {
  caricaTutto(): Promise<Dati>;
  upsert<K extends CollezioneKey>(collezione: K, record: Dati[K][number]): Promise<void>;
  /** Soft-delete (tombstone), pronto per il sync. */
  rimuovi(collezione: CollezioneKey, id: string): Promise<void>;
  /** Hard-delete: rimozione definitiva (solo dal Cestino). */
  rimuoviDefinitivo(collezione: CollezioneKey, id: string): Promise<void>;
  /** Import: sostituisce tutto. */
  sostituisciTutto(dati: Dati): Promise<void>;
  svuota(): Promise<void>;
}
