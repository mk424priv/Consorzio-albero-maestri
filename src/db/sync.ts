// SyncEngine (canone 08 §P5): IndexedDB ⇄ Postgres via merge LWW. Local-first:
// le scritture non si bloccano mai sulla rete; il merge è deterministico (fondi).
import type { CollezioneKey, Dati } from "@/lib/types";
import { useStore } from "@/store/store";
import { getWorkspaceId, isSyncConfigured } from "./sync-config";
import { pullSince, pushRecords, type RigaRemota, subscribe } from "./supabase-adapter";

const CURSOR_KEY = "albero:sync-pulled";
const PUSHED_KEY = "albero:sync-pushed";
const EPOCH = "1970-01-01T00:00:00.000Z";
const COLLEZIONI: CollezioneKey[] = ["clienti", "operatori", "lavori", "ore", "pagamenti", "compensi", "spese", "attrezzi"];

let avviato = false;

function datiVuoti(): Dati {
  return { clienti: [], operatori: [], lavori: [], ore: [], pagamenti: [], compensi: [], spese: [], attrezzi: [] };
}

function righeDaPushare(dati: Dati, since: string): { righe: Omit<RigaRemota, "workspace_id">[]; maxUpdated: string } {
  const righe: Omit<RigaRemota, "workspace_id">[] = [];
  let maxUpdated = since;
  for (const k of COLLEZIONI) {
    for (const rec of dati[k] as Array<{ id: string; rev?: number; updatedAt?: string; deleted?: boolean }>) {
      const ua = rec.updatedAt ?? "";
      if (ua > since) {
        righe.push({ collection: k, id: rec.id, data: rec, rev: rec.rev ?? 0, updated_at: ua, deleted: Boolean(rec.deleted) });
        if (ua > maxUpdated) maxUpdated = ua;
      }
    }
  }
  return { righe, maxUpdated };
}

function datiDaRighe(righe: RigaRemota[]): Dati {
  const out = datiVuoti();
  for (const r of righe) {
    const arr = (out as unknown as Record<string, unknown[]>)[r.collection];
    if (arr) arr.push(r.data);
  }
  return out;
}

async function pull(): Promise<void> {
  const ws = getWorkspaceId();
  const cursor = localStorage.getItem(CURSOR_KEY) ?? EPOCH;
  const righe = await pullSince(ws, cursor);
  if (righe.length === 0) return;
  await useStore.getState().importaUnisci(datiDaRighe(righe)); // merge LWW nel locale
  localStorage.setItem(CURSOR_KEY, righe[righe.length - 1].updated_at);
}

async function push(): Promise<void> {
  const ws = getWorkspaceId();
  const since = localStorage.getItem(PUSHED_KEY) ?? EPOCH;
  const { righe, maxUpdated } = righeDaPushare(useStore.getState().dati, since);
  if (righe.length === 0) return;
  await pushRecords(ws, righe);
  localStorage.setItem(PUSHED_KEY, maxUpdated);
}

async function ciclo(): Promise<void> {
  try {
    await pull();
    await push();
  } catch (e) {
    console.warn("[sync] ciclo fallito (offline?)", e);
  }
}

/** Avvia il sync se configurato. Idempotente. Senza env è un no-op. */
export async function avviaSync(): Promise<void> {
  if (avviato || !isSyncConfigured()) return;
  avviato = true;
  await ciclo();
  try {
    await subscribe(getWorkspaceId(), () => void pull());
  } catch (e) {
    console.warn("[sync] realtime non disponibile", e);
  }
  // push debounced sulle modifiche locali
  let t: number | null = null;
  useStore.subscribe(() => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => void push(), 800);
  });
  // rete di sicurezza periodica
  window.setInterval(() => void ciclo(), 60_000);
}
