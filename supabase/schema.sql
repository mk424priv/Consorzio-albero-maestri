-- Albero Maestri · backend di sincronizzazione (canone 08 §P5)
-- Esegui questo SQL nel tuo progetto Supabase (SQL editor), poi imposta nel build:
--   VITE_SUPABASE_URL       = https://<project>.supabase.co
--   VITE_SUPABASE_ANON_KEY  = <anon key>
-- L'app resta local-first: senza queste env il sync è disattivato.

-- Tabella unica (payload jsonb): schema stabile, additivo, mirror del modello locale.
create table if not exists public.albero_records (
  workspace_id text        not null,   -- "codice di sincronizzazione" (segreto, generato sul device)
  collection   text        not null,   -- clienti | operatori | lavori | ore | pagamenti | compensi | spese | attrezzi
  id           text        not null,   -- ULID del record
  data         jsonb       not null,   -- il record completo
  rev          int         not null default 0,   -- versione logica (merge LWW)
  updated_at   timestamptz not null,
  deleted      boolean     not null default false,
  primary key (workspace_id, collection, id)
);

create index if not exists albero_records_ws_updated
  on public.albero_records (workspace_id, updated_at);

alter table public.albero_records enable row level security;

-- Modello v1 (single-user): il workspace_id è un segreto condiviso tra i propri dispositivi;
-- chi lo conosce accede alle proprie righe. Il client filtra SEMPRE per workspace_id.
-- ⚠ Per un multi-tenant reale sostituire questa policy con una basata su auth/JWT claim.
drop policy if exists "anon rw" on public.albero_records;
create policy "anon rw" on public.albero_records
  for all to anon using (true) with check (true);

-- Realtime: pull live quando un altro dispositivo scrive.
alter publication supabase_realtime add table public.albero_records;
