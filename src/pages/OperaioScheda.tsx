import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Intestazione } from "@/components/Intestazione";
import { Button } from "@/components/ui";
import { dovutoOperatore } from "@/lib/conti";
import { formatEuro } from "@/lib/format";
import { useStore } from "@/store/store";

// Placeholder (Tappa 3). Scheda operaio completa in Tappa 7.
export function OperaioScheda() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const dati = useStore((s) => s.dati);
  const operatore = dati.operatori.find((o) => o.id === id);

  if (!operatore) {
    return (
      <div className="flex flex-col gap-3">
        <Intestazione titolo="Operaio" />
        <p className="text-sm text-inchiostro-debole">Operaio non trovato.</p>
      </div>
    );
  }

  const dovuto = dovutoOperatore(dati, operatore.id);

  return (
    <div className="flex flex-col gap-4">
      <Intestazione
        titolo={operatore.nome}
        sottotitolo={operatore.ruolo === "titolare" ? "io (titolare)" : `${operatore.tariffaOraria ?? 0} €/h`}
        azione={
          <Button size="icona" variant="tenue" onClick={() => navigate(-1)} aria-label="Indietro">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        }
      />
      {operatore.ruolo !== "titolare" && (
        <p className="font-mono text-sm text-inchiostro-medio">
          Da pagare: <span className="text-critico">{formatEuro(dovuto.daPagare)}</span>
        </p>
      )}
      <p className="text-sm text-inchiostro-debole">Statistica minima + azioni — in costruzione (Tappa 7).</p>
    </div>
  );
}
