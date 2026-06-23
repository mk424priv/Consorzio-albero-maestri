import { useNavigate } from "react-router-dom";
import { Intestazione } from "@/components/Intestazione";
import { riepilogoSoldi } from "@/lib/conti";
import { chiaveMese, formatEuro, oggiISO } from "@/lib/format";
import { useStore } from "@/store/store";

function Dash({ label, valore }: { label: string; valore: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-carta bg-carta-incasso p-3 text-inchiostro-chiaro shadow-cassa">
      <span className="font-mono text-[0.6rem] uppercase tracking-wider text-inchiostro-chiaro/70">{label}</span>
      <span className="font-mono text-sm font-medium tabular-nums text-ottone-chiaro">{formatEuro(valore)}</span>
    </div>
  );
}

// Placeholder (Tappa 3). Il centro Soldi completo arriva in Tappa 8.
export function Soldi() {
  const dati = useStore((s) => s.dati);
  const navigate = useNavigate();
  const r = riepilogoSoldi(dati, chiaveMese(oggiISO()));

  return (
    <div className="flex flex-col gap-4">
      <Intestazione titolo="Soldi" sottotitolo="questo mese" />
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        className="grid grid-cols-3 gap-2 text-left transition-transform active:scale-[0.99]"
        aria-label="Apri la Dashboard"
      >
        <Dash label="Guadagnato" valore={r.guadagnatoMese} />
        <Dash label="Incassato" valore={r.incassatoMese} />
        <Dash label="Da incassare" valore={r.daIncassare} />
      </button>
      <p className="text-sm text-inchiostro-debole">
        Due modi (da incassare / da pagare) e Incassa subito — in costruzione (Tappa 8).
        Tocca il blocco per la Dashboard.
      </p>
    </div>
  );
}
