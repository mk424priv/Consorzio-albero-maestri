# Sincronizzazione tra dispositivi (Supabase)

L'app funziona **da sola in locale** (i dati vivono nel browser). Attivando
Supabase, tutto lo stato — dati dell'app **e** del pannello — si sincronizza in
**tempo reale** tra tutti i dispositivi che usano lo stesso *workspace*.

## Come si attiva (5 minuti)

1. **Crea un progetto** su [supabase.com](https://supabase.com) (piano gratuito).
2. **SQL Editor** → incolla ed esegui [`supabase/schema.sql`](../supabase/schema.sql).
   Crea la tabella `workspace` + policy + realtime.
3. **Project Settings → API**: copia *Project URL* e *anon public key*.
4. Imposta le variabili d'ambiente:
   - in locale: copia `.env.example` in `.env` e compila i valori;
   - su **Vercel**: *Settings → Environment Variables* → aggiungi
     `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_WORKSPACE_ID`,
     poi *Redeploy*.
5. Apri l'app: in alto comparirà l'icona ☁️ (sincronizzato).

## Come funziona

- Lo stato completo (`db` dell'app + collezioni/config del pannello) è salvato
  in un'unica riga JSON della tabella `workspace`, identificata da
  `VITE_WORKSPACE_ID`.
- Ad ogni modifica locale viene inviato l'aggiornamento (con debounce);
  Supabase **Realtime** notifica gli altri dispositivi che ricaricano i dati.
- Strategia: *ultimo che scrive vince* (adatta a un piccolo team).
- Senza variabili d'ambiente: nessuna chiamata di rete, solo `localStorage`.

## Note

- La `anon key` è pubblica per definizione: in questa configurazione demo la
  tabella è accessibile con essa (single-tenant). Per più clienti/aziende
  separate, introdurre l'autenticazione Supabase e policy RLS per utente.
- Per "ripartire da zero" sul cloud: svuota la riga in `workspace` o cambia
  `VITE_WORKSPACE_ID`.
