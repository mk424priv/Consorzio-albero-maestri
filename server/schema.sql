-- Schema backend «Albero Maestri» — Postgres (Neon/Vercel).
-- Principio: il server conserva i FATTI come blob JSONB (uno per record), i DERIVATI
-- (codice parlante, totali, stati) restano calcolati dal client (canone §2.1).
-- Una tabella per collezione: mirror esatto del modello Dexie → l'HttpRepository
-- parla la stessa forma `Dati` senza mappature campo-per-campo.
-- Idempotente: rieseguibile (IF NOT EXISTS).

create table if not exists clienti   (id text primary key, data jsonb not null, updated_at text, rev int not null default 0, deleted boolean not null default false);
create table if not exists operatori (id text primary key, data jsonb not null, updated_at text, rev int not null default 0, deleted boolean not null default false);
create table if not exists lavori    (id text primary key, data jsonb not null, updated_at text, rev int not null default 0, deleted boolean not null default false);
create table if not exists ore       (id text primary key, data jsonb not null, updated_at text, rev int not null default 0, deleted boolean not null default false);
create table if not exists pagamenti (id text primary key, data jsonb not null, updated_at text, rev int not null default 0, deleted boolean not null default false);
create table if not exists compensi  (id text primary key, data jsonb not null, updated_at text, rev int not null default 0, deleted boolean not null default false);
create table if not exists spese     (id text primary key, data jsonb not null, updated_at text, rev int not null default 0, deleted boolean not null default false);
create table if not exists attrezzi  (id text primary key, data jsonb not null, updated_at text, rev int not null default 0, deleted boolean not null default false);

-- Accesso cliente scoped (la "RLS" la applichiamo noi nelle query): indici su clienteId.
create index if not exists lavori_cliente_idx    on lavori    ((data->>'clienteId'));
create index if not exists pagamenti_cliente_idx on pagamenti ((data->>'clienteId'));
create index if not exists ore_cliente_idx       on ore       ((data->>'clienteId'));

-- Magic-link per cliente: nel link viaggia il token in chiaro; qui ne salviamo solo l'hash.
create table if not exists client_tokens (
  token_hash text primary key,
  cliente_id text not null,
  creato_il  timestamptz not null default now(),
  revocato   boolean not null default false
);
create index if not exists client_tokens_cliente_idx on client_tokens (cliente_id);

-- Pagamenti SEGNALATI dal cliente, in attesa di riconciliazione dell'operatore.
-- Il "pagato" del cliente è un segnale, non un fatto di cassa: l'operatore lo accetta.
create table if not exists segnalazioni_pagamento (
  id           text primary key,
  cliente_id   text not null,
  lavoro_id    text,
  segnalato_il timestamptz not null default now(),
  riconciliato boolean not null default false
);
create index if not exists segnalazioni_cliente_idx on segnalazioni_pagamento (cliente_id);
