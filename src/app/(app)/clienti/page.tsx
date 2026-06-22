import Link from "next/link";
import { db } from "@/lib/db";
import { codiceClienteDaDB } from "@/lib/codice-parlante";
import { riepilogoCliente } from "@/lib/conti";
import { euro } from "@/lib/format";
import { etichetta, MODALITA } from "@/lib/dominio";
import { Titolo, Vuoto, CodiceCliente, LinkCliente } from "@/components/ui";
import RigaEditabile, { type Cella } from "@/components/RigaEditabile";
import { modificaCliente } from "@/actions/modifica";

export const dynamic = "force-dynamic";

export default async function ClientiPage() {
  const clienti = await db.cliente.findMany({ orderBy: [{ cognome: "asc" }, { nome: "asc" }] });
  const righe = await Promise.all(
    clienti.map(async (cl) => ({
      cliente: cl,
      codice: await codiceClienteDaDB(cl.id),
      riepilogo: await riepilogoCliente(cl.id),
    })),
  );

  return (
    <div>
      <Titolo
        titolo="Clienti"
        sottotitolo="Le radici dell'attività"
        azione={
          <Link href="/clienti/nuovo" className="btn btn-primary">+ Nuovo cliente</Link>
        }
      />

      {righe.length === 0 ? (
        <Vuoto testo="Ancora nessun cliente. Inizia aggiungendone uno." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th></th>
                <th>Cliente</th>
                <th>Codice</th>
                <th>Luogo</th>
                <th>Accordo</th>
                <th className="text-right">Da incassare</th>
              </tr>
            </thead>
            <tbody>
              {righe.map(({ cliente, codice, riepilogo }) => {
                const celle: Cella[] = [
                  { tipo: "statico", nodo: <LinkCliente id={cliente.id} nome={`${cliente.nome} ${cliente.cognome}`} /> },
                  { tipo: "statico", nodo: <CodiceCliente codice={codice} /> },
                  { tipo: "testo", nome: "luogo", valore: cliente.luogo ?? "", classe: "text-[var(--muted)]", display: cliente.luogo ?? "—" },
                  { tipo: "select", nome: "modalitaPredefinita", valore: cliente.modalitaPredefinita, opzioni: MODALITA.map((m) => ({ v: m, l: etichetta(m) })), display: etichetta(cliente.modalitaPredefinita) },
                  {
                    tipo: "statico", classe: "text-right",
                    nodo: riepilogo.saldoDaIncassare > 0
                      ? <span className="text-[var(--danger)] font-medium">{euro(riepilogo.saldoDaIncassare)}</span>
                      : <span className="text-[var(--muted)]">—</span>,
                  },
                ];
                return <RigaEditabile key={cliente.id} id={cliente.id} azione={modificaCliente} celle={celle} />;
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
