import Link from "next/link";
import { db } from "@/lib/db";
import { creaPreventivo } from "@/actions/preventivi";
import { TIPO_PREVENTIVO, etichetta } from "@/lib/dominio";
import { Titolo } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NuovoPreventivo({
  searchParams,
}: {
  searchParams: Promise<{ clienteId?: string }>;
}) {
  const { clienteId } = await searchParams;
  const clienti = await db.cliente.findMany({ orderBy: [{ cognome: "asc" }] });
  const oggi = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  return (
    <div>
      <Titolo
        titolo="Nuovo preventivo"
        sottotitolo="Genera i pagamenti attesi"
        azione={<Link href="/preventivi" className="btn">← Preventivi</Link>}
      />
      <form action={creaPreventivo} className="card p-6 grid gap-4 max-w-2xl">
        <div>
          <label className="label">Cliente *</label>
          <select name="clienteId" className="select" defaultValue={clienteId ?? ""} required>
            <option value="">— scegli —</option>
            {clienti.map((c) => (
              <option key={c.id} value={c.id}>{c.nome} {c.cognome}</option>
            ))}
          </select>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Tipo *</label>
            <select name="tipo" className="select" defaultValue="unico">
              {TIPO_PREVENTIVO.map((t) => <option key={t} value={t}>{etichetta(t)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Importo totale (€) *</label>
            <input name="importoTotale" type="number" step="0.01" className="input" required />
          </div>
        </div>
        <div>
          <label className="label">Acconto (€) — solo per “acconto + saldo”</label>
          <input name="importoAcconto" type="number" step="0.01" className="input" placeholder="vuoto = metà" />
          <p className="text-xs text-[var(--muted)] mt-1">Il saldo è calcolato come totale − acconto.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Data emissione</label>
            <input name="dataEmissione" type="date" className="input" defaultValue={iso(oggi)} />
          </div>
          <div>
            <label className="label">Scadenza incasso</label>
            <input name="dataScadenza" type="date" className="input" />
          </div>
        </div>
        <div>
          <label className="label">Note</label>
          <textarea name="note" className="textarea" rows={2} />
        </div>
        <button type="submit" className="btn btn-primary w-fit">Crea preventivo</button>
      </form>
    </div>
  );
}
