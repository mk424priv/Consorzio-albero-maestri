// Client Supabase opzionale. Se le variabili d'ambiente non sono impostate,
// l'app continua a funzionare in locale (solo localStorage), senza errori.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// id dello "spazio di lavoro" condiviso: tutti i dispositivi con lo stesso id
// vedono gli stessi dati.
export const workspaceId = (import.meta.env.VITE_WORKSPACE_ID as string | undefined)?.trim() || "albero";

export const cloudAttivo: boolean = !!(url && key);
export const supabase: SupabaseClient | null = cloudAttivo ? createClient(url!, key!, {
  auth: { persistSession: false },
  realtime: { params: { eventsPerSecond: 2 } },
}) : null;
