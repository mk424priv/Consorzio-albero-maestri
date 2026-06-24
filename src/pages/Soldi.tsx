import { ArrowDownToLine, ArrowUpFromLine, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CardLavoro } from "@/components/CardLavoro";
import { Intestazione } from "@/components/Intestazione";
import { Badge, Button, Card, Codice, Field, Segmented, Sheet } from "@/components/ui";
import { codiceCliente } from "@/lib/codice-parlante";
import { libroOperatore, riepilogoCliente, riepilogoSoldi } from "@/lib/conti";
import { chiaveMese, formatEuro, formatMese, oggiISO } from "@/lib/format";
import { calcoloLavoro, operatoreIo } from "@/lib/lavoro-calc";
import { incassaSubito, prelievoTitolare } from "@/store/azioni";
import { useStore } from "@/store/store";

function meseAdiacente(chiave: string, delta: number): string {
  const [a, m] = chiave.split("-").map(Number);
  const d = new Date(a, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function Dash({ label, valore, accento }: { label: string; valore: number; accento?: boolean }) {
  return (
    <div className="flex flex-col gap-1 rounded-vetro glass-scura p-3">
      <span className="font-mono text-[0.58rem] uppercase tracking-wider text-fumo">{label}</span>
      <span className={accento ? "font-mono text-sm font-medium tabular-nums text-attenzione" : "font-mono text-sm font-medium tabular-nums text-lime"}>
        {formatEuro(valore)}
      </span>
    </div>
  );
}

export function Soldi() {
  const dati = useStore((s) => s.dati);
  const navigate = useNavigate();
  const [mese, setMese] = useState(() => chiaveMese(oggiISO()));
  const [modo, setModo] = useState<"incassare" | "pagare">("incassare");
  const [subitoOpen, setSubitoOpen] = useState(false);
  const [prelievoOpen, setPrelievoOpen] = useState(false);

  const r = riepilogoSoldi(dati, mese);
  const io = operatoreIo(dati);

  const debitori = useMemo(
    () =>
      dati.clienti
        .filter((c) => !c.deleted)
        .map((c) => ({ c, saldo: riepilogoCliente(dati, c.id).saldoDaIncassare }))
        .filter((x) => x.saldo > 0)
        .sort((a, b) => b.saldo - a.saldo),
    [dati],
  );

  const debitoriOperai = useMemo(
    () =>
      dati.operatori
        .filter((o) => !o.deleted && o.id !== io?.id)
        .map((o) => ({ o, libro: libroOperatore(dati, o.id) }))
        .filter((x) => x.libro.saldo > 0)
        .sort((a, b) => b.libro.saldo - a.libro.saldo),
    [dati, io?.id],
  );

  const usciteMese = dati.compensi
    .filter((c) => !c.deleted && chiaveMese(c.data) === mese)
    .reduce((a, c) => a + c.importo, 0);
  const cassaMese = Math.max(0, r.incassatoMese - usciteMese);

  return (
    <div className="flex flex-col gap-4 pb-8">
      <Intestazione
        titolo="Soldi"
        azione={
          <div className="flex items-center gap-1">
            <Button size="icona" variant="tenue" className="h-9 w-9" onClick={() => setMese((m) => meseAdiacente(m, -1))} aria-label="Mese precedente">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="w-20 text-center font-mono text-[0.65rem] text-fumo">{formatMese(mese)}</span>
            <Button size="icona" variant="tenue" className="h-9 w-9" onClick={() => setMese((m) => meseAdiacente(m, 1))} aria-label="Mese successivo">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        }
      />

      {/* blocco riepilogo — 3 dashboard -> Dashboard */}
      <button type="button" onClick={() => navigate("/dashboard")} className="grid grid-cols-3 gap-2 text-left transition-transform active:scale-[0.99]" aria-label="Apri la Dashboard">
        <Dash label="Guadagnato" valore={r.guadagnatoMese} />
        <Dash label="Incassato" valore={r.incassatoMese} />
        <Dash label="Da incassare" valore={r.daIncassare} accento={r.daIncassare > 0} />
      </button>

      {/* segmento due modi */}
      <Segmented
        value={modo}
        onValueChange={setModo}
        options={[
          { value: "incassare", label: "Da incassare" },
          { value: "pagare", label: "Da pagare" },
        ]}
        layoutId="modo-soldi"
      />

      {modo === "incassare" ? (
        <div className="flex flex-col gap-4">
          <Card tono="piana" className="flex items-center justify-between px-3 py-2">
            <span className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-fumo-2">
              <ArrowDownToLine className="h-4 w-4 text-positivo" /> Totale da incassare
            </span>
            <span className="font-mono text-base tabular-nums text-lime">{formatEuro(r.daIncassare)}</span>
          </Card>

          {debitori.length === 0 ? (
            <p className="py-6 text-center text-sm text-fumo-2">Tutto incassato. Niente in sospeso.</p>
          ) : (
            debitori.map(({ c, saldo }) => {
              const aperti = dati.lavori.filter((l) => !l.deleted && l.clienteId === c.id && l.fase === "fatto" && calcoloLavoro(dati, l).statoIncasso !== "pagato");
              return (
                <div key={c.id} className="flex flex-col gap-2">
                  <button type="button" onClick={() => navigate(`/cliente/${c.id}`)} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <Codice value={codiceCliente(dati, c.id)} />
                      <span className="text-sm font-medium">{c.nome} {c.cognome ?? ""}</span>
                    </span>
                    <Badge stato="attenzione">{formatEuro(saldo)}</Badge>
                  </button>
                  {aperti.map((l) => <CardLavoro key={l.id} lavoro={l} />)}
                </div>
              );
            })
          )}

          <Button variant="ottone" onClick={() => setSubitoOpen(true)} className="mt-1">
            <Plus className="h-5 w-5" /> Incasso Subito
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Card tono="piana" className="flex items-center justify-between px-3 py-2">
            <span className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-fumo-2">
              <ArrowUpFromLine className="h-4 w-4 text-attenzione" /> Totale da pagare squadra
            </span>
            <span className="font-mono text-base tabular-nums text-attenzione">{formatEuro(r.daPagareOperai)}</span>
          </Card>

          {debitoriOperai.length === 0 ? (
            <p className="py-4 text-center text-sm text-fumo-2">Nessun compenso in sospeso.</p>
          ) : (
            debitoriOperai.map(({ o, libro }) => (
              <button key={o.id} type="button" onClick={() => navigate(`/operaio/${o.id}`)} className="flex items-center justify-between gap-2 rounded-2xl bg-white/[0.08] px-3 py-2.5 text-left">
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium">{o.nome}</span>
                  <span className="font-mono text-[0.65rem] text-fumo-2">dovuto {formatEuro(libro.dovuto)} · pagato {formatEuro(libro.pagato)}</span>
                </span>
                <Badge stato="attenzione">{formatEuro(libro.saldo)}</Badge>
              </button>
            ))
          )}

          {/* prelievo io */}
          <Card tono="incasso" className="flex flex-col gap-2 p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-fumo">Io · cassa del mese</span>
              <span className="font-mono text-base tabular-nums text-lime">{formatEuro(cassaMese)}</span>
            </div>
            <p className="text-xs text-fumo">Non è un costo, è un prelievo.</p>
            <Button variant="ottone" size="sm" className="self-start" onClick={() => setPrelievoOpen(true)} disabled={cassaMese <= 0}>
              Preleva
            </Button>
          </Card>
        </div>
      )}

      <IncassoSubitoSheet open={subitoOpen} onOpenChange={setSubitoOpen} onFatto={(id) => navigate(`/lavoro/${id}`)} />
      <PrelievoSheet open={prelievoOpen} onOpenChange={setPrelievoOpen} cassa={cassaMese} />
    </div>
  );
}

function IncassoSubitoSheet({ open, onOpenChange, onFatto }: { open: boolean; onOpenChange: (o: boolean) => void; onFatto: (id: string) => void }) {
  const dati = useStore((s) => s.dati);
  const [clienteId, setClienteId] = useState("");
  const [titolo, setTitolo] = useState("");
  const [importo, setImporto] = useState("");

  const conferma = async () => {
    const v = Number(importo.replace(",", "."));
    if (!(v > 0)) return;
    const id = await incassaSubito({ clienteId: clienteId || undefined, titolo, importo: v });
    setClienteId("");
    setTitolo("");
    setImporto("");
    onOpenChange(false);
    onFatto(id);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Incasso Subito" description="A preventivo, tutto subito, senza ore.">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-xs uppercase tracking-wider text-fumo-2">Cliente</label>
          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="h-11 rounded-2xl border border-white/15 bg-white/[0.08] px-3 text-sm">
            <option value="">Senza cliente</option>
            {dati.clienti.filter((c) => !c.deleted).map((c) => (
              <option key={c.id} value={c.id}>{c.nome} {c.cognome ?? ""}</option>
            ))}
          </select>
        </div>
        <Field label="Descrizione" value={titolo} onChange={(e) => setTitolo(e.target.value)} placeholder="Es. Potatura giardino" />
        <Field label="Importo" value={importo} onChange={(e) => setImporto(e.target.value)} suffix="€" inputMode="decimal" placeholder="0,00" />
        <Button size="lg" variant="ottone" onClick={() => void conferma()}>
          Incassa {importo ? formatEuro(Number(importo.replace(",", "."))) : ""}
        </Button>
      </div>
    </Sheet>
  );
}

function PrelievoSheet({ open, onOpenChange, cassa }: { open: boolean; onOpenChange: (o: boolean) => void; cassa: number }) {
  const [importo, setImporto] = useState("");
  const conferma = async () => {
    const v = importo ? Number(importo.replace(",", ".")) : cassa;
    await prelievoTitolare(v);
    setImporto("");
    onOpenChange(false);
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Preleva" description="Vai a prendere dei soldi dalla cassa.">
      <div className="flex flex-col gap-3">
        <p className="font-mono text-sm text-fumo-2">Cassa del mese: <span className="text-lime">{formatEuro(cassa)}</span></p>
        <Field label="Importo" value={importo} onChange={(e) => setImporto(e.target.value)} suffix="€" inputMode="decimal" placeholder={String(cassa)} />
        <Button size="lg" variant="ottone" onClick={() => void conferma()}>Conferma prelievo</Button>
      </div>
    </Sheet>
  );
}
