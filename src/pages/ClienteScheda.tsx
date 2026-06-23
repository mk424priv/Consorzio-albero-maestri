import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Intestazione } from "@/components/Intestazione";
import { Button, Codice } from "@/components/ui";
import { codiceCliente } from "@/lib/codice-parlante";
import { useStore } from "@/store/store";

// Placeholder (Tappa 3). Scheda-dossier completa in Tappa 6.
export function ClienteScheda() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const dati = useStore((s) => s.dati);
  const cliente = dati.clienti.find((c) => c.id === id);

  if (!cliente) {
    return (
      <div className="flex flex-col gap-3">
        <Intestazione titolo="Cliente" />
        <p className="text-sm text-inchiostro-debole">Cliente non trovato.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Intestazione
        titolo={`${cliente.nome} ${cliente.cognome ?? ""}`.trim()}
        azione={
          <Button size="icona" variant="tenue" onClick={() => navigate(-1)} aria-label="Indietro">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        }
      />
      <Codice value={codiceCliente(dati, cliente.id)} grande />
      <p className="text-sm text-inchiostro-debole">Dossier con calendario e stati separati — in costruzione (Tappa 6).</p>
    </div>
  );
}
