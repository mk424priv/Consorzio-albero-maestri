// Sincronizzazione cloud (opzionale) dell'intero stato — app + pannello.
// Strategia semplice e robusta: un'unica riga JSON per workspace, con
// realtime e "ultimo che scrive vince". Se il cloud non è configurato, è un
// no-op e l'app resta in locale.
import { create } from "zustand";
import { cloudAttivo, supabase, workspaceId } from "./supabase";
import { useStore } from "@/store/store";
import { useAdmin } from "@/store/admin";

export type StatoSync = "off" | "collego" | "ok" | "errore";
export const useSync = create<{ stato: StatoSync; set: (s: StatoSync) => void }>((set) => ({
  stato: "off",
  set: (stato) => set({ stato }),
}));

interface Snapshot {
  db: unknown;
  collezioni: unknown;
  config: unknown;
}

let applicando = false; // evita l'eco (remoto → locale → push)
let timer: ReturnType<typeof setTimeout> | null = null;

function snapshot(): Snapshot {
  return { db: useStore.getState().db, collezioni: useAdmin.getState().collezioni, config: useAdmin.getState().config };
}

function applica(snap: Snapshot) {
  applicando = true;
  if (snap.db) useStore.setState({ db: snap.db as never });
  useAdmin.setState({
    collezioni: (snap.collezioni as never) ?? useAdmin.getState().collezioni,
    config: (snap.config as never) ?? useAdmin.getState().config,
  });
  setTimeout(() => { applicando = false; }, 80);
}

async function push() {
  if (!supabase) return;
  try {
    useSync.getState().set("collego");
    const { error } = await supabase.from("workspace").upsert({ id: workspaceId, dati: snapshot(), updated_at: new Date().toISOString() });
    useSync.getState().set(error ? "errore" : "ok");
  } catch {
    useSync.getState().set("errore");
  }
}

function pushDebounced() {
  if (applicando) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(push, 800);
}

let avviato = false;
export async function avviaSync() {
  if (avviato) return;
  avviato = true;
  if (!cloudAttivo || !supabase) { useSync.getState().set("off"); return; }
  useSync.getState().set("collego");
  try {
    const { data, error } = await supabase.from("workspace").select("dati").eq("id", workspaceId).maybeSingle();
    if (error) throw error;
    if (data?.dati) applica(data.dati as Snapshot);
    else await push(); // prima volta: crea la riga con lo stato locale

    // remoto → locale
    supabase
      .channel("workspace-" + workspaceId)
      .on("postgres_changes", { event: "*", schema: "public", table: "workspace", filter: `id=eq.${workspaceId}` }, (payload) => {
        const dati = (payload.new as { dati?: Snapshot } | null)?.dati;
        if (dati) applica(dati);
      })
      .subscribe();

    // locale → remoto
    useStore.subscribe(pushDebounced);
    useAdmin.subscribe(pushDebounced);

    useSync.getState().set("ok");
  } catch {
    useSync.getState().set("errore");
  }
}
