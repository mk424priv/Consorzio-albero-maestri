// Export/import su singolo file JSON = backup e trasferimento. (canone 02 §1.3)
import { adessoISO } from "./format";
import { DATI_VUOTI, type CollezioneKey, type Dati } from "./types";

interface FileBackup {
  app: "albero-maestri";
  versione: number;
  esportatoIl: string;
  dati: Dati;
}

export function esportaJSON(dati: Dati): string {
  const file: FileBackup = { app: "albero-maestri", versione: 1, esportatoIl: adessoISO(), dati };
  return JSON.stringify(file, null, 2);
}

const CHIAVI: CollezioneKey[] = Object.keys(DATI_VUOTI) as CollezioneKey[];

export function importaJSON(testo: string): Dati {
  const obj: unknown = JSON.parse(testo);
  const sorgente =
    obj && typeof obj === "object" && "dati" in obj
      ? (obj as { dati: unknown }).dati
      : obj;
  if (!sorgente || typeof sorgente !== "object") {
    throw new Error("File di backup non valido.");
  }
  const src = sorgente as Record<string, unknown>;
  const out: Dati = {
    clienti: [],
    operatori: [],
    lavori: [],
    ore: [],
    pagamenti: [],
    compensi: [],
    spese: [],
    attrezzi: [],
  };
  for (const k of CHIAVI) {
    const arr = src[k];
    if (Array.isArray(arr)) (out as Record<CollezioneKey, unknown[]>)[k] = arr;
  }
  return out;
}

/**
 * Merge LWW di due snapshot (multi-dispositivo, canone 08 §2.4): per ogni id vince
 * la versione con (rev desc, updatedAt desc). Tombstone inclusi → un'eliminazione più
 * recente cancella, un record più recente resuscita. Deterministico e idempotente.
 */
export function fondi(locale: Dati, importato: Dati): Dati {
  const out: Dati = {
    clienti: [],
    operatori: [],
    lavori: [],
    ore: [],
    pagamenti: [],
    compensi: [],
    spese: [],
    attrezzi: [],
  };
  for (const k of CHIAVI) {
    const map = new Map<string, { rev: number; ua: string; rec: unknown }>();
    const consider = (rec: { id: string; rev?: number; updatedAt?: string }) => {
      const prev = map.get(rec.id);
      const rev = rec.rev ?? 0;
      const ua = rec.updatedAt ?? "";
      if (!prev || rev > prev.rev || (rev === prev.rev && ua > prev.ua)) {
        map.set(rec.id, { rev, ua, rec });
      }
    };
    for (const r of locale[k] as Array<{ id: string; rev?: number; updatedAt?: string }>) consider(r);
    for (const r of importato[k] as Array<{ id: string; rev?: number; updatedAt?: string }>) consider(r);
    (out as Record<CollezioneKey, unknown[]>)[k] = [...map.values()].map((v) => v.rec);
  }
  return out;
}
