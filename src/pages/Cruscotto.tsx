import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Coins,
  Hourglass,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useStore } from "@/store/store";
import { cruscotto } from "@/lib/conti";
import { dataIT, euro, meseAnnoIT } from "@/lib/format";
import { Badge, Card, EmptyState, LinkCliente, PageHeader, Stat } from "@/components/ui";
import { BadgeLavoro } from "@/components/ui";

export function Cruscotto() {
  const db = useStore((s) => s.db);

  const { c, lavoriOggi, oggi } = useMemo(() => {
    const oggi = new Date();
    const inizioMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1);
    const c = cruscotto(db, inizioMese, oggi);
    const oggiKey = oggi.toDateString();
    const lavoriOggi = db.lavori
      .filter((l) => new Date(l.data).toDateString() === oggiKey)
      .sort((a, b) => (a.ordineNelGiorno ?? 99) - (b.ordineNelGiorno ?? 99));
    return { c, lavoriOggi, oggi };
  }, [db]);

  const nomeCliente = (id: string) => {
    const cl = db.clienti.find((x) => x.id === id);
    return cl ? `${cl.nome} ${cl.cognome}` : "—";
  };
  const persona = (id?: string | null) => db.persone.find((p) => p.id === id)?.nome;

  return (
    <div>
      <PageHeader
        titolo="Cruscotto"
        sottotitolo={`Quadro di ${meseAnnoIT(oggi.getFullYear(), oggi.getMonth() + 1)}`}
        icona={<TrendingUp size={22} />}
      />

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat etichetta="Incassato (mese)" valore={euro(c.incassato)} tono="positivo" icona={<TrendingUp size={16} />} />
        <Stat etichetta="Speso (mese)" valore={euro(c.speso)} tono="negativo" icona={<TrendingDown size={16} />} />
        <Stat
          etichetta="Quanto resta"
          valore={euro(c.resta)}
          tono={c.resta >= 0 ? "positivo" : "negativo"}
          nota="Incassato − speso"
          icona={<Coins size={16} />}
        />
        <Stat etichetta="Da incassare" valore={euro(c.daIncassare)} tono="brand" nota="Totale aperto" icona={<Hourglass size={16} />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-ink">
              <CalendarDays size={17} className="text-brand-500" /> Lavori di oggi
            </h2>
            <Link to="/calendario" className="link-brand flex items-center gap-1 text-sm">
              Calendario <ArrowRight size={14} />
            </Link>
          </div>
          {lavoriOggi.length === 0 ? (
            <EmptyState icona={<CalendarDays size={24} />} testo="Nessun lavoro programmato per oggi." />
          ) : (
            <Card className="divide-y divide-line overflow-hidden">
              {lavoriOggi.map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-3 p-3.5 transition hover:bg-brand-50/50">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-ink">{l.titolo}</div>
                    <div className="truncate text-sm text-muted">
                      {nomeCliente(l.clienteId)}
                      {l.luogo ? ` · ${l.luogo}` : ""}
                      {persona(l.personaId) ? ` · ${persona(l.personaId)}` : ""}
                    </div>
                  </div>
                  <BadgeLavoro stato={l.stato} />
                </div>
              ))}
            </Card>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-ink">
              <Wallet size={17} className="text-brand-500" /> Chi deve pagare
            </h2>
            <Link to="/pagamenti" className="link-brand flex items-center gap-1 text-sm">
              Pagamenti <ArrowRight size={14} />
            </Link>
          </div>
          {c.debitori.length === 0 ? (
            <EmptyState icona={<Wallet size={24} />} testo="Nessun pagamento in sospeso. Tutto incassato!" />
          ) : (
            <Card className="divide-y divide-line overflow-hidden">
              {c.debitori.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-3 p-3.5 transition hover:bg-brand-50/50">
                  <div className="min-w-0">
                    <LinkCliente id={d.id} nome={d.nome} />
                    {d.giorniRitardoMax > 0 && (
                      <div className="mt-0.5">
                        <Badge tono="danger">In ritardo da {d.giorniRitardoMax} giorni</Badge>
                      </div>
                    )}
                  </div>
                  <span className="font-semibold text-ink">{euro(d.saldo)}</span>
                </div>
              ))}
            </Card>
          )}
        </section>
      </div>

      <p className="mt-8 text-xs text-muted">Aggiornato al {dataIT(oggi)}.</p>
    </div>
  );
}
