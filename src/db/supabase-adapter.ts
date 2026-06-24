// Adapter remoto Supabase. SDK caricato in modo lazy (chunk separato): se il sync
// non è configurato non viene mai importato. (canone 08 §P5)
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./sync-config";

const TABLE = "albero_records";
let clientPromise: Promise<SupabaseClient> | null = null;

async function client(): Promise<SupabaseClient> {
  if (!clientPromise) {
    const { url, key } = supabaseEnv();
    clientPromise = import("@supabase/supabase-js").then((m) =>
      m.createClient(url, key, { auth: { persistSession: false } }),
    );
  }
  return clientPromise;
}

export interface RigaRemota {
  workspace_id: string;
  collection: string;
  id: string;
  data: unknown; // il record completo
  rev: number;
  updated_at: string;
  deleted: boolean;
}

export async function pushRecords(workspaceId: string, righe: Omit<RigaRemota, "workspace_id">[]): Promise<void> {
  if (righe.length === 0) return;
  const c = await client();
  const payload = righe.map((r) => ({ ...r, workspace_id: workspaceId }));
  const { error } = await c.from(TABLE).upsert(payload, { onConflict: "workspace_id,collection,id" });
  if (error) throw error;
}

export async function pullSince(workspaceId: string, cursor: string): Promise<RigaRemota[]> {
  const c = await client();
  const { data, error } = await c
    .from(TABLE)
    .select("*")
    .eq("workspace_id", workspaceId)
    .gt("updated_at", cursor)
    .order("updated_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as RigaRemota[];
}

export async function subscribe(workspaceId: string, onChange: () => void): Promise<() => void> {
  const c = await client();
  const channel = c
    .channel(`albero-${workspaceId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: TABLE, filter: `workspace_id=eq.${workspaceId}` }, () => onChange())
    .subscribe();
  return () => { void c.removeChannel(channel); };
}
