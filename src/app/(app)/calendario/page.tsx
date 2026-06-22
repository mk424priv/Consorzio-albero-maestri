import Link from "next/link";
import { db } from "@/lib/db";
import { dataIT } from "@/lib/format";
import { etichetta, TIPO_COMPENSO } from "@/lib/dominio";
import { Titolo } from "@/components/ui";
import { creaLavoro, cambiaStatoLavoro } from "@/actions/lavori";

export const dynamic = "force-dynamic";

function lunedi(offsetSettimane: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const giorno = (d.getDay() + 6) % 7; // 0 = lunedì
  d.setDate(d.getDate() - giorno + offsetSettimane * 7);
  return d;
}

const NOMI_GIORNI = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  const { s } = await searchParams;
  const offset = Number(s ?? "0") || 0;
  const inizio = lunedi(offset);
  const fine = new Date(inizio.getTime() + 7 * 86_400_000);

  const [lavori, clienti, persone] = await Promise.all([
    db.lavoro.findMany({
      where: { data: { gte: inizio, lt: fine } },
      include: { cliente: true, persona: true },
      orderBy: [{ data: "asc" }, { ordineNelGiorno: "asc" }],
    }),
    db.cliente.findMany({ orderBy: [{ cognome: "asc" }] }),
    db.persona.findMany({ where: { attivo: true } }),
  ]);

  const giorni = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inizio.getTime() + i * 86_400_000);
    const lavoriGiorno = lavori.filter((l) => {
      const ld = new Date(l.data);
      return ld.getFullYear() === d.getFullYear() && ld.getMonth() === d.getMonth() && ld.getDate() === d.getDate();
    });
    return { d, lavoriGiorno };
  });

  const oggi = new Date();
  const isOggi = (d: Date) => d.toDateString() === oggi.toDateString();
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  return (
    <div>
      <Titolo
        titolo="Calendario"
        sottotitolo={`${dataIT(inizio)} — ${dataIT(new Date(fine.getTime() - 86_400_000))}`}
        azione={
          <div className="flex gap-2">
            <Link href={`/calendario?s=${offset - 1}`} className="btn">← Settimana</Link>
            {offset !== 0 && <Link href="/calendario" className="btn">Oggi</Link>}
            <Link href={`/calendario?s=${offset + 1}`} className="btn">Settimana →</Link>
          </div>
        }
      />

      <details className="card p-4 mb-6">
        <summary className="cursor-pointer font-medium">+ Nuovo lavoro</summary>
        <form action={creaLavoro} className="grid sm:grid-cols-2 gap-4 mt-4">
          <input type="hidden" name="ritorno" value={`/calendario?s=${offset}`} />
          <div>
            <label className="label">Cliente *</label>
            <select name="clienteId" className="select" required>
              <option value="">— scegli —</option>
              {clienti.map((c) => (
                <option key={c.id} value={c.id}>{c.nome} {c.cognome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Titolo *</label>
            <input name="titolo" className="input" placeholder="es. Potatura olivi" required />
          </div>
          <div>
            <label className="label">Data *</label>
            <input name="data" type="date" className="input" defaultValue={iso(oggi)} required />
          </div>
          <div>
            <label className="label">Tipo compenso</label>
            <select name="tipoCompenso" className="select" defaultValue="preventivo">
              {TIPO_COMPENSO.map((t) => <option key={t} value={t}>{etichetta(t)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Assegnato a</label>
            <select name="personaId" className="select">
              <option value="">— nessuno —</option>
              {persone.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Luogo</label>
            <input name="luogo" className="input" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn btn-primary">Aggiungi al calendario</button>
          </div>
        </form>
      </details>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
        {giorni.map(({ d, lavoriGiorno }) => (
          <div key={d.toISOString()} className={`card p-4 ${isOggi(d) ? "border-[var(--primary)]" : ""}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">
                {NOMI_GIORNI[(d.getDay() + 6) % 7]} {d.getDate()}
                {isOggi(d) && <span className="badge badge-success ml-2">Oggi</span>}
              </h3>
              <span className="text-xs text-[var(--muted)]">{lavoriGiorno.length} lavori</span>
            </div>
            {lavoriGiorno.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">—</p>
            ) : (
              <div className="grid gap-2">
                {lavoriGiorno.map((l) => (
                  <div key={l.id} className="flex items-center justify-between gap-3 rounded-lg bg-[#fafbf8] border border-[var(--border)] p-2.5">
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{l.titolo}</div>
                      <div className="text-xs text-[var(--muted)] truncate">
                        {l.cliente.nome} {l.cliente.cognome}{l.persona ? ` · ${l.persona.nome}` : ""}
                      </div>
                    </div>
                    <form action={cambiaStatoLavoro} className="shrink-0">
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="ritorno" value={`/calendario?s=${offset}`} />
                      <input type="hidden" name="stato" value={l.stato === "da_fare" ? "in_corso" : l.stato === "in_corso" ? "fatto" : "da_fare"} />
                      <button type="submit" className={`badge ${l.stato === "fatto" ? "badge-success" : l.stato === "in_corso" ? "badge-warning" : "badge-muted"}`}>
                        {etichetta(l.stato)}
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
