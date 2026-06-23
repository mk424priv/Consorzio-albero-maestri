import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Intestazione } from "@/components/Intestazione";
import { Button } from "@/components/ui";

// Placeholder (Tappa 3). Dashboard reale (clienti/operai, filtri) in Tappa 9.
// Non e' nella navigazione inferiore: ci si arriva dal blocco riepilogo.
export function Dashboard() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-4">
      <Intestazione
        titolo="Dashboard"
        sottotitolo="fuori dalla navigazione"
        azione={
          <Button size="icona" variant="tenue" onClick={() => navigate(-1)} aria-label="Indietro">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        }
      />
      <p className="text-sm text-inchiostro-debole">
        Dati rilevanti separati per Clienti e per Operai, con filtri — in costruzione (Tappa 9).
      </p>
    </div>
  );
}
