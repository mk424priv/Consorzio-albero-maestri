import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HandCoins, Phone, Plus, Users } from "lucide-react";
import { listaContenitore, listaElemento } from "@/lib/motion";
import { useStore } from "@/store/store";
import { useUI } from "@/store/ui";
import { libroOperatore } from "@/lib/squadra";
import { euro, ore as fmtOre } from "@/lib/format";
import { etichetta } from "@/lib/dominio";
import { ENTITA } from "@/lib/entita";
import { Avatar, Badge, Barra, Button, Cifra, Conta, EmptyState, HeroStat, LinkButton, PageHero, StatusBadge } from "@/components/ui";
import { panoramicaSpazio } from "@/lib/movimenti";

export function Squadra() {
  const db = useStore((s) => s.db);
  const apri = useUI((s) => s.apri);

  const operatori = useMemo(
    () => db.operatori.map((o) => ({ o, libro: libroOperatore(db, o.id) })).sort((a, b) => b.libro.saldo - a.libro.saldo),
    [db],
  );
  const pan = useMemo(() => panoramicaSpazio(db), [db]);
  const totDovuto = operatori.reduce((a, x) => a + x.libro.dovuto, 0);

  return (
    <div>
      <PageHero
        grad="bg-gradient-to-br from-operatore-500 via-operatore-500 to-operatore-700"
        eyebrow="Squadra"
        titolo="Chi lavora con te"
        sottotitolo="Ore, compensi e quanto resta da pagare"
        icona={<Users size={22} />}
        azione={<Button variante="glass" onClick={() => apri("operatore")} className="hidden sm:inline-flex"><Plus size={16} /> Nuovo operatore</Button>}
      >
        <div className="grid grid-cols-3 gap-2">
          <HeroStat label="Attivi" valore={<Conta valore={db.operatori.filter((o) => o.attivo).length} />} />
          <HeroStat label="Dovuto totale" valore={<Cifra valore={totDovuto} />} />
          <HeroStat label="Da pagare" valore={<Cifra valore={pan.daPagareSquadra} />} />
        </div>
      </PageHero>

      {operatori.length === 0 ? (
        <EmptyState icona={<Users size={26} />} titolo="Nessun operatore" testo="Aggiungi chi lavora con te per tracciare ore e compensi." azione={<Button variante="primary" onClick={() => apri("operatore")}><Plus size={16} /> Nuovo operatore</Button>} />
      ) : (
        <motion.div variants={listaContenitore} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {operatori.map(({ o, libro }) => (
            <motion.div key={o.id} variants={listaElemento} className="flex flex-col rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]">
              <Link to={`/operatore/${o.id}`} className="flex items-center gap-3 p-4">
                <Avatar nome={o.nome} grad={ENTITA.operatore.grad} size="lg" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold text-ink">{o.nome}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge tono="info">{etichetta(o.ruolo)}</Badge>
                    {o.tariffaOraria ? <span className="text-[0.74rem] text-muted">{euro(o.tariffaOraria)}/h</span> : null}
                  </div>
                </div>
                <StatusBadge genere="compenso" valore={libro.stato} />
              </Link>
              <div className="grid grid-cols-3 gap-2 px-4">
                {[
                  { l: "Ore", v: fmtOre(libro.ore) },
                  { l: "Dovuto", v: euro(libro.dovuto) },
                  { l: "Pagato", v: euro(libro.pagato) },
                ].map((s) => (
                  <div key={s.l} className="rounded-[11px] bg-surface-2 px-2 py-1.5 text-center">
                    <div className="text-[0.62rem] font-semibold uppercase tracking-wide text-muted">{s.l}</div>
                    <div className="text-[0.82rem] font-bold text-ink">{s.v}</div>
                  </div>
                ))}
              </div>
              <div className="px-4 pt-3">
                <Barra accent="uscita" ratio={libro.dovuto > 0 ? libro.pagato / libro.dovuto : 1} />
              </div>
              <div className="flex items-center justify-between gap-2 p-4 pt-2.5">
                {libro.saldo > 0 ? <Badge tono="warn">{euro(libro.saldo)} da pagare</Badge> : <Badge tono="success">Saldato</Badge>}
                <span className="text-[0.7rem] font-semibold text-muted">{libro.dovuto > 0 ? Math.round((libro.pagato / libro.dovuto) * 100) : 100}% saldato</span>
              </div>
              <div className="mt-auto flex items-center gap-1 border-t border-line p-2">
                <LinkButton to={`/operatore/${o.id}`} variante="soft" dim="sm" className="flex-1">Apri</LinkButton>
                <Button variante="outline" dim="sm" onClick={() => apri("compenso", { operatoreId: o.id })}><HandCoins size={15} /> Paga</Button>
                {o.telefono && <a href={`tel:${o.telefono}`} className="grid h-9 w-9 place-items-center rounded-[11px] text-muted transition hover:bg-operatore-50 hover:text-operatore-600" aria-label="Chiama"><Phone size={16} /></a>}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <div className="sm:hidden">
        <button onClick={() => apri("operatore")} className="mt-4 flex w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-operatore-100 bg-operatore-50/50 py-3 text-sm font-bold text-operatore-600">
          <Plus size={17} /> Nuovo operatore
        </button>
      </div>
    </div>
  );
}
