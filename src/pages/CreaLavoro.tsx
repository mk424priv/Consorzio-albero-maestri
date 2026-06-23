import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Intestazione } from "@/components/Intestazione";
import { Button } from "@/components/ui";

// Placeholder (Tappa 3). Il cuore — creazione lavoro (svolto/programmato,
// 4 modi, cliente, spese, collaborazione) — arriva in Tappa 5.
export function CreaLavoro() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-4">
      <Intestazione
        titolo="Nuovo record"
        azione={
          <Button size="icona" variant="tenue" onClick={() => navigate(-1)} aria-label="Chiudi">
            <X className="h-5 w-5" />
          </Button>
        }
      />
      <p className="text-sm text-inchiostro-debole">
        Scelta carattere (svolto / programmato), 4 modi di calcolo, cliente e collaborazione —
        in costruzione (Tappa 5).
      </p>
    </div>
  );
}
