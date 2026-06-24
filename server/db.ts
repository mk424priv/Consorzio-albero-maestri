import postgres from "postgres";

/*
  Client Postgres del backend (Neon/Vercel). Una sola connessione riusata tra le
  invocazioni "warm" della funzione serverless. `prepare: false` per il pooler
  (Neon/pgbouncer). Se DATABASE_URL non è configurato, db() torna null: gli endpoint
  rispondono in modo pulito invece di crashare (utile prima del provisioning del DB).
*/

let _sql: ReturnType<typeof postgres> | null = null;

export function db(): ReturnType<typeof postgres> | null {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  _sql = postgres(url, { prepare: false });
  return _sql;
}

export function hasDb(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
