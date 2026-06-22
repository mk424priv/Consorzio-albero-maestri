import Link from "next/link";
import { db } from "@/lib/db";
import { cruscotto } from "@/lib/conti";
import { euro, dataIT, meseAnnoIT } from "@/lib/format";
import { etichetta } from "@/lib/dominio";
import { Titolo, Stat, Vuoto, LinkCliente } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Cruscotto() {
  const oggi = new Date();
  const inizioMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1);
  const c = await cruscotto(inizioMese, oggi);

  const inizioGiorno = new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate());
  const fineGiorno = new Date(inizioGiorno.getTime() + 86_400_000 - 1);
  const lavoriOggi = await db.lavoro.findMany({
    where: { data: { gte: inizioGiorno, lte: fineGiorno } },
    include: { cliente: true, persona: true },
    orderBy: [{ ordineNelGiorno: "asc" }, { data: "asc" }],
  });

  return (
    <div>
      <Titolo
        titolo="Cruscotto"
        sottotitolo={`Quadro di ${meseAnnoIT(oggi.getFullYear(), oggi.getMonth() + 1)}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <Stat etichetta="Incassato (mese)" valore={euro(c.incassato)} tono="positivo" />
        <Stat etichetta="Speso (mese)" valore={euro(c.speso)} tono="negativo" />
        <Stat
          etichetta="Quanto resta"
          valore={euro(c.resta)}
          tono={c.resta >= 0 ? "positivo" : "negativo"}
          nota="Incassato − speso"
        />
        <Stat etichetta="Da incassare" valore={euro(c.daIncassare)} nota="Totale aperto" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Lavori di oggi</h2>
            <Link href="/calendario" className="text-sm text-[var(--primary)] hover:underline">Calendario →</Link>
          </div>
          {lavoriOggi.length === 0 ? (
            <Vuoto testo="Nessun lavoro programmato per oggi." />
          ) : (
            <div className="card divide-y divide-[var(--border)]">
              {lavoriOggi.map((l) => (
                <div key={l.id} className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{l.titolo}</div>
                    <div className="text-sm text-[var(--muted)] truncate">
                      {l.cliente.nome} {l.cliente.cognome}
                      {l.luogo ? ` · ${l.luogo}` : ""}
                      {l.persona ? ` · ${l.persona.nome}` : ""}
                    </div>
                  </div>
                  <span className={`badge ${l.stato === "fatto" ? "badge-success" : l.stato === "in_corso" ? "badge-warning" : "badge-muted"}`}>
                    {etichetta(l.stato)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Chi deve pagare</h2>
            <Link href="/pagamenti" className="text-sm text-[var(--primary)] hover:underline">Pagamenti →</Link>
          </div>
          {c.debitori.length === 0 ? (
            <Vuoto testo="Nessun pagamento in sospeso. Tutto incassato!" />
          ) : (
            <div className="card divide-y divide-[var(--border)]">
              {c.debitori.map((d) => (
                <div key={d.id} className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <LinkCliente id={d.id} nome={d.nome} />
                    {d.giorniRitardoMax > 0 && (
                      <div className="text-xs text-[var(--danger)]">In ritardo da {d.giorniRitardoMax} giorni</div>
                    )}
                  </div>
                  <span className="font-medium">{euro(d.saldo)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <p className="text-xs text-[var(--muted)] mt-8">Aggiornato al {dataIT(oggi)}.</p>
    </div>
  );
}
