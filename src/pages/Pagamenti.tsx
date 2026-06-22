import { useMemo, useState } from "react";
import { Wallet } from "lucide-react";
import { clsx } from "clsx";
import { useStore } from "@/store/store";
import { dataIT, euro, inputData } from "@/lib/format";
import { etichetta, ORIGINE_PAGAMENTO } from "@/lib/dominio";
import type { OriginePagamento } from "@/lib/dominio";
import { giorniRitardo, statoCalcolato } from "@/lib/conti";
import { BadgePagamento, Button, Card, EmptyState, LinkCliente, PageHeader } from "@/components/ui";
import RigaEditabile, { type Cella } from "@/components/RigaEditabile";
import { useToast } from "@/store/toast";

const FILTRI = [
  { k: "tutti", label: "Tutti" },
  { k: "in_attesa", label: "In attesa" },
  { k: "in_ritardo", label: "In ritardo" },
  { k: "pagato", label: "Pagati" },
] as const;

type Filtro = (typeof FILTRI)[number]["k"];

export function Pagamenti() {
  const db = useStore((s) => s.db);
  const registraIncasso = useStore((s) => s.registraIncasso);
  const aggiornaPagamento = useStore((s) => s.aggiornaPagamento);
  const mostra = useToast((s) => s.mostra);
  const [filtro, setFiltro] = useState<Filtro>("tutti");

  const { righe, daIncassare, conteggi } = useMemo(() => {
    const tutti = [...db.pagamenti].sort((a, b) => b.dataEmissione.localeCompare(a.dataEmissione));
    const conStato = tutti.map((p) => ({ p, st: statoCalcolato(p) }));
    const conteggi: Record<string, number> = { tutti: tutti.length, in_attesa: 0, in_ritardo: 0, pagato: 0 };
    for (const { st } of conStato) conteggi[st]++;
    const righe = conStato.filter((r) => filtro === "tutti" || r.st === filtro);
    const daIncassare = tutti.reduce((a, p) => a + (p.importoAtteso - p.importoIncassato), 0);
    return { righe, daIncassare, conteggi };
  }, [db, filtro]);

  return (
    <div>
      <PageHeader
        titolo="Pagamenti"
        sottotitolo={`Da incassare in totale: ${euro(daIncassare)}`}
        icona={<Wallet size={22} />}
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTRI.map((f) => (
          <button
            key={f.k}
            onClick={() => setFiltro(f.k)}
            className={clsx(
              "badge cursor-pointer transition",
              filtro === f.k ? "badge-brand ring-1 ring-brand-200" : "badge-muted hover:brightness-95",
            )}
          >
            {f.label} <span className="opacity-60">· {conteggi[f.k] ?? 0}</span>
          </button>
        ))}
      </div>

      {righe.length === 0 ? (
        <EmptyState icona={<Wallet size={26} />} testo="Nessun pagamento in questa vista." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="am-table">
            <thead>
              <tr>
                <th></th><th>Cliente</th><th>Origine</th><th>Emesso</th><th>Scadenza</th>
                <th className="text-right">Atteso</th><th className="text-right">Incassato</th><th>Stato</th><th></th>
              </tr>
            </thead>
            <tbody>
              {righe.map(({ p, st }) => {
                const gr = st === "in_ritardo" ? giorniRitardo(p.dataScadenza) : 0;
                const cliente = db.clienti.find((c) => c.id === p.clienteId);
                const celle: Cella[] = [
                  { tipo: "statico", nodo: cliente ? <LinkCliente id={cliente.id} nome={`${cliente.nome} ${cliente.cognome}`} /> : "—" },
                  { tipo: "select", nome: "origine", valore: p.origine, opzioni: ORIGINE_PAGAMENTO.map((o) => ({ v: o, l: etichetta(o) })), display: etichetta(p.origine) },
                  { tipo: "data", nome: "dataEmissione", valore: inputData(p.dataEmissione), display: dataIT(p.dataEmissione) },
                  { tipo: "data", nome: "dataScadenza", valore: inputData(p.dataScadenza), display: p.dataScadenza ? dataIT(p.dataScadenza) : "—" },
                  { tipo: "numero", nome: "importoAtteso", valore: String(p.importoAtteso), step: "0.01", classe: "text-right", display: euro(p.importoAtteso) },
                  { tipo: "numero", nome: "importoIncassato", valore: String(p.importoIncassato), step: "0.01", classe: "text-right", display: euro(p.importoIncassato) },
                  {
                    tipo: "statico",
                    nodo: (
                      <>
                        <BadgePagamento stato={st} />
                        {gr > 0 && <span className="mt-0.5 block text-xs text-danger">{gr} gg</span>}
                      </>
                    ),
                  },
                  {
                    tipo: "statico",
                    classe: "text-right",
                    nodo: st !== "pagato" ? (
                      <Button dim="sm" onClick={() => { registraIncasso(p.id); mostra("Incasso registrato."); }}>Segna incassato</Button>
                    ) : null,
                  },
                ];
                return (
                  <RigaEditabile
                    key={p.id}
                    celle={celle}
                    onSave={(v) => {
                      aggiornaPagamento(p.id, {
                        origine: (v.origine as OriginePagamento) || p.origine,
                        dataEmissione: v.dataEmissione || p.dataEmissione,
                        dataScadenza: v.dataScadenza || null,
                        importoAtteso: Number(v.importoAtteso.replace(",", ".")) || 0,
                        importoIncassato: Number(v.importoIncassato.replace(",", ".")) || 0,
                      });
                      mostra("Pagamento aggiornato.");
                    }}
                  />
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
      <p className="mt-3 text-xs text-muted">Matita per modificare importi e date. Lo stato e i totali si aggiornano da soli.</p>
    </div>
  );
}
