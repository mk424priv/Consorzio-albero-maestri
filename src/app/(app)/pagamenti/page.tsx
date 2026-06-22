import Link from "next/link";
import { db } from "@/lib/db";
import { euro, dataIT, inputData } from "@/lib/format";
import { etichetta, ORIGINE_PAGAMENTO } from "@/lib/dominio";
import { statoCalcolato, giorniRitardo } from "@/lib/conti";
import { Titolo, Vuoto, BadgePagamento, LinkCliente } from "@/components/ui";
import RigaEditabile, { type Cella } from "@/components/RigaEditabile";
import { registraIncasso } from "@/actions/pagamenti";
import { modificaPagamento } from "@/actions/modifica";

export const dynamic = "force-dynamic";

const FILTRI = [
  { k: "tutti", label: "Tutti" },
  { k: "in_attesa", label: "In attesa" },
  { k: "in_ritardo", label: "In ritardo" },
  { k: "pagato", label: "Pagati" },
] as const;

export default async function PagamentiPage({
  searchParams,
}: {
  searchParams: Promise<{ stato?: string }>;
}) {
  const { stato } = await searchParams;
  const filtro = stato ?? "tutti";

  const tutti = await db.pagamento.findMany({
    orderBy: { dataEmissione: "desc" },
    include: { cliente: true },
  });
  const righe = tutti
    .map((p) => ({ p, st: statoCalcolato(p) }))
    .filter((r) => filtro === "tutti" || r.st === filtro);

  const daIncassare = tutti.reduce((a, p) => a + (p.importoAtteso - p.importoIncassato), 0);

  return (
    <div>
      <Titolo titolo="Pagamenti" sottotitolo={`Da incassare in totale: ${euro(daIncassare)}`} />

      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTRI.map((f) => (
          <Link key={f.k} href={`/pagamenti?stato=${f.k}`} className={`badge ${filtro === f.k ? "badge-success" : "badge-muted"}`}>
            {f.label}
          </Link>
        ))}
      </div>

      {righe.length === 0 ? (
        <Vuoto testo="Nessun pagamento in questa vista." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th></th><th>Cliente</th><th>Origine</th><th>Emesso</th><th>Scadenza</th>
                <th className="text-right">Atteso</th><th className="text-right">Incassato</th><th>Stato</th><th></th>
              </tr>
            </thead>
            <tbody>
              {righe.map(({ p, st }) => {
                const gr = st === "in_ritardo" ? giorniRitardo(p.dataScadenza) : 0;
                const celle: Cella[] = [
                  { tipo: "statico", nodo: <LinkCliente id={p.clienteId} nome={`${p.cliente.nome} ${p.cliente.cognome}`} /> },
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
                        {gr > 0 && <span className="text-xs text-[var(--danger)] block">{gr} gg</span>}
                      </>
                    ),
                  },
                  {
                    tipo: "statico",
                    classe: "text-right",
                    nodo: st !== "pagato" ? (
                      <form action={registraIncasso}>
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" className="btn text-xs py-1">Segna incassato</button>
                      </form>
                    ) : null,
                  },
                ];
                return <RigaEditabile key={p.id} id={p.id} azione={modificaPagamento} celle={celle} />;
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-[var(--muted)] mt-3">Matita ✏️ per modificare importi e date. Lo stato e i totali si aggiornano da soli.</p>
    </div>
  );
}
