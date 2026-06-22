# 🌳 Albero Maestri

Centro di Comando del lavoro per un'attività nel verde (potatura, abbattimento,
manutenzione giardini). Clienti, lavori, preventivi, ore, pagamenti, spese e
quadro economico — tutto in un posto solo, che vive nei dati.

- **Concezione**: [Presentazione-Concezione.md](Presentazione-Concezione.md)
- **Requisiti**: [PRD.md](PRD.md)
- **Deploy su Vercel**: [DEPLOY.md](DEPLOY.md)

## Cosa fa (Fase 1)

| Stanza | Funzione |
|---|---|
| 📊 Cruscotto | Incassato, speso, quanto resta, chi deve pagare |
| 📅 Calendario | Lavori per giorno, pianificazione della settimana |
| 🌱 Clienti | Anagrafica + **codice parlante** calcolato dai dati |
| 🧾 Preventivi | Cifra unica o acconto + saldo → pagamenti attesi |
| ⏱️ Ore | Ore giorno per giorno → compenso a fine mese |
| 💶 Pagamenti | Stati (in attesa / pagato / in ritardo), incassi |
| 🗓️ Storico | Mese per mese: atteso, incassato, uscite, saldo |
| 🔧 Officina | Attrezzi e loro valore |
| ⛽ Spese | Benzina, materiali e altre uscite |

Il **codice parlante** (es. `MR-03-14-01`) riassume ogni cliente: iniziali,
giorni medi per incassare, spesa media a lavoro (×50 €), anni insieme — sempre
ricalcolato dai dati reali.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS · Prisma ·
PostgreSQL. Mutazioni via Server Actions. Deploy nativo su Vercel.

## Avvio locale

Serve Node 20+ e Docker (per il Postgres di sviluppo).

```bash
npm install
docker compose up -d        # Postgres su localhost:5432
cp .env.example .env        # poi controlla i valori
npm run db:push             # crea le tabelle
npm run db:seed             # dati d'esempio
npm run dev                 # http://localhost:3000
```

Accesso: password dal valore `APP_PASSWORD` in `.env` (default `albero`).

> Senza Docker puoi usare un Postgres qualsiasi (es. Neon) impostando
> `DATABASE_URL` in `.env`. In alternativa, per una prova rapida, cambia
> `provider = "sqlite"` in `prisma/schema.prisma` e `DATABASE_URL="file:./dev.db"`.

## Script

| Comando | Azione |
|---|---|
| `npm run dev` | Server di sviluppo |
| `npm run build` | Genera client, sincronizza schema e build di produzione |
| `npm run db:push` | Crea/aggiorna le tabelle dallo schema |
| `npm run db:seed` | Inserisce dati d'esempio |
| `npm run db:studio` | Apre Prisma Studio |

## Struttura

```
prisma/schema.prisma     modello dati
prisma/seed.ts           dati d'esempio
src/lib/                 db, dominio, codice-parlante, conti (motore), format
src/actions/             mutazioni (Server Actions)
src/app/(app)/           le stanze (pagine protette)
src/app/login            accesso
src/proxy.ts             protezione delle rotte
```
