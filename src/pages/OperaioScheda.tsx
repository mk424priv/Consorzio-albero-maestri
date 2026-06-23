import { ArrowLeft, Banknote, CalendarClock, Clock, Leaf, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Intestazione } from "@/components/Intestazione";
import { Badge, Button, Card, Segmented } from "@/components/ui";
import { libroOperatore } from "@/lib/conti";
import type { MetodoPagamento } from "@/lib/dominio";
import { etichetta, TONO_COMPENSO } from "@/lib/dominio";
import { chiaveMese, formatData, formatEuro, formatMese, formatOre } from "@/lib/format";
import { calcoloLavoro } from "@/lib/lavoro-calc";
import { pagaOperaio } from "@/store/azioni";
import { useStore } from "@/store/store";

const TONO_BADGE = { positivo: "positivo", attenzione: "attenzione", critico: "critico", lichene: "lichene", ottone: "ottone", neutro: "neutro" } as const;

export function OperaioScheda() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const dati = useStore((s) => s.dati);
  const [pagaOpen, setPagaOpen] = useState(false);
  const [importo, setImporto] = useState("");
  const [metodo, setMetodo] = useState<MetodoPagamento>("contanti");

  const operatore = dati.operatori.find((o) => o.id === id);
  if (!operatore) {
    return (
      <div className="flex flex-col gap-3">
        <Intestazione titolo="Operaio" />
        <p className="text-sm text-inchiostro-debole">Operaio non trovato.</p>
      </div>
    );
  }

  const io = operatore.ruolo === "titolare";
  const libro = libroOperatore(dati, operatore.id);

  // storico per mese
  const perMese = new Map<string, typeof libro.lavori>();
  for (const l of libro.lavori) {
    const k = chiaveMese(l.data);
    perMese.set(k, [...(perMese.get(k) ?? []), l]);
  }

  const oreDi = (lavoroId: string) =>
    dati.ore.filter((o) => o.lavoroId === lavoroId && o.operatoreId === operatore.id && !o.deleted).reduce((a, o) => a + o.ore, 0);
  const costoDi = (lavoroId: string) => {
    const l = dati.lavori.find((x) => x.id === lavoroId);
    if (!l) return 0;
    return calcoloLavoro(dati, l).partecipanti.find((p) => p.collaboratoreId === operatore.id)?.costo ?? 0;
  };

  const paga = async () => {
    const v = importo ? Number(importo.replace(",", ".")) : libro.saldo;
    await pagaOperaio(operatore.id, v, metodo);
    setImporto("");
    setPagaOpen(false);
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <Intestazione
        titolo={operatore.nome}
        azione={
          <Button size="icona" variant="tenue" onClick={() => navigate(-1)} aria-label="Indietro">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        }
      />

      {/* identità */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-targhetta bg-ottone font-display text-xl text-carta-alta shadow-targhetta">
          {operatore.nome[0]?.toUpperCase()}
        </div>
        <div className="flex flex-col">
          <Badge stato={io ? "ottone" : "neutro"}>{etichetta(operatore.ruolo)}</Badge>
          <span className="font-mono text-sm text-inchiostro-medio">
            {io ? "io" : `${operatore.tariffaOraria ?? 0} €/h · costo`}
          </span>
        </div>
      </div>

      {/* statistica minima (NON tutto lo schermo) */}
      <Card tono="piana" className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 font-mono text-sm">
        <span className="flex items-center gap-1 text-inchiostro-medio"><Clock className="h-4 w-4" /> {formatOre(libro.ore)}</span>
        {io ? (
          <span className="flex items-center gap-1 text-lichene"><Leaf className="h-4 w-4" /> il mio tempo · non è un costo</span>
        ) : (
          <>
            <span className="flex items-center gap-1 text-positivo"><Banknote className="h-4 w-4" /> {formatEuro(libro.pagato)}</span>
            <span className="flex items-center gap-1">
              <Badge stato={TONO_BADGE[TONO_COMPENSO[libro.stato]]}>{formatEuro(libro.saldo)} da pagare</Badge>
            </span>
          </>
        )}
      </Card>

      {/* AZIONI (focus) */}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="ottone" className="h-auto flex-col items-start gap-0.5 py-3" onClick={() => navigate("/nuovo", { state: { operatoreId: operatore.id, fase: "fatto" } })}>
          <span className="flex items-center gap-1"><Plus className="h-4 w-4" /> Aggiungi lavoro</span>
          <span className="font-mono text-[0.6rem] opacity-80">svolto · oggi</span>
        </Button>
        <Button variant="tenue" className="h-auto flex-col items-start gap-0.5 py-3" onClick={() => navigate("/nuovo", { state: { operatoreId: operatore.id, fase: "da_fare" } })}>
          <span className="flex items-center gap-1"><CalendarClock className="h-4 w-4" /> Pianifica</span>
          <span className="font-mono text-[0.6rem] opacity-80">programmato</span>
        </Button>
      </div>

      {!io && libro.saldo > 0 && (
        <>
          <Button variant="inchiostro" onClick={() => setPagaOpen((v) => !v)}>
            <Banknote className="h-4 w-4" /> Paga operaio
          </Button>
          {pagaOpen && (
            <Card tono="incasso" className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-inchiostro-chiaro/60">Da pagare</span>
                <span className="font-mono text-base tabular-nums text-ottone-chiaro">{formatEuro(libro.saldo)}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={importo}
                  inputMode="decimal"
                  placeholder={String(libro.saldo)}
                  onChange={(e) => setImporto(e.target.value.replace(/[^0-9.,]/g, ""))}
                  className="h-10 flex-1 rounded-targhetta bg-carta-alta px-3 text-right font-mono text-sm text-inchiostro tabular-nums focus-visible:outline-none"
                />
                <span className="font-mono text-sm text-inchiostro-chiaro">€</span>
              </div>
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
              <Button variant="ottone" onClick={() => void paga()}>
                Paga {formatEuro(importo ? Number(importo.replace(",", ".")) : libro.saldo)}
              </Button>
            </Card>
          )}
        </>
      )}

      {/* storico */}
      <section className="flex flex-col gap-2">
        <h2 className="font-mono text-xs uppercase tracking-wider text-inchiostro-debole">Storico</h2>
        {libro.lavori.length === 0 ? (
          <p className="py-4 text-center text-sm text-inchiostro-debole">Ancora nessun lavoro.</p>
        ) : (
          [...perMese.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([mese, lavori]) => (
            <div key={mese} className="flex flex-col gap-1.5">
              <span className="font-mono text-[0.65rem] uppercase tracking-wider text-inchiostro-debole">{formatMese(mese)}</span>
              {lavori.map((l) => {
                const cliente = l.clienteId ? dati.clienti.find((c) => c.id === l.clienteId) : undefined;
                const svolto = l.fase === "fatto";
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => navigate(`/lavoro/${l.id}`)}
                    className={svolto ? "flex items-center justify-between gap-2 rounded-quietanza bg-carta-svolto px-3 py-2 text-left shadow-svolto" : "flex items-center justify-between gap-2 rounded-carta border border-dashed border-inchiostro-debole/40 bg-carta-programmato px-3 py-2 text-left"}
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm">{cliente?.nome ?? "—"} · {l.titolo}</span>
                      <span className="font-mono text-[0.65rem] text-inchiostro-debole">{formatData(l.data)}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 font-mono text-xs">
                      <span className="text-inchiostro-medio">{svolto ? formatOre(oreDi(l.id)) : "—"}</span>
                      {svolto && <span className="text-ottone-scuro">{formatEuro(costoDi(l.id))}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
