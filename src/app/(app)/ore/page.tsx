import { db } from "@/lib/db";
import { ore as fmtOre, euro, dataIT, meseAnnoIT } from "@/lib/format";
import { Titolo, Vuoto, LinkCliente } from "@/components/ui";
import { registraOre, generaCompensoMese } from "@/actions/ore";

export const dynamic = "force-dynamic";

export default async function OrePage({
  searchParams,
}: {
  searchParams: Promise<{ clienteId?: string }>;
}) {
  const { clienteId } = await searchParams;
  const oggi = new Date();
  const inizioMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const [clienti, persone, recenti, oreMese] = await Promise.all([
    db.cliente.findMany({ orderBy: [{ cognome: "asc" }] }),
    db.persona.findMany({ where: { attivo: true } }),
    db.registrazioneOre.findMany({ orderBy: { data: "desc" }, take: 15, include: { cliente: true, persona: true } }),
    db.registrazioneOre.findMany({ where: { data: { gte: inizioMese } }, include: { cliente: true } }),
  ]);

  // riepilogo ore del mese per cliente
  const perCliente = new Map<string, { nome: string; ore: number; tariffa: number | null }>();
  for (const r of oreMese) {
    const k = r.clienteId;
    const e = perCliente.get(k) ?? { nome: `${r.cliente.nome} ${r.cliente.cognome}`, ore: 0, tariffa: r.cliente.tariffaOraria };
    e.ore += r.ore;
    perCliente.set(k, e);
  }

  return (
    <div>
      <Titolo titolo="Ore" sottotitolo="Segna le ore giorno per giorno" />

      <div className="grid lg:grid-cols-2 gap-6">
        <section>
          <h2 className="font-semibold mb-3">Registra ore</h2>
          <form action={registraOre} className="card p-5 grid gap-4">
            <div>
              <label className="label">Cliente *</label>
              <select name="clienteId" className="select" defaultValue={clienteId ?? ""} required>
                <option value="">— scegli —</option>
                {clienti.map((c) => <option key={c.id} value={c.id}>{c.nome} {c.cognome}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Data</label>
                <input name="data" type="date" className="input" defaultValue={iso(oggi)} />
              </div>
              <div>
                <label className="label">Ore *</label>
                <input name="ore" type="number" step="0.5" className="input" placeholder="es. 3.5" required />
              </div>
            </div>
            <div>
              <label className="label">Persona</label>
              <select name="personaId" className="select">
                <option value="">— nessuno —</option>
                {persone.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Nota</label>
              <input name="note" className="input" />
            </div>
            <button type="submit" className="btn btn-primary w-fit">Salva ore</button>
          </form>
        </section>

        <section>
          <h2 className="font-semibold mb-3">Ore di {meseAnnoIT(oggi.getFullYear(), oggi.getMonth() + 1)}</h2>
          {perCliente.size === 0 ? (
            <Vuoto testo="Nessuna ora registrata questo mese." />
          ) : (
            <div className="card divide-y divide-[var(--border)]">
              {[...perCliente.entries()].map(([id, e]) => (
                <div key={id} className="p-3 flex items-center justify-between gap-3">
                  <div>
                    <LinkCliente id={id} nome={e.nome} />
                    <div className="text-xs text-[var(--muted)]">
                      {fmtOre(e.ore)}{e.tariffa ? ` × ${euro(e.tariffa)}/h = ${euro(e.ore * e.tariffa)}` : " · nessuna tariffa"}
                    </div>
                  </div>
                  {e.tariffa ? (
                    <form action={generaCompensoMese}>
                      <input type="hidden" name="clienteId" value={id} />
                      <input type="hidden" name="anno" value={oggi.getFullYear()} />
                      <input type="hidden" name="mese" value={oggi.getMonth() + 1} />
                      <button type="submit" className="btn text-xs py-1">Genera compenso</button>
                    </form>
                  ) : (
                    <span className="text-xs text-[var(--muted)]">imposta tariffa</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <h2 className="font-semibold mt-6 mb-3">Ultime registrazioni</h2>
          {recenti.length === 0 ? (
            <Vuoto testo="Ancora nulla." />
          ) : (
            <div className="card divide-y divide-[var(--border)]">
              {recenti.map((r) => (
                <div key={r.id} className="p-3 flex items-center justify-between text-sm">
                  <span>{dataIT(r.data)} · {r.cliente.nome} {r.cliente.cognome}{r.persona ? ` · ${r.persona.nome}` : ""}</span>
                  <b>{fmtOre(r.ore)}</b>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
