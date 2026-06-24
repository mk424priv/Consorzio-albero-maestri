import { ArrowLeft, Banknote, Clock, Copy, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IncassaFoglio } from "@/components/IncassaFoglio";
import { Badge, Button, Codice, Conferma, Stamp } from "@/components/ui";
import { codiceCliente } from "@/lib/codice-parlante";
import { cn } from "@/lib/cn";
import { notificaUndo } from "@/lib/undo";
import { etichetta } from "@/lib/dominio";
import { formatData, formatEuro, formatOre } from "@/lib/format";
import { calcoloLavoro } from "@/lib/lavoro-calc";
import { duplicaLavoro, eliminaLavoro, riprogramma, segnaSvolto } from "@/store/azioni";
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
  const [incassaOpen, setIncassaOpen] = useState(false);
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
    const a = await eliminaLavoro(lavoro.id);
    notificaUndo("Lavoro eliminato", a);
    navigate(-1);
  };

  return (
    <div className="flex flex-col gap-4 px-5 pt-5 pb-10">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{lavoro.titolo}</h1>
          {cliente ? (
            <button type="button" onClick={() => navigate(`/cliente/${cliente.id}`)} className="text-sm text-fumo underline-offset-2 hover:underline">{`${cliente.nome} ${cliente.cognome ?? ""}`.trim()}{cliente.deleted ? " · archiviato" : ""}</button>
          ) : (
            <p className="text-sm text-fumo">Senza cliente</p>
          )}
        </div>
        <button type="button" onClick={() => navigate(-1)} aria-label="Indietro" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-superficie text-fumo hover:text-bianco"><ArrowLeft size={18} /></button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {cliente && <Codice value={codiceCliente(dati, cliente.id)} />}
        <Stamp color={svolto ? "ottone" : "lichene"}>{etichetta(lavoro.fase)}</Stamp>
        <Badge stato="neutro">{etichetta(lavoro.modo)}</Badge>
        <span className="font-mono text-xs text-fumo-2">{formatData(lavoro.data)}</span>
        {lavoro.oraInizio && (
          <span className="flex items-center gap-1 font-mono text-xs text-fumo-2"><Clock className="h-3.5 w-3.5" /> {lavoro.oraInizio}{lavoro.oraFine ? `–${lavoro.oraFine}` : ""}</span>
        )}
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
            <button key={p.collaboratoreId} type="button" onClick={() => navigate(`/operaio/${p.collaboratoreId}`)} className="flex items-center justify-between rounded-vetro bg-superficie px-3.5 py-2.5 text-left text-sm transition-transform active:scale-[0.99]">
              <span className="font-medium">{p.nome}</span>
              <span className="font-mono text-xs text-fumo-2">{formatOre(p.ore)} · costo {formatEuro(p.costo)}</span>
            </button>
          ))}
        </section>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {svolto && calc.daIncassare > 0 && (
          <Button onClick={() => setIncassaOpen(true)}>
            <Banknote size={16} /> Incassa {formatEuro(calc.daIncassare)}
          </Button>
        )}
        <Button variant="inchiostro" onClick={() => navigate("/nuovo", { state: { lavoroId: lavoro.id } })}>
          <Pencil size={16} /> Modifica
        </Button>
        {svolto ? (
          <Button variant="inchiostro" onClick={async () => notificaUndo("Riprogrammato", await riprogramma(lavoro.id))}>Riprogramma</Button>
        ) : (
          <Button variant="inchiostro" onClick={async () => notificaUndo("Segnato svolto", await segnaSvolto(lavoro.id))}>Segna svolto</Button>
        )}
        <Button variant="tenue" onClick={async () => { const r = await duplicaLavoro(lavoro.id); if (r) { notificaUndo("Lavoro duplicato", r.annulla); navigate(`/lavoro/${r.id}`); } }}>
          <Copy size={16} /> Duplica
        </Button>
        <Button variant="critico" onClick={() => setPericolo(true)}>
          <Trash2 size={16} /> Elimina
        </Button>
      </div>

      {svolto && <IncassaFoglio open={incassaOpen} onOpenChange={setIncassaOpen} lavoroId={lavoro.id} daIncassare={calc.daIncassare} />}

      <Conferma
        open={pericolo}
        onOpenChange={setPericolo}
        titolo="Eliminare il lavoro?"
        testo="Si può annullare subito dopo, dal messaggio."
        etichettaConferma="Elimina lavoro"
        onConferma={() => void elimina()}
      />
    </div>
  );
}
