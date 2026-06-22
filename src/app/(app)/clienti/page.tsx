import Link from "next/link";
import { db } from "@/lib/db";
import { codiceClienteDaDB } from "@/lib/codice-parlante";
import { riepilogoCliente } from "@/lib/conti";
import { euro } from "@/lib/format";
import { etichetta } from "@/lib/dominio";
import { Titolo, Vuoto, CodiceCliente } from "@/components/ui";

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
                <th>Cliente</th>
                <th>Codice</th>
                <th>Luogo</th>
                <th>Accordo</th>
                <th className="text-right">Da incassare</th>
              </tr>
            </thead>
            <tbody>
              {righe.map(({ cliente, codice, riepilogo }) => (
                <tr key={cliente.id}>
                  <td>
                    <Link href={`/clienti/${cliente.id}`} className="text-[var(--primary)] hover:underline font-medium">
                      {cliente.nome} {cliente.cognome}
                    </Link>
                  </td>
                  <td><CodiceCliente codice={codice} /></td>
                  <td className="text-[var(--muted)]">{cliente.luogo ?? "—"}</td>
                  <td>{etichetta(cliente.modalitaPredefinita)}</td>
                  <td className="text-right">
                    {riepilogo.saldoDaIncassare > 0 ? (
                      <span className="text-[var(--danger)] font-medium">{euro(riepilogo.saldoDaIncassare)}</span>
                    ) : (
                      <span className="text-[var(--muted)]">—</span>
                    )}
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
