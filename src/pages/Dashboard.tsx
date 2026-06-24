import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Intestazione } from "@/components/Intestazione";
import { Badge, Button, Card, Codice, Segmented } from "@/components/ui";
import { codiceCliente } from "@/lib/codice-parlante";
import { libroOperatore, riepilogoCliente } from "@/lib/conti";
import type { Tono } from "@/lib/dominio";
import { TONO_COMPENSO } from "@/lib/dominio";
import { arrotonda, formatEuro, formatOre } from "@/lib/format";
import { operatoreIo } from "@/lib/lavoro-calc";
import { useStore } from "@/store/store";

function Kpi({ label, valore, accento }: { label: string; valore: string; accento?: Tono }) {
  const colore = accento === "critico" ? "text-critico" : accento === "attenzione" ? "text-attenzione" : "text-inchiostro";
  return (
    <div className="flex flex-col gap-0.5 rounded-targhetta bg-carta-alta px-3 py-2 shadow-svolto">
      <span className="font-mono text-[0.58rem] uppercase tracking-wider text-inchiostro-debole">{label}</span>
      <span className={`font-mono text-sm font-medium tabular-nums ${colore}`}>{valore}</span>
    </div>
  );
}

function Barra({ pct, tono }: { pct: number; tono: "positivo" | "ottone" }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-carta-ombra">
      <div className={tono === "positivo" ? "h-full rounded-full bg-positivo" : "h-full rounded-full bg-ottone"} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

export function Dashboard() {
  const dati = useStore((s) => s.dati);
  const navigate = useNavigate();
  const [modo, setModo] = useState<"clienti" | "operai">("clienti");
  const io = operatoreIo(dati);

  const clienti = useMemo(
    () =>
      dati.clienti
        .filter((c) => !c.deleted)
        .map((c) => ({ c, r: riepilogoCliente(dati, c.id) }))
        .filter((x) => x.r.numeroLavori > 0)
        .sort((a, b) => b.r.saldoDaIncassare - a.r.saldoDaIncassare),
    [dati],
  );
  const operai = useMemo(
    () => dati.operatori.filter((o) => !o.deleted).map((o) => ({ o, libro: libroOperatore(dati, o.id) })).sort((a, b) => b.libro.saldo - a.libro.saldo),
    [dati],
  );

  const kpiClienti = clienti.reduce(
    (a, { r }) => ({
      fatt: a.fatt + r.valoreFatturabile,
      inc: a.inc + r.totaleIncassato,
      da: a.da + r.saldoDaIncassare,
      ritardo: a.ritardo + (r.saldoDaIncassare > 0 ? 1 : 0),
    }),
    { fatt: 0, inc: 0, da: 0, ritardo: 0 },
  );
  const kpiOperai = operai.reduce(
    (a, { o, libro }) => ({
      ore: a.ore + libro.ore,
      dovuto: a.dovuto + (o.id === io?.id ? 0 : libro.dovuto),
      pagato: a.pagato + libro.pagato,
      saldo: a.saldo + libro.saldo,
    }),
    { ore: 0, dovuto: 0, pagato: 0, saldo: 0 },
  );

  return (
    <div className="flex flex-col gap-4 pb-8">
      <Intestazione
        titolo="Dashboard"
        azione={
          <Button size="icona" variant="tenue" onClick={() => navigate(-1)} aria-label="Chiudi">
            <X className="h-5 w-5" />
          </Button>
        }
      />

      <Segmented
        value={modo}
        onValueChange={setModo}
        options={[
          { value: "clienti", label: "Clienti" },
          { value: "operai", label: "Operai" },
        ]}
        layoutId="modo-dashboard"
      />

      {modo === "clienti" ? (
        <>
          <div className="grid grid-cols-4 gap-2">
            <Kpi label="Fatturabile" valore={formatEuro(kpiClienti.fatt)} />
            <Kpi label="Incassato" valore={formatEuro(kpiClienti.inc)} />
            <Kpi label="Da incassare" valore={formatEuro(kpiClienti.da)} accento={kpiClienti.da > 0 ? "attenzione" : undefined} />
            <Kpi label="Debitori" valore={String(kpiClienti.ritardo)} />
          </div>
          <div className="flex flex-col gap-2">
            {clienti.length === 0 ? (
              <p className="py-6 text-center text-sm text-inchiostro-debole">Nessun cliente con movimenti.</p>
            ) : (
              clienti.map(({ c, r }) => {
                const pct = r.valoreFatturabile > 0 ? arrotonda((r.totaleIncassato / r.valoreFatturabile) * 100) : 100;
                return (
                  <button key={c.id} type="button" onClick={() => navigate(`/cliente/${c.id}`)} className="flex flex-col gap-1.5 rounded-targhetta bg-carta-alta px-3 py-2.5 text-left shadow-svolto">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2"><Codice value={codiceCliente(dati, c.id)} /><span className="text-sm font-medium">{c.nome} {c.cognome ?? ""}</span></span>
                      {r.saldoDaIncassare > 0 ? <Badge stato="attenzione">{formatEuro(r.saldoDaIncassare)}</Badge> : <Badge stato="positivo">ok</Badge>}
                    </div>
                    <span className="font-mono text-[0.65rem] text-inchiostro-debole">
                      {formatOre(r.oreTotali)} · fatt. {formatEuro(r.valoreFatturabile)} · inc. {formatEuro(r.totaleIncassato)}
                    </span>
                    <Barra pct={pct} tono="positivo" />
                  </button>
                );
              })
            )}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2">
            <Kpi label="Ore squadra" valore={formatOre(kpiOperai.ore)} />
            <Kpi label="Dovuto" valore={formatEuro(kpiOperai.dovuto)} />
            <Kpi label="Pagato" valore={formatEuro(kpiOperai.pagato)} />
            <Kpi label="Da pagare" valore={formatEuro(kpiOperai.saldo)} accento={kpiOperai.saldo > 0 ? "attenzione" : undefined} />
          </div>
          <div className="flex flex-col gap-2">
            {operai.map(({ o, libro }) => {
              const isIo = o.id === io?.id;
              const pct = libro.dovuto > 0 ? arrotonda((libro.pagato / libro.dovuto) * 100) : 100;
              return (
                <button key={o.id} type="button" onClick={() => navigate(`/operaio/${o.id}`)} className="flex flex-col gap-1.5 rounded-targhetta bg-carta-alta px-3 py-2.5 text-left shadow-svolto">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{o.nome} {isIo && <span className="font-mono text-xs text-inchiostro-debole">· io</span>}</span>
                    {isIo ? (
                      <Badge stato="lichene">profitto</Badge>
                    ) : (
                      <Badge stato={TONO_COMPENSO[libro.stato]}>{formatEuro(libro.saldo)}</Badge>
                    )}
                  </div>
                  {isIo ? (
                    <span className="font-mono text-[0.65rem] text-inchiostro-debole">{formatOre(libro.ore)} · le mie ore = profitto, non costo</span>
                  ) : (
                    <>
                      <span className="font-mono text-[0.65rem] text-inchiostro-debole">{formatOre(libro.ore)} · dovuto {formatEuro(libro.dovuto)} · pagato {formatEuro(libro.pagato)}</span>
                      <Barra pct={pct} tono="ottone" />
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      <Card tono="piana" className="px-3 py-2 text-center font-mono text-[0.65rem] text-inchiostro-debole">
        dati separati: clienti = denaro in entrata · operai = denaro in uscita
      </Card>
    </div>
  );
}
