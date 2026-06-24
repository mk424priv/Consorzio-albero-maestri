import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, hasDb } from "../server/db";

/** Sonda di salute del backend: verifica la connessione al Postgres. */
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  if (!hasDb()) {
    res.status(200).json({ ok: true, db: "non configurato (DATABASE_URL mancante)" });
    return;
  }
  try {
    const sql = db()!;
    await sql`select 1`;
    res.status(200).json({ ok: true, db: "connesso" });
  } catch (e) {
    res.status(500).json({ ok: false, db: "errore", errore: String(e) });
  }
}
