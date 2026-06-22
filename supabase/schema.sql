-- Albero Maestri — sincronizzazione cloud (Supabase)
-- Esegui questo script una volta nell'SQL Editor del tuo progetto Supabase.

-- Un'unica riga per "spazio di lavoro": contiene tutto lo stato in JSON.
create table if not exists public.workspace (
  id          text primary key,
  dati        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.workspace enable row level security;

-- DEMO (single-tenant): accesso con la chiave pubblica "anon".
-- Per la produzione multi-utente, sostituire con policy basate su auth.
drop policy if exists "workspace anon" on public.workspace;
create policy "workspace anon"
  on public.workspace for all
  to anon
  using (true)
  with check (true);

-- Realtime: notifica i cambiamenti agli altri dispositivi.
alter publication supabase_realtime add table public.workspace;
