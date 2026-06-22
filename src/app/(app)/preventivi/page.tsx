import Link from "next/link";
import { db } from "@/lib/db";
import { euro, dataIT } from "@/lib/format";
import { etichetta } from "@/lib/dominio";
import { statoCalcolato } from "@/lib/conti";
import { Titolo, Vuoto, BadgePagamento, LinkCliente } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PreventiviPage() {
  const preventivi = await db.preventivo.findMany({
    orderBy: { dataEmissione: "desc" },
    include: { cliente: true, pagamenti: true },
  });

  return (
    <div>
      <Titolo
        titolo="Preventivi"
        sottotitolo="Prezzi concordati → pagamenti attesi"
        azione={<Link href="/preventivi/nuovo" className="btn btn-primary">+ Nuovo preventivo</Link>}
      />

      {preventivi.length === 0 ? (
        <Vuoto testo="Nessun preventivo ancora." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr><th>Data</th><th>Cliente</th><th>Tipo</th><th className="text-right">Importo</th><th>Pagamenti</th></tr>
            </thead>
            <tbody>
              {preventivi.map((p) => (
                <tr key={p.id}>
                  <td>{dataIT(p.dataEmissione)}</td>
                  <td><LinkCliente id={p.clienteId} nome={`${p.cliente.nome} ${p.cliente.cognome}`} /></td>
                  <td>
                    {etichetta(p.tipo)}
                    {p.tipo === "acconto_saldo" && (
                      <span className="text-xs text-[var(--muted)]"> ({euro(p.importoAcconto ?? 0)} + {euro(p.importoSaldo ?? 0)})</span>
                    )}
                  </td>
                  <td className="text-right font-medium">{euro(p.importoTotale)}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {p.pagamenti.map((pag) => (
                        <BadgePagamento key={pag.id} stato={statoCalcolato(pag)} />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
