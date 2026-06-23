/*
  Tappa 0 — guscio di scaffold. Prova che token, font e build funzionano.
  Verra' sostituito dalla shell di navigazione in Tappa 3.
*/
export function App() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-inchiostro-tenue">
        canone · nuovo prodotto
      </p>

      <h1 className="font-display text-5xl font-semibold text-inchiostro">
        Albero Maestri
      </h1>

      <p className="max-w-sm font-sans text-inchiostro-soft">
        Il taccuino del maestro. Scaffold pronto — token, font e PWA attivi.
        Si costruisce per tappe secondo il canone.
      </p>

      <div className="font-mono text-3xl font-medium tabular-nums text-ottone">
        € 1.240,00
      </div>

      <div className="flex flex-wrap justify-center gap-2 font-mono text-xs">
        <span className="rounded-full bg-positivo/15 px-3 py-1 text-positivo">
          pagato
        </span>
        <span className="rounded-full bg-attenzione/15 px-3 py-1 text-attenzione">
          da incassare
        </span>
        <span className="rounded-full bg-critico/15 px-3 py-1 text-critico">
          scaduto
        </span>
      </div>
    </main>
  );
}
