import { ArrowLeft, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Intestazione } from "@/components/Intestazione";
import { Badge, Button, Card, Codice, Stamp } from "@/components/ui";
import { codiceCliente } from "@/lib/codice-parlante";
import { cn } from "@/lib/cn";
import { etichetta } from "@/lib/dominio";
import { formatData, formatEuro, formatOre } from "@/lib/format";
import { calcoloLavoro } from "@/lib/lavoro-calc";
import { eliminaLavoro, riprogramma, segnaSvolto } from "@/store/azioni";
import { useStore } from "@/store/store";

function Riga({ label, valore, forte }: { label: string; valore: string; forte?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-inchiostro-chiaro/70">{label}</span>
      <span className={cn("font-mono tabular-nums", forte ? "text-base text-ottone-chiaro" : "text-sm text-inchiostro-chiaro")}>
        {valore}
      </span>
    </div>
  );
}

export function Cantiere() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const dati = useStore((s) => s.dati);
  const lavoro = dati.lavori.find((l) => l.id === id);

  if (!lavoro) {
    return (
      <div className="flex flex-col gap-3">
        <Intestazione titolo="Lavoro" />
        <p className="text-sm text-inchiostro-debole">Lavoro non trovato.</p>
      </div>
    );
  }

  const calc = calcoloLavoro(dati, lavoro);
  const cliente = lavoro.clienteId ? dati.clienti.find((c) => c.id === lavoro.clienteId) : undefined;
  const svolto = lavoro.fase === "fatto";

  const elimina = async () => {
    await eliminaLavoro(lavoro.id);
    navigate(-1);
  };

  return (
    <div className="flex flex-col gap-4">
      <Intestazione
        titolo={lavoro.titolo}
        sottotitolo={cliente ? `${cliente.nome} ${cliente.cognome ?? ""}`.trim() : "Senza cliente"}
        azione={
          <Button size="icona" variant="tenue" onClick={() => navigate(-1)} aria-label="Indietro">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {cliente && <Codice value={codiceCliente(dati, cliente.id)} />}
        <Stamp color={svolto ? "ottone" : "lichene"}>{etichetta(lavoro.fase)}</Stamp>
        <Badge stato="neutro">{etichetta(lavoro.modo)}</Badge>
        <span className="font-mono text-xs text-inchiostro-debole">{formatData(lavoro.data)}</span>
      </div>

      {lavoro.periodo && (
        <p className="font-mono text-xs text-inchiostro-debole">
          Periodo: {formatData(lavoro.periodo.dal)} – {formatData(lavoro.periodo.al)}
        </p>
      )}

      <Card tono="incasso" className="flex flex-col gap-2 p-4">
        <Riga label="Lordo" valore={formatEuro(calc.lordo)} forte />
        <Riga label="Ore totali" valore={formatOre(calc.oreTotali)} />
        <Riga label="Costo collaboratori" valore={formatEuro(calc.costoCollaboratori)} />
        <Riga label="Spese" valore={formatEuro(calc.speseTotali)} />
        <div className="my-1 border-t border-inchiostro-chiaro/20" />
        <Riga label="Netto" valore={formatEuro(calc.netto)} forte />
        {svolto && <Riga label="Incassato" valore={formatEuro(calc.incassato)} />}
        {svolto && <Riga label="Da incassare" valore={formatEuro(calc.daIncassare)} />}
      </Card>

      <section className="flex flex-col gap-1.5">
        <h2 className="font-mono text-xs uppercase tracking-wider text-inchiostro-debole">Operai</h2>
        {calc.partecipanti.map((p) => (
          <div key={p.collaboratoreId} className="flex items-center justify-between rounded-targhetta bg-carta-alta px-3 py-2 text-sm shadow-svolto">
            <span>{p.nome}</span>
            <span className="font-mono text-xs text-inchiostro-debole">
              {formatOre(p.ore)} · costo {formatEuro(p.costo)}
            </span>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap gap-2 pt-2">
        {svolto ? (
          <Button variant="fantasma" onClick={() => void riprogramma(lavoro.id)}>
            Riprogramma
          </Button>
        ) : (
          <Button variant="inchiostro" onClick={() => void segnaSvolto(lavoro.id)}>
            Segna svolto
          </Button>
        )}
        <Button variant="critico" onClick={() => void elimina()}>
          <Trash2 className="h-4 w-4" /> Elimina
        </Button>
      </div>
    </div>
  );
}
