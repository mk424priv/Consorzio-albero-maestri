// Configurazione sync opt-in (canone 08 §P5). Senza env → app local-only identica.
import { nuovoId } from "@/lib/id";

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const WS_KEY = "albero:workspace";

/** Il backend è configurato? (altrimenti il sync è disattivato e l'app è local-only) */
export function isSyncConfigured(): boolean {
  return Boolean(URL && KEY);
}

export function supabaseEnv(): { url: string; key: string } {
  return { url: URL ?? "", key: KEY ?? "" };
}

/** Codice di sincronizzazione = identità del workspace (segreto, niente password). */
export function getWorkspaceId(): string {
  let ws = localStorage.getItem(WS_KEY);
  if (!ws) {
    ws = nuovoId();
    localStorage.setItem(WS_KEY, ws);
  }
  return ws;
}

/** Collega un altro dispositivo: ne adotta il codice. */
export function setWorkspaceId(id: string): void {
  const v = id.trim();
  if (v) localStorage.setItem(WS_KEY, v);
}
