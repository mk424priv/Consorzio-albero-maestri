# Deploy su Vercel

L'applicazione è pronta per Vercel. Servono due cose: un **database Postgres**
e due **variabili d'ambiente**. Bastano pochi minuti.

## 1. Importa il progetto

1. Vai su [vercel.com/new](https://vercel.com/new) e accedi con GitHub.
2. Importa il repository `Consorzio-albero-maestri`.
3. Vercel rileva Next.js da solo. **Non avviare ancora il deploy**: prima il database.

## 2. Crea il database Postgres

Dal progetto su Vercel → scheda **Storage** → **Create Database** → **Postgres**
(è un Neon gestito da Vercel, con un piano gratuito).
Collegandolo al progetto, Vercel imposta da solo le variabili `POSTGRES_*` e
`DATABASE_URL`.

In alternativa puoi usare un Postgres esterno (es. [Neon](https://neon.tech))
e incollare tu la sua connection string come `DATABASE_URL`.

## 3. Variabili d'ambiente

Nel progetto Vercel → **Settings → Environment Variables**:

| Nome | Valore |
|---|---|
| `DATABASE_URL` | la connection string del Postgres (con `?sslmode=require`) |
| `APP_PASSWORD` | la password con cui entrerai nell'app |

> Se hai creato il Postgres dalla scheda Storage, `DATABASE_URL` c'è già:
> aggiungi solo `APP_PASSWORD`.

## 4. Deploy

Avvia il deploy. Il comando di build è già configurato in `package.json`:

```
prisma generate && prisma db push --skip-generate && next build
```

`prisma db push` crea automaticamente le tabelle nel database al primo deploy
(e le aggiorna ai successivi). Al termine l'app è online sull'URL di Vercel.

## 5. Primo accesso e dati

- Apri l'URL → inserisci `APP_PASSWORD`.
- Il database parte **vuoto**. Per inserire i dati d'esempio una volta, da locale
  con `DATABASE_URL` puntato al Postgres di produzione:

  ```bash
  npm run db:seed
  ```

  (oppure inizia subito a creare i tuoi clienti reali dall'app).

## Aggiornamenti

Ogni `git push` sul branch principale fa ripartire build e deploy in automatico.
Le modifiche allo schema dati vengono applicate dal `prisma db push` in build.

---

### Nota
La creazione dell'account Postgres e il collegamento GitHub ↔ Vercel richiedono
il tuo login: sono operazioni che fai tu una volta sola. Tutto il resto
(schema, tabelle, build) è già automatizzato nel codice.
