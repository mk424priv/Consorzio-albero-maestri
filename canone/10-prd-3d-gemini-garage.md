# 10 — PRD: visualizzatore 3D del Garage con riconoscimento attrezzo (Gemini)

> Stato: **proposta operativa** · Branch: `canone/nuovo-prodotto`
> Dipende da: `02` (specifica), `08` (design canonico). Tocca: `src/pages/Garage.tsx`,
> `src/components/garage/`, `src/lib/`, `src/store/`, `src/lib/types.ts`.

## 1. Obiettivo

Quando creo/salvo un attrezzo nel **Garage**, l'app deve:

1. capire **che attrezzo è** dal nome (e caratteristiche) che ho scritto;
2. scegliere la **modella 3D reale** corrispondente (motosega, tagliaerba, martello,
   veicolo, …) da un catalogo locale;
3. **mostrarla in un visualizzatore 3D che la fa ruotare**, al posto del cubo
   stilizzato per-categoria attuale.

Il riconoscimento usa **Google Gemini** (stessa integrazione del progetto
`logistic-nexmile`), con un **fallback locale deterministico** che funziona
offline e senza chiave.

## 2. Principi (coerenti con AGENTS.md)

- **Derived-not-stored, con cache.** Il modello 3D si *deriva* dal nome. Per non
  ridurre tutto a una chiamata di rete a ogni render, la chiave del modello
  (`modelKey`) viene **risolta una volta al salvataggio** e salvata sul record
  come cache. Resta un dato derivato (ricostruibile), non un fatto-evento.
- **Local-first prima di tutto.** Senza rete e senza chiave Gemini, il **matcher
  locale** risolve comunque il modello. Gemini è un *potenziamento opzionale*,
  mai un requisito.
- **Cucitura repository invariata.** Nessun nuovo schermo, nessun cambio al
  contratto `Repository`. Si aggiunge solo un campo opzionale.
- **Stile dai token.** Il visualizzatore mantiene illuminazione/estetica
  "Quaderno di bottega" già usata in `Oggetto3D` (OGL).

## 3. Architettura a strati — risoluzione del modello

```
nome + caratteristiche + categoria
        │
        ▼
1) MATCHER LOCALE  (src/lib/modelli-3d.ts)         ← sincrono, offline, gratis
   dizionario IT→modelKey, ristretto alla categoria
        │  match sicuro? ──► modelKey ─────────────┐
        │  incerto/assente                          │
        ▼                                           │
2) GEMINI (opzionale)  (src/lib/gemini-classifica) │  ← solo se: chiave presente
   classifica → modelKey ∈ catalogo (structured)   │     + online + matcher incerto
        │  ok? ──► modelKey ────────────────────────┤
        │  errore/offline/no-key                     │
        ▼                                           │
3) FALLBACK per-categoria (cubo/cilindro attuale)  ◄┘
        │
        ▼
   modelKey salvato sul record (cache)  ──►  Modello3D carica public/modelli/<key>.glb e lo ruota
```

Punto chiave: **Gemini viene interpellato al massimo una volta per attrezzo**
(al salvataggio, e solo se il matcher locale non è sicuro). A regime la maggior
parte degli attrezzi è risolta dal dizionario, a costo zero.

## 4. Accessi e token

### 4.1 Gemini — origine (da `logistic-nexmile`)
- SDK: **`@google/genai`** (stesso pacchetto, già validato in produzione).
- Modello: **`gemini-flash-latest`** (veloce/economico, adatto a classificazione;
  in `logistic-nexmile` è il modello "utility").
- Output strutturato: `responseMimeType: "application/json"` + `responseSchema`.
- In `logistic-nexmile` la chiave (`GEMINI_API_KEY`) è **solo server-side** (route
  `/api/gemini-*`), **mai** spedita al browser — per non esporre la credenziale.

### 4.2 Vincolo di questo progetto
`Consorzio-albero-maestri` è **Vite puro, local-first, senza backend**. Una
variabile `VITE_*` viene **inlinata nel bundle**: una chiave client è quindi
**visibile a chiunque** nel deploy pubblico. → **Non riusare la chiave di
`logistic-nexmile`** (è legata alla fatturazione). Vedi §8 per le opzioni; la
decisione è dell'utente.

### 4.3 Poly Pizza — modelli 3D (NESSUNA chiave necessaria)
Verificato: le pagine modello espongono il GLB diretto e la licenza.
- ricerca: `https://poly.pizza/search/<query>` → ID modello `/m/<id>`
- pagina: `https://poly.pizza/m/<id>` → `https://static.poly.pizza/<uuid>.glb`,
  più `"Title"`, `"Licence"` (es. `CC0 1.0`), autore.
