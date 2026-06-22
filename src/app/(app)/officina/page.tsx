import { db } from "@/lib/db";
import { euro, dataIT, inputData } from "@/lib/format";
import { etichetta, STATO_ATTREZZO } from "@/lib/dominio";
import { Titolo, Vuoto, Stat } from "@/components/ui";
import RigaEditabile, { type Cella } from "@/components/RigaEditabile";
import { creaAttrezzo, eliminaAttrezzo } from "@/actions/officina";
import { modificaAttrezzo } from "@/actions/modifica";

export const dynamic = "force-dynamic";

export default async function OfficinaPage() {
  const attrezzi = await db.attrezzo.findMany({ orderBy: { nome: "asc" } });
  const valore = attrezzi.reduce((a, x) => a + (x.costoAcquisto ?? 0), 0);

  return (
    <div>
      <Titolo titolo="Officina" sottotitolo="Gli strumenti di lavoro" />

      <div className="grid grid-cols-2 gap-3 mb-6 max-w-md">
        <Stat etichetta="Attrezzi" valore={String(attrezzi.length)} />
        <Stat etichetta="Valore totale" valore={euro(valore)} />
      </div>

      <details className="card p-4 mb-6">
        <summary className="cursor-pointer font-medium">+ Nuovo attrezzo</summary>
        <form action={creaAttrezzo} className="grid sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="label">Nome *</label>
            <input name="nome" className="input" required />
          </div>
          <div>
            <label className="label">Costo (€)</label>
            <input name="costoAcquisto" type="number" step="0.01" className="input" />
          </div>
          <div>
            <label className="label">Data acquisto</label>
            <input name="dataAcquisto" type="date" className="input" />
          </div>
          <div>
            <label className="label">Stato</label>
            <select name="stato" className="select" defaultValue="ok">
              {STATO_ATTREZZO.map((s) => <option key={s} value={s}>{etichetta(s)}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn btn-primary">Aggiungi</button>
          </div>
        </form>
      </details>

      {attrezzi.length === 0 ? (
        <Vuoto testo="Nessun attrezzo registrato." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr><th></th><th>Attrezzo</th><th>Acquisto</th><th className="text-right">Costo</th><th>Stato</th><th></th></tr>
            </thead>
            <tbody>
              {attrezzi.map((a) => {
                const celle: Cella[] = [
                  { tipo: "testo", nome: "nome", valore: a.nome, classe: "font-medium", display: a.nome },
                  { tipo: "data", nome: "dataAcquisto", valore: inputData(a.dataAcquisto), display: a.dataAcquisto ? dataIT(a.dataAcquisto) : "—" },
                  { tipo: "numero", nome: "costoAcquisto", valore: a.costoAcquisto != null ? String(a.costoAcquisto) : "", step: "0.01", classe: "text-right", display: a.costoAcquisto ? euro(a.costoAcquisto) : "—" },
                  {
                    tipo: "select", nome: "stato", valore: a.stato, opzioni: STATO_ATTREZZO.map((s) => ({ v: s, l: etichetta(s) })),
                    display: <span className={`badge ${a.stato === "ok" ? "badge-success" : a.stato === "manutenzione" ? "badge-warning" : "badge-muted"}`}>{etichetta(a.stato)}</span>,
                  },
                  {
                    tipo: "statico", classe: "text-right",
                    nodo: (
                      <form action={eliminaAttrezzo}>
                        <input type="hidden" name="id" value={a.id} />
                        <button type="submit" className="text-xs text-[var(--danger)] hover:underline">Elimina</button>
                      </form>
                    ),
                  },
                ];
                return <RigaEditabile key={a.id} id={a.id} azione={modificaAttrezzo} celle={celle} />;
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
