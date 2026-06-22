import { db } from "@/lib/db";
import { euro, dataIT, inputData, meseAnnoIT } from "@/lib/format";
import { etichetta, CATEGORIA_SPESA } from "@/lib/dominio";
import { Titolo, Vuoto, Stat } from "@/components/ui";
import RigaEditabile, { type Cella } from "@/components/RigaEditabile";
import { creaSpesa, eliminaSpesa } from "@/actions/spese";
import { modificaSpesa } from "@/actions/modifica";

export const dynamic = "force-dynamic";

export default async function SpesePage() {
  const oggi = new Date();
  const inizioMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const [spese, clienti, speseMese] = await Promise.all([
    db.spesa.findMany({ orderBy: { data: "desc" }, take: 50, include: { cliente: true } }),
    db.cliente.findMany({ orderBy: [{ cognome: "asc" }] }),
    db.spesa.findMany({ where: { data: { gte: inizioMese } } }),
  ]);
  const totaleMese = speseMese.reduce((a, s) => a + s.importo, 0);

  return (
    <div>
      <Titolo titolo="Spese" sottotitolo="Benzina, materiali e altre uscite" />

      <div className="grid grid-cols-2 gap-3 mb-6 max-w-md">
        <Stat etichetta={`Spese ${meseAnnoIT(oggi.getFullYear(), oggi.getMonth() + 1)}`} valore={euro(totaleMese)} tono="negativo" />
        <Stat etichetta="Voci registrate" valore={String(speseMese.length)} />
      </div>

      <details className="card p-4 mb-6" open>
        <summary className="cursor-pointer font-medium">+ Nuova spesa</summary>
        <form action={creaSpesa} className="grid sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="label">Categoria</label>
            <select name="categoria" className="select" defaultValue="benzina">
              {CATEGORIA_SPESA.map((c) => <option key={c} value={c}>{etichetta(c)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Importo (€) *</label>
            <input name="importo" type="number" step="0.01" className="input" required />
          </div>
          <div>
            <label className="label">Data</label>
            <input name="data" type="date" className="input" defaultValue={iso(oggi)} />
          </div>
          <div>
            <label className="label">Cliente (facoltativo)</label>
            <select name="clienteId" className="select" defaultValue="">
              <option value="">— nessuno —</option>
              {clienti.map((c) => <option key={c.id} value={c.id}>{c.nome} {c.cognome}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Descrizione</label>
            <input name="descrizione" className="input" placeholder="es. Pieno furgone" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn btn-primary">Aggiungi spesa</button>
          </div>
        </form>
      </details>

      {spese.length === 0 ? (
        <Vuoto testo="Nessuna spesa registrata." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr><th></th><th>Data</th><th>Categoria</th><th>Descrizione</th><th>Cliente</th><th className="text-right">Importo</th><th></th></tr>
            </thead>
            <tbody>
              {spese.map((s) => {
                const celle: Cella[] = [
                  { tipo: "data", nome: "data", valore: inputData(s.data), display: dataIT(s.data) },
                  { tipo: "select", nome: "categoria", valore: s.categoria, opzioni: CATEGORIA_SPESA.map((c) => ({ v: c, l: etichetta(c) })), display: etichetta(s.categoria) },
                  { tipo: "testo", nome: "descrizione", valore: s.descrizione ?? "", classe: "text-[var(--muted)]", display: s.descrizione ?? "—" },
                  { tipo: "statico", classe: "text-[var(--muted)]", nodo: s.cliente ? `${s.cliente.nome} ${s.cliente.cognome}` : "—" },
                  { tipo: "numero", nome: "importo", valore: String(s.importo), step: "0.01", classe: "text-right", display: <span className="font-medium">{euro(s.importo)}</span> },
                  {
                    tipo: "statico", classe: "text-right",
                    nodo: (
                      <form action={eliminaSpesa}>
                        <input type="hidden" name="id" value={s.id} />
                        <button type="submit" className="text-xs text-[var(--danger)] hover:underline">Elimina</button>
                      </form>
                    ),
                  },
                ];
                return <RigaEditabile key={s.id} id={s.id} azione={modificaSpesa} celle={celle} />;
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
