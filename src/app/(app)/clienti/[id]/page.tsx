import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { codiceClienteDaDB } from "@/lib/codice-parlante";
import { riepilogoCliente, statoCalcolato } from "@/lib/conti";
import { euro, dataIT, ore as fmtOre } from "@/lib/format";
import { etichetta } from "@/lib/dominio";
import { Titolo, Stat, BadgePagamento, CodiceCliente, Vuoto } from "@/components/ui";
import { eliminaCliente } from "@/actions/clienti";
import { registraIncasso } from "@/actions/pagamenti";

export const dynamic = "force-dynamic";

export default async function SchedaCliente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cliente = await db.cliente.findUnique({
    where: { id },
    include: {
      lavori: { orderBy: { data: "desc" }, include: { persona: true } },
      pagamenti: { orderBy: { dataEmissione: "desc" } },
      ore: { orderBy: { data: "desc" }, include: { persona: true }, take: 10 },
    },
  });
  if (!cliente) notFound();

  const codice = await codiceClienteDaDB(id);
  const r = await riepilogoCliente(id);
  const [, gg, ss, aa] = codice.split("-");

  return (
    <div>
      <Titolo
        titolo={`${cliente.nome} ${cliente.cognome}`}
        sottotitolo={cliente.luogo ?? undefined}
        azione={
          <div className="flex gap-2">
            <Link href={`/clienti/${id}/modifica`} className="btn">Modifica</Link>
            <Link href="/clienti" className="btn">← Clienti</Link>
          </div>
        }
      />

      <div className="card p-5 mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <CodiceCliente codice={codice} />
          <span className="text-sm text-[var(--muted)]">{etichetta(cliente.modalitaPredefinita)}{cliente.tariffaOraria ? ` · ${euro(cliente.tariffaOraria)}/h` : ""}</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <div><span className="text-[var(--muted)]">Paga in </span><b>{Number(gg)} giorni</b> in media</div>
          <div><span className="text-[var(--muted)]">Spesa media </span><b>{euro(Number(ss) * 50)}</b> a lavoro</div>
          <div><span className="text-[var(--muted)]">Cliente da </span><b>{Number(aa)} {Number(aa) === 1 ? "anno" : "anni"}</b></div>
        </div>
        {(cliente.telefono || cliente.email) && (
          <div className="text-sm text-[var(--muted)] mt-3 flex gap-4">
            {cliente.telefono && <span>📞 {cliente.telefono}</span>}
            {cliente.email && <span>✉️ {cliente.email}</span>}
          </div>
        )}
        {cliente.note && <p className="text-sm mt-3">{cliente.note}</p>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <Stat etichetta="Da incassare" valore={euro(r.saldoDaIncassare)} tono={r.saldoDaIncassare > 0 ? "negativo" : "neutro"} />
        <Stat etichetta="Incassato" valore={euro(r.totaleIncassato)} tono="positivo" />
        <Stat etichetta="Lavori" valore={String(r.numeroLavori)} />
        <Stat etichetta="Ore totali" valore={fmtOre(r.oreTotali)} />
      </div>

      {/* Pagamenti */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Pagamenti</h2>
          <div className="flex gap-2">
            <Link href={`/preventivi/nuovo?clienteId=${id}`} className="btn text-sm">+ Preventivo</Link>
            <Link href={`/ore?clienteId=${id}`} className="btn text-sm">+ Ore</Link>
          </div>
        </div>
        {cliente.pagamenti.length === 0 ? (
          <Vuoto testo="Nessun pagamento ancora." />
        ) : (
          <div className="card overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr><th>Emesso</th><th>Origine</th><th className="text-right">Atteso</th><th className="text-right">Incassato</th><th>Stato</th><th></th></tr>
              </thead>
              <tbody>
                {cliente.pagamenti.map((p) => {
                  const st = statoCalcolato(p);
                  return (
                    <tr key={p.id}>
                      <td>{dataIT(p.dataEmissione)}</td>
                      <td>{etichetta(p.origine)}</td>
                      <td className="text-right">{euro(p.importoAtteso)}</td>
                      <td className="text-right">{euro(p.importoIncassato)}</td>
                      <td><BadgePagamento stato={st} /></td>
                      <td className="text-right">
                        {st !== "pagato" && (
                          <form action={registraIncasso}>
                            <input type="hidden" name="id" value={p.id} />
                            <input type="hidden" name="ritorno" value={`/clienti/${id}`} />
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
      </section>

      {/* Lavori */}
      <section className="mb-8">
        <h2 className="font-semibold mb-3">Lavori</h2>
        {cliente.lavori.length === 0 ? (
          <Vuoto testo="Nessun lavoro ancora." />
        ) : (
          <div className="card divide-y divide-[var(--border)]">
            {cliente.lavori.map((l) => (
              <div key={l.id} className="p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{l.titolo}</div>
                  <div className="text-sm text-[var(--muted)]">{dataIT(l.data)} · {etichetta(l.tipoCompenso)}{l.persona ? ` · ${l.persona.nome}` : ""}</div>
                </div>
                <span className={`badge ${l.stato === "fatto" ? "badge-success" : l.stato === "in_corso" ? "badge-warning" : "badge-muted"}`}>{etichetta(l.stato)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Ore recenti */}
      {cliente.ore.length > 0 && (
        <section className="mb-8">
          <h2 className="font-semibold mb-3">Ultime ore registrate</h2>
          <div className="card divide-y divide-[var(--border)]">
            {cliente.ore.map((o) => (
              <div key={o.id} className="p-3 flex items-center justify-between text-sm">
                <span>{dataIT(o.data)}{o.persona ? ` · ${o.persona.nome}` : ""}{o.note ? ` · ${o.note}` : ""}</span>
                <b>{fmtOre(o.ore)}</b>
              </div>
            ))}
          </div>
        </section>
      )}

      <form action={eliminaCliente} className="mt-10">
        <input type="hidden" name="id" value={id} />
        <button type="submit" className="text-sm text-[var(--danger)] hover:underline">Elimina cliente</button>
      </form>
    </div>
  );
}
