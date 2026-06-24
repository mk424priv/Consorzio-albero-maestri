import { ArrowLeft, ShieldAlert, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Badge, Button, Codice, Foglio, Stamp } from "@/components/ui";
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
      <span className="text-sm text-fumo">{label}</span>
      <span className={cn("font-mono tabular-nums", forte ? "text-base font-bold text-bianco" : "text-sm text-fumo")}>{valore}</span>
    </div>
  );
}

export function Cantiere() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const dati = useStore((s) => s.dati);
  const [pericolo, setPericolo] = useState(false);
  const lavoro = dati.lavori.find((l) => l.id === id);

  if (!lavoro) {
    return (
      <div className="px-5 pt-6">
        <button type="button" onClick={() => navigate(-1)} className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-superficie text-fumo"><ArrowLeft size={18} /></button>
        <p className="text-sm text-fumo-2">Lavoro non trovato.</p>
      </div>
    );
  }

  const calc = calcoloLavoro(dati, lavoro);
  const cliente = lavoro.clienteId ? dati.clienti.find((c) => c.id === lavoro.clienteId) : undefined;
  const svolto = lavoro.fase === "fatto";

  const elimina = async () => {
    await eliminaLavoro(lavoro.id);
    toast.success("Lavoro eliminato");
    navigate(-1);
  };

  return (
    <div className="flex flex-col gap-4 px-5 pt-5 pb-10">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{lavoro.titolo}</h1>
          <p className="text-sm text-fumo">{cliente ? `${cliente.nome} ${cliente.cognome ?? ""}`.trim() : "Senza cliente"}</p>
        </div>
        <button type="button" onClick={() => navigate(-1)} aria-label="Indietro" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-superficie text-fumo hover:text-bianco"><ArrowLeft size={18} /></button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {cliente && <Codice value={codiceCliente(dati, cliente.id)} />}
        <Stamp color={svolto ? "ottone" : "lichene"}>{etichetta(lavoro.fase)}</Stamp>
        <Badge stato="neutro">{etichetta(lavoro.modo)}</Badge>
        <span className="font-mono text-xs text-fumo-2">{formatData(lavoro.data)}</span>
      </div>

      {lavoro.periodo && <p className="font-mono text-xs text-fumo-2">Periodo: {formatData(lavoro.periodo.dal)} – {formatData(lavoro.periodo.al)}</p>}

      <div className="flex flex-col gap-2 rounded-vetro bg-superficie p-4">
        <Riga label="Lordo" valore={formatEuro(calc.lordo)} forte />
        <Riga label="Ore totali" valore={formatOre(calc.oreTotali)} />
        <Riga label="Costo collaboratori" valore={formatEuro(calc.costoCollaboratori)} />
        <Riga label="Spese" valore={formatEuro(calc.speseTotali)} />
        <div className="my-1 border-t border-bordo" />
        <Riga label="Netto" valore={formatEuro(calc.netto)} forte />
        {svolto && <Riga label="Incassato" valore={formatEuro(calc.incassato)} />}
        {svolto && <Riga label="Da incassare" valore={formatEuro(calc.daIncassare)} />}
      </div>

      {calc.partecipanti.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-mono text-[11px] uppercase tracking-label text-fumo-2">Operai</h2>
          {calc.partecipanti.map((p) => (
            <div key={p.collaboratoreId} className="flex items-center justify-between rounded-vetro bg-superficie px-3.5 py-2.5 text-sm">
              <span className="font-medium">{p.nome}</span>
              <span className="font-mono text-xs text-fumo-2">{formatOre(p.ore)} · costo {formatEuro(p.costo)}</span>
            </div>
          ))}
        </section>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {svolto ? (
          <Button variant="inchiostro" onClick={() => void riprogramma(lavoro.id)}>Riprogramma</Button>
        ) : (
          <Button onClick={() => void segnaSvolto(lavoro.id)}>Segna svolto</Button>
        )}
        <Button variant="critico" onClick={() => setPericolo(true)}>
          <Trash2 size={16} /> Elimina
        </Button>
      </div>

      <Foglio open={pericolo} onOpenChange={setPericolo} variante="pericolo" titolo="Eliminare il lavoro?">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rosso/10 text-rosso"><ShieldAlert size={30} /></div>
          <p className="leading-relaxed text-fumo">Azione irreversibile. Lo storico collegato resta nei conti.</p>
          <div className="flex w-full flex-col gap-2">
            <Button size="lg" variant="critico" className="bg-rosso text-white hover:bg-rosso/90" onClick={() => void elimina()}>Elimina lavoro</Button>
            <Button size="lg" variant="fantasma" onClick={() => setPericolo(false)}>Annulla</Button>
          </div>
        </div>
      </Foglio>
    </div>
  );
}