- pipeline: **si scaricano solo i GLB con licenza `CC0`** (zero obblighi di
  attribuzione; l'attribuzione viene comunque registrata in `ATTRIBUZIONI.md`).
- backup CC0: Quaternius / Kenney (pacchetti CC0) se un attrezzo manca.

## 5. Modello dati

`src/lib/types.ts` — interfaccia `Attrezzo`, **un solo campo nuovo, opzionale**:

```ts
export interface Attrezzo {
  // … campi esistenti …
  /** Chiave del modello 3D risolta (cache derived-not-stored). Es. "chainsaw". */
  modelKey?: string;
}
```

- **Nessun cambio allo schema Dexie** (`attrezzi` indicizza `id, categoria,
  updatedAt`; `modelKey` non è indicizzato → nessuna migrazione).
- Compatibile con sync/tombstone esistenti (`updatedAt`, `rev`, `deleted`).
- Override manuale futuro: lo stesso campo può essere impostato a mano se la
  classificazione sbaglia (fatto-scelta dell'utente, lecito da salvare).

## 6. Catalogo modelli (`modelKey` → file)

~30 voci, raggruppate per categoria. (Lista iniziale; si estende facilmente.)

| Categoria | modelKey | Attrezzo |
|---|---|---|
| auto | `car`, `van`, `pickup`, `truck`, `tractor`, `scooter`, `motorbike` | veicoli |
| motore | `chainsaw`, `mower`, `brushcutter`, `hedgetrimmer`, `generator`, `pressurewasher`, `leafblower`, `tiller` | attrezzi a motore |
| elettrico | `drill`, `grinder`, `circularsaw`, `jigsaw`, `sander`, `welder` | elettrici |
| manuale | `hammer`, `handsaw`, `axe`, `shovel`, `rake`, `wrench`, `screwdriver`, `pliers`, `wheelbarrow`, `ladder`, `shears` | manuali |

Più un `default` per categoria (geometria procedurale attuale) quando nessun
modello combacia. Mapping termini→key (esempi IT): `motosega→chainsaw`,
`tagliaerba|rasaerba|decespugliatore→mower|brushcutter`, `martello→hammer`,
`sega→handsaw`, `trapano→drill`, `smerigliatrice|flessibile→grinder`,
`carriola→wheelbarrow`, `scala→ladder`, `furgone→van`, `trattore→tractor`.

Output di fase 2: `public/modelli/<key>.glb` + `src/lib/catalogo-modelli.ts`
(`Record<modelKey, { file, label, autore, licenza }>`) + `ATTRIBUZIONI.md`.

## 7. Rendering

- Nuovo componente **`Modello3D`** (accanto a `Oggetto3D`) basato su **OGL
  `GLTFLoader`** (già presente in `node_modules/ogl`, nessuna nuova dipendenza
  pesante): carica il `.glb`, lo **centra e scala** in un box unitario, applica
  illuminazione coerente, **rotazione automatica** (rispetta
  `prefers-reduced-motion`).
- `Garage.tsx`: l'anteprima usa `Modello3D` quando l'attrezzo ha un `modelKey`
  con file disponibile; altrimenti `Oggetto3D` (fallback per-categoria).
- I `.glb` in `public/modelli/` vengono **precache** dal service worker
  (vite-plugin-pwa) → disponibili offline.

## 8. Sicurezza della chiave Gemini — DECISIONE UTENTE

| Opzione | Come | Pro | Contro |
|---|---|---|---|
| **A. Chiave free-tier nel client** | nuova chiave **dedicata** (free tier) in `VITE_GEMINI_API_KEY` | semplice, spedisce subito; l'abuso brucia solo quota gratuita | chiave visibile nel bundle pubblico |
| **B. Proxy Supabase Edge Function** | la Edge Function tiene `GEMINI_API_KEY` server-side; il client la chiama | chiave **non** esposta (come `logistic-nexmile`) | richiede Supabase configurato + deploy funzione |
| **C. Solo matcher locale** | niente Gemini nel deploy; Gemini solo in dev locale | zero chiavi, zero costi, 100% offline | classificazione meno "intelligente" sui nomi insoliti |

In **tutti** i casi il matcher locale resta il baseline, quindi la feature
funziona anche con Gemini spento. Raccomandazione: **A con chiave dedicata
free-tier** per spedire ora, **B** come hardening successivo. **Mai** la chiave
di `logistic-nexmile` nel client.

## 9. Fasi

0. **PRD** (questo documento).
1. **Scaffolding & accessi** — `npm i @google/genai`; `VITE_GEMINI_API_KEY`
   opzionale in `.env`/`.env.example`; cartelle `public/modelli/`, file lib.
2. **Catalogo CC0** — script Node: ricerca→filtro CC0→download GLB→
   `catalogo-modelli.ts`+`ATTRIBUZIONI.md`.
3. **Matcher locale** — `src/lib/modelli-3d.ts` + test vitest.
4. **Classificatore Gemini** — `src/lib/gemini-classifica.ts`, structured output
   vincolato alle key del catalogo, gated + fallback.
5. **Data model** — `modelKey` su `Attrezzo`; `salvaAttrezzo()` risolve e salva.
6. **Renderer** — `Modello3D` (OGL GLTFLoader) + integrazione in `Garage.tsx`.
7. **Build/test/commit/push** — `npm run build` + `npm test` verdi; commit
   Conventional, push branch + ff `main` (trigger redeploy).

## 10. Criteri di accettazione

- Salvo un attrezzo "Motosega Stihl" → compare e ruota un **modello di motosega**.
- Salvo "Carriola" → modello di carriola. "Furgone" → un veicolo.
- **Offline / senza chiave**: il matcher risolve comunque il modello (nessun
  errore, nessun crash); nome ignoto → fallback per-categoria.
- Gemini interpellato **al più una volta per attrezzo**, mai a ogni render.
- `npm run build` e `npm test` verdi. Bundle: solo GLB CC0, attribuzioni tracciate.
- Nessun cambio di schema/contratto Repository; nessuna chiave di `logistic-nexmile`
  nel client.
