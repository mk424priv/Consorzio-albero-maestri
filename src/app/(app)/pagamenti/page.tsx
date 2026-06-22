import Link from "next/link";
import { db } from "@/lib/db";
import { euro, dataIT } from "@/lib/format";
import { etichetta } from "@/lib/dominio";
import { statoCalcolato, giorniRitardo } from "@/lib/conti";
import { Titolo, Vuoto, BadgePagamento, LinkCliente } from "@/components/ui";
import { registraIncasso } from "@/actions/pagamenti";

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
          <Link
            key={f.k}
            href={`/pagamenti?stato=${f.k}`}
            className={`badge ${filtro === f.k ? "badge-success" : "badge-muted"}`}
          >
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
                <th>Cliente</th><th>Origine</th><th>Emesso</th><th>Scadenza</th>
                <th className="text-right">Atteso</th><th className="text-right">Incassato</th><th>Stato</th><th></th>
              </tr>
            </thead>
            <tbody>
              {righe.map(({ p, st }) => {
                const gr = st === "in_ritardo" ? giorniRitardo(p.dataScadenza) : 0;
                return (
                  <tr key={p.id}>
                    <td><LinkCliente id={p.clienteId} nome={`${p.cliente.nome} ${p.cliente.cognome}`} /></td>
                    <td>{etichetta(p.origine)}</td>
                    <td>{dataIT(p.dataEmissione)}</td>
                    <td>{p.dataScadenza ? dataIT(p.dataScadenza) : "—"}</td>
                    <td className="text-right">{euro(p.importoAtteso)}</td>
                    <td className="text-right">{euro(p.importoIncassato)}</td>
                    <td>
                      <BadgePagamento stato={st} />
                      {gr > 0 && <span className="text-xs text-[var(--danger)] block">{gr} gg</span>}
                    </td>
                    <td className="text-right">
                      {st !== "pagato" && (
                        <form action={registraIncasso}>
                          <input type="hidden" name="id" value={p.id} />
                          <button type="submit" className="btn text-xs py-1">Segna incassato</button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
