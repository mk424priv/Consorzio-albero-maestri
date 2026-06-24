import { ArrowLeft, Banknote, CalendarClock, Leaf, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Avatar, Button, Field, Foglio, Segmented, StatTile } from "@/components/ui";
import { libroOperatore } from "@/lib/conti";
import type { MetodoPagamento } from "@/lib/dominio";
import { etichetta } from "@/lib/dominio";
import { chiaveMese, formatData, formatEuro, formatMese, formatOre } from "@/lib/format";
import { calcoloLavoro } from "@/lib/lavoro-calc";
import { pagaOperaio } from "@/store/azioni";
import { useStore } from "@/store/store";

export function OperaioScheda() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const dati = useStore((s) => s.dati);
  const [pagaOpen, setPagaOpen] = useState(false);

  const operatore = dati.operatori.find((o) => o.id === id);
  if (!operatore) {
    return (
      <div className="px-5 pt-6">
        <button type="button" onClick={() => navigate(-1)} className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-superficie text-fumo"><ArrowLeft size={18} /></button>
        <p className="text-sm text-fumo-2">Operaio non trovato.</p>
      </div>
    );
  }

  const io = operatore.ruolo === "titolare";
  const libro = libroOperatore(dati, operatore.id);

  const perMese = new Map<string, typeof libro.lavori>();
  for (const l of libro.lavori) {
    const k = chiaveMese(l.data);
    perMese.set(k, [...(perMese.get(k) ?? []), l]);
  }
  const oreDi = (lavoroId: string) =>
    dati.ore.filter((o) => o.lavoroId === lavoroId && o.operatoreId === operatore.id && !o.deleted).reduce((a, o) => a + o.ore, 0);
  const costoDi = (lavoroId: string) => {
    const l = dati.lavori.find((x) => x.id === lavoroId);
    return l ? (calcoloLavoro(dati, l).partecipanti.find((p) => p.collaboratoreId === operatore.id)?.costo ?? 0) : 0;
  };

  return (
    <div className="flex flex-col pb-10">
      <header className="flex flex-col items-center gap-3 px-5 pt-5 text-center">
        <div className="flex w-full items-center">
          <button type="button" onClick={() => navigate(-1)} aria-label="Indietro" className="flex h-9 w-9 items-center justify-center rounded-full bg-superficie text-fumo hover:text-bianco"><ArrowLeft size={18} /></button>
        </div>
        <Avatar iniziali={operatore.nome.slice(0, 2).toUpperCase()} tono={io ? "verde" : "blu"} size={72} />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{operatore.nome}</h1>
          <p className="text-sm text-fumo">{etichetta(operatore.ruolo)} · {io ? "io" : `${operatore.tariffaOraria ?? 0} €/h`}</p>
        </div>
      </header>

      <div className="flex flex-col gap-5 px-5 pt-6">
        {io ? (
          <div className="flex items-center justify-between rounded-vetro bg-superficie p-4">
            <span className="flex items-center gap-2 text-sm font-medium"><Leaf size={16} className="text-verde" /> Il mio tempo · non è un costo</span>
            <span className="font-bold tracking-tight text-verde">{formatOre(libro.ore)}</span>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <StatTile etichetta="Ore">{formatOre(libro.ore)}</StatTile>
            <StatTile etichetta="Pagato" tono="verde">{formatEuro(libro.pagato)}</StatTile>
            <StatTile etichetta="Da pagare" tono={libro.saldo > 0 ? "rosso" : "neutro"}>{formatEuro(libro.saldo)}</StatTile>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button className="h-auto flex-col items-start gap-0.5 py-3" onClick={() => navigate("/nuovo", { state: { operatoreId: operatore.id, fase: "fatto" } })}>
            <span className="flex items-center gap-1"><Plus size={16} /> Aggiungi lavoro</span>
            <span className="font-mono text-[10px] opacity-70">svolto · oggi</span>
          </Button>
          <Button variant="inchiostro" className="h-auto flex-col items-start gap-0.5 py-3" onClick={() => navigate("/nuovo", { state: { operatoreId: operatore.id, fase: "da_fare" } })}>
            <span className="flex items-center gap-1"><CalendarClock size={16} /> Pianifica</span>
            <span className="font-mono text-[10px] opacity-70">programmato</span>
          </Button>
        </div>

        {!io && libro.saldo > 0 && (
          <Button variant="inchiostro" onClick={() => setPagaOpen(true)}>
            <Banknote size={16} /> Paga {operatore.nome}
          </Button>
        )}

        <section className="flex flex-col gap-2.5">
          <h2 className="font-mono text-[11px] uppercase tracking-label text-fumo-2">Storico</h2>
          {libro.lavori.length === 0 ? (
            <p className="py-4 text-center text-sm text-fumo-2">Ancora nessun lavoro.</p>
          ) : (
            [...perMese.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([mese, lavori]) => (
              <div key={mese} className="flex flex-col gap-1.5">
                <span className="font-mono text-[11px] uppercase tracking-label text-fumo-2">{formatMese(mese)}</span>
                {lavori.map((l) => {
                  const cliente = l.clienteId ? dati.clienti.find((c) => c.id === l.clienteId) : undefined;
                  const svolto = l.fase === "fatto";
                  return (
                    <button key={l.id} type="button" onClick={() => navigate(`/lavoro/${l.id}`)} className={svolto ? "flex items-center justify-between gap-2 rounded-vetro bg-superficie px-3 py-2.5 text-left" : "flex items-center justify-between gap-2 rounded-vetro border border-dashed border-white/10 px-3 py-2.5 text-left"}>
                      <span className="flex min-w-0 flex-col items-start">
                        <span className="truncate text-sm font-medium">{cliente?.nome ?? "—"} · {l.titolo}</span>
                        <span className="font-mono text-[11px] text-fumo-2">{formatData(l.data)}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2 font-mono text-xs">
                        <span className="text-fumo-2">{svolto ? formatOre(oreDi(l.id)) : "—"}</span>
                        {svolto && <span className="text-blu">{formatEuro(costoDi(l.id))}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </section>
      </div>

      {!io && <PagaSheet open={pagaOpen} onOpenChange={setPagaOpen} operatoreId={operatore.id} nome={operatore.nome} saldo={libro.saldo} />}
    </div>
  );
}

function PagaSheet({ open, onOpenChange, operatoreId, nome, saldo }: { open: boolean; onOpenChange: (o: boolean) => void; operatoreId: string; nome: string; saldo: number }) {
  const [importo, setImporto] = useState("");
  const [metodo, setMetodo] = useState<MetodoPagamento>("contanti");
  const v = importo ? Number(importo.replace(",", ".")) : saldo;
  const paga = async () => {
    await pagaOperaio(operatoreId, v, metodo);
    setImporto("");
    onOpenChange(false);
    toast.success(`Pagato ${formatEuro(v)} a ${nome}`);
  };
  return (
    <Foglio open={open} onOpenChange={onOpenChange} variante="azione-pagamento" titolo={`Paga ${nome}`}>
      <div className="flex flex-col gap-3">
        <p className="font-mono text-sm text-fumo-2">Da pagare: <span className="text-rosso">{formatEuro(saldo)}</span></p>
        <Field label="Importo" value={importo} onChange={(e) => setImporto(e.target.value.replace(/[^0-9.,]/g, ""))} suffix="€" inputMode="decimal" placeholder={String(saldo)} />
        <Segmented
          value={metodo}
          onValueChange={setMetodo}
          options={[
            { value: "contanti", label: "Contanti" },
            { value: "bonifico", label: "Bonifico" },
            { value: "altro", label: "Altro" },
          ]}
          layoutId="metodo-paga"
        />
        <Button size="lg" onClick={() => void paga()}>Paga {formatEuro(v)}</Button>
      </div>
    </Foglio>
  );
}
