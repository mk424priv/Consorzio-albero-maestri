import Link from "next/link";
import { db } from "@/lib/db";
import { euro, dataIT, inputData } from "@/lib/format";
import { etichetta, TIPO_PREVENTIVO } from "@/lib/dominio";
import { statoCalcolato } from "@/lib/conti";
import { Titolo, Vuoto, BadgePagamento, LinkCliente } from "@/components/ui";
import RigaEditabile, { type Cella } from "@/components/RigaEditabile";
import { modificaPreventivo } from "@/actions/modifica";

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
              <tr><th></th><th>Data</th><th>Cliente</th><th>Tipo</th><th className="text-right">Importo</th><th>Pagamenti</th></tr>
            </thead>
            <tbody>
              {preventivi.map((p) => {
                const celle: Cella[] = [
                  { tipo: "data", nome: "dataEmissione", valore: inputData(p.dataEmissione), display: dataIT(p.dataEmissione) },
                  { tipo: "statico", nodo: <LinkCliente id={p.clienteId} nome={`${p.cliente.nome} ${p.cliente.cognome}`} /> },
                  {
                    tipo: "select", nome: "tipo", valore: p.tipo,
                    opzioni: TIPO_PREVENTIVO.map((t) => ({ v: t, l: etichetta(t) })),
                    display: (
                      <>
                        {etichetta(p.tipo)}
                        {p.tipo === "acconto_saldo" && (
                          <span className="text-xs text-[var(--muted)]"> ({euro(p.importoAcconto ?? 0)} + {euro(p.importoSaldo ?? 0)})</span>
                        )}
                      </>
                    ),
                  },
                  { tipo: "numero", nome: "importoTotale", valore: String(p.importoTotale), step: "0.01", classe: "text-right", display: <span className="font-medium">{euro(p.importoTotale)}</span> },
                  {
                    tipo: "statico",
                    nodo: (
                      <div className="flex flex-wrap gap-1">
                        {p.pagamenti.map((pag) => <BadgePagamento key={pag.id} stato={statoCalcolato(pag)} />)}
                      </div>
                    ),
                  },
                ];
                return <RigaEditabile key={p.id} id={p.id} azione={modificaPreventivo} celle={celle} />;
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-[var(--muted)] mt-3">Tocca la matita ✏️ per modificare una riga. Le modifiche aggiornano subito i totali ovunque.</p>
    </div>
  );
}
