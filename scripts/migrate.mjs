// Applica server/schema.sql al database puntato da DATABASE_URL. Idempotente.
// Uso:  DATABASE_URL=postgres://… npm run db:migrate
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("✗ DATABASE_URL mancante. Esempio: DATABASE_URL=postgres://… npm run db:migrate");
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(join(here, "..", "server", "schema.sql"), "utf8");
const sql = postgres(url, { prepare: false });

try {
  await sql.unsafe(schema);
  console.log("✓ migrazione applicata");
} catch (e) {
  console.error("✗ migrazione fallita:", e);
  process.exitCode = 1;
} finally {
  await sql.end();
}
