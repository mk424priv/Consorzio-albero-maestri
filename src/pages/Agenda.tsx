import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Banknote,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Columns3,
  Hammer,
  Hourglass,
  LayoutList,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  TrendingUp,
  User,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { listaContenitore, listaElemento } from "@/lib/motion";
import { useStore } from "@/store/store";
import { useUI } from "@/store/ui";
import { dataIT, euro, meseAnnoIT, ore as fmtOre } from "@/lib/format";
import { etichetta, STATO_LAVORO, type StatoLavoro } from "@/lib/dominio";
import { ENTITA, STATO_LAVORO_TONO } from "@/lib/entita";
import { riepilogoLavoro } from "@/lib/conti";
import type { Lavoro } from "@/lib/types";
import {
  Avatar,
  Badge,
  Barra,
  Button,
  Card,
  Cifra,
  Conta,
  EmptyState,
  FilterChip,
  Menu,
  PageHero,
  Segmented,
  StatCard,
  StatusBadge,
} from "@/components/ui";

const NOMI = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];
const CICLO = { da_fare: "in_corso", in_corso: "fatto", fatto: "da_fare" } as const;

function lunedi(offset: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7);
  return d;
}
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

type Vista = "settimana" | "bacheca" | "lista";

const VISTE = [
  { k: "settimana", label: "Settimana", icona: <CalendarDays size={15} /> },
  { k: "bacheca", label: "Bacheca", icona: <Columns3 size={15} /> },
  { k: "lista", label: "Elenco", icona: <LayoutList size={15} /> },
];

// Spina colorata laterale in base allo stato del lavoro.
const SPINA: Record<StatoLavoro, string> = {
  da_fare: "bg-line-strong",
  in_corso: "bg-warn",
  fatto: "bg-success",
};

/* ----------------------- Carta del singolo lavoro ----------------------- */
function CartaLavoro({ l, mostraData = false }: { l: Lavoro; mostraData?: boolean }) {
  const db = useStore((s) => s.db);
  const apri = useUI((s) => s.apri);
  const cambia = useStore((s) => s.cambiaStatoLavoro);
  const elimina = useStore((s) => s.eliminaLavoro);
  const chiediConferma = useUI((s) => s.chiediConferma);
  const navigate = useNavigate();

  const r = riepilogoLavoro(db, l.id);
  const cli = db.clienti.find((c) => c.id === l.clienteId);
  const op = db.operatori.find((o) => o.id === l.operatoreId);
  const haSoldi = r.daPrendere > 0 || r.incassato > 0;
  const ratio = r.daPrendere > 0 ? r.incassato / r.daPrendere : l.stato === "fatto" ? 1 : 0;

  function riscuoti() {
    if (r.pagamentoApertoId) apri("riscuoti", { pagamentoId: r.pagamentoApertoId });
    else apri("incasso", { clienteId: l.clienteId, lavoroId: l.id });
  }

  return (
    <div className="group relative overflow-hidden rounded-[14px] border border-line bg-surface p-3 shadow-[var(--shadow-sm)] transition hover:shadow-[var(--shadow-md)]">
      <span className={cn("absolute inset-y-0 left-0 w-1", SPINA[l.stato])} />
      <div className="flex items-start gap-2.5 pl-1">
        <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-[11px]", ENTITA.lavoro.soft)}>
          <Hammer size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <button onClick={() => apri("lavoro", { id: l.id })} className="min-w-0 truncate text-left text-sm font-bold text-ink hover:text-lavoro-600">
              {l.titolo}
            </button>
            <Menu
              trigger={<button className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] text-muted hover:bg-canvas"><MoreVertical size={16} /></button>}
              voci={[
                { label: "Apri cliente", icona: <User size={15} />, onClick: () => navigate(`/cliente/${l.clienteId}`) },
                { label: "Registra ore", icona: <Clock size={15} />, onClick: () => apri("ore", { clienteId: l.clienteId, operatoreId: l.operatoreId ?? undefined, lavoroId: l.id, data: l.data }) },
                { label: "Incassa", icona: <Banknote size={15} />, onClick: riscuoti },
                { label: "Modifica", icona: <Pencil size={15} />, onClick: () => apri("lavoro", { id: l.id }) },
                { label: "Elimina", icona: <Trash2 size={15} />, pericolo: true, separa: true, onClick: () => chiediConferma({ titolo: "Eliminare il lavoro?", descrizione: l.titolo, pericolo: true, testoConferma: "Elimina", onConfirm: () => elimina(l.id) }) },
              ]}
            />
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.72rem] text-muted">
            <button onClick={() => navigate(`/cliente/${l.clienteId}`)} className="truncate font-semibold text-cliente-600 hover:underline">
              {cli ? `${cli.nome} ${cli.cognome}` : "—"}
            </button>
            {mostraData && <span>· {dataIT(l.data)}</span>}
            {op && <span className="inline-flex items-center gap-1"><Avatar nome={op.nome} size="sm" grad={ENTITA.operatore.grad} className="!h-4 !w-4 !text-[0.5rem]" /> {op.nome}</span>}
          </div>
        </div>
      </div>

      {/* chip caratteristiche */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-1">
        <span className="inline-flex items-center gap-1 rounded-full bg-lavoro-50 px-2 py-0.5 text-[0.66rem] font-semibold text-lavoro-600">{etichetta(l.tipoCompenso)}</span>
        {(r.oreReali > 0 || r.durataPrevista != null) && (
          <span className="inline-flex items-center gap-1 rounded-full bg-operatore-50 px-2 py-0.5 text-[0.66rem] font-semibold text-operatore-600">
            <Clock size={11} /> {r.oreReali}h{r.durataPrevista != null ? ` / ${r.durataPrevista}h` : ""}
          </span>
        )}
        {r.spese > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-spesa-50 px-2 py-0.5 text-[0.66rem] font-semibold text-spesa-600">spese {euro(r.spese)}</span>
        )}
      </div>

      {/* blocco economico */}
      {haSoldi && (
        <div className="mt-2 ml-1 rounded-[11px] bg-surface-2 p-2">
          <div className="flex items-center justify-between text-[0.7rem]">
            <span className="font-semibold uppercase tracking-wide text-muted">Da prendere</span>
            <span className="font-display text-[0.9rem] font-bold text-ink">{euro(r.daPrendere)}</span>
          </div>
          <Barra ratio={ratio} accent="entrata" className="my-1.5" />
          <div className="flex items-center justify-between text-[0.7rem] font-semibold">
            <span className="text-entrata-600">Incassato {euro(r.incassato)}</span>
            {r.residuo > 0 ? <span className="text-uscita-600">Resta {euro(r.residuo)}</span> : <span className="text-success">Saldato ✓</span>}
          </div>
        </div>
      )}

      {/* azioni */}
      <div className="mt-2 flex items-center gap-2 pl-1">
        <button onClick={() => cambia(l.id, CICLO[l.stato])} title="Cambia stato"><StatusBadge genere="lavoro" valore={l.stato} /></button>
        <div className="ml-auto flex items-center gap-1.5">
          {r.residuo > 0 && (
            <Button variante="soft" dim="sm" onClick={riscuoti}><Banknote size={14} /> Incassa</Button>
          )}
          <Button dim="sm" onClick={() => apri("ore", { clienteId: l.clienteId, operatoreId: l.operatoreId ?? undefined, lavoroId: l.id, data: l.data })}><Clock size={14} /></Button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- Pagina -------------------------------- */
export function Agenda() {
  const db = useStore((s) => s.db);
  const apri = useUI((s) => s.apri);

  const [vista, setVista] = useState<Vista>("settimana");
  const [offset, setOffset] = useState(0); // settimana
  const [meseOff, setMeseOff] = useState(0); // bacheca/lista
  const [tutto, setTutto] = useState(false);
  const [opFiltro, setOpFiltro] = useState<string>("tutti");
  const [statoFiltro, setStatoFiltro] = useState<StatoLavoro | "tutti">("tutti");

  const oggi = new Date();

  const settimana = useMemo(() => {
    const inizio = lunedi(offset);
    const fine = new Date(inizio.getTime() + 6 * 86_400_000);
    return { inizio, fine, wIniz: iso(inizio), wFine: iso(fine) };
  }, [offset]);

  const mese = useMemo(() => {
    const d = new Date(oggi.getFullYear(), oggi.getMonth() + meseOff, 1);
    return { anno: d.getFullYear(), mese: d.getMonth() + 1, key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: meseAnnoIT(d.getFullYear(), d.getMonth() + 1) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meseOff]);

  // Lavori nello scope corrente (periodo + operatore).
  const lavoriScope = useMemo(() => {
    return db.lavori
      .filter((l) => {
        if (opFiltro !== "tutti" && l.operatoreId !== opFiltro) return false;
        const d = l.data.slice(0, 10);
        if (vista === "settimana") return d >= settimana.wIniz && d <= settimana.wFine;
        if (tutto) return true;
        return d.slice(0, 7) === mese.key;
      })
      .sort((a, b) => b.data.localeCompare(a.data) || (a.ordineNelGiorno ?? 99) - (b.ordineNelGiorno ?? 99));
  }, [db.lavori, opFiltro, vista, settimana, tutto, mese.key]);

  // Aggregati del periodo.
  const stat = useMemo(() => {
    let daFare = 0, inCorso = 0, fatti = 0, oreReali = 0, orePrev = 0, daPrendere = 0, incassato = 0, residuo = 0, margine = 0;
    for (const l of lavoriScope) {
      if (l.stato === "da_fare") daFare++; else if (l.stato === "in_corso") inCorso++; else fatti++;
      const r = riepilogoLavoro(db, l.id);
      oreReali += r.oreReali; orePrev += r.durataPrevista ?? 0;
      daPrendere += r.daPrendere; incassato += r.incassato; residuo += r.residuo; margine += r.margine;
    }
    return { totale: lavoriScope.length, daFare, inCorso, fatti, oreReali, orePrev, daPrendere, incassato, residuo, margine };
  }, [lavoriScope, db]);

  // Vista settimana: 7 giorni con i loro lavori.
  const giorni = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(settimana.inizio.getTime() + i * 86_400_000);
      const key = iso(d);
      const lavori = lavoriScope.filter((l) => l.data.slice(0, 10) === key).sort((a, b) => (a.ordineNelGiorno ?? 99) - (b.ordineNelGiorno ?? 99));
      return { d, lavori };
    });
  }, [settimana, lavoriScope]);

  const isOggi = (d: Date) => d.toDateString() === oggi.toDateString();
  const titolo = vista === "settimana" ? "La settimana" : vista === "bacheca" ? "Bacheca lavori" : "Elenco lavori";
  const sottotitolo = vista === "settimana" ? `${dataIT(settimana.inizio)} — ${dataIT(settimana.fine)}` : tutto ? "Tutti i periodi" : mese.label;

  const navPeriodo = vista === "settimana" ? (
    <div className="flex items-center gap-1 rounded-[11px] bg-white/12 p-1 backdrop-blur">
      <button onClick={() => setOffset((o) => o - 1)} aria-label="Settimana precedente" className="grid h-8 w-8 place-items-center rounded-[8px] text-white/80 transition hover:bg-white/20"><ChevronLeft size={16} /></button>
      {offset !== 0 && <button onClick={() => setOffset(0)} className="rounded-[8px] px-2 text-[0.78rem] font-bold text-white transition hover:bg-white/20">Oggi</button>}
      <button onClick={() => setOffset((o) => o + 1)} aria-label="Settimana successiva" className="grid h-8 w-8 place-items-center rounded-[8px] text-white/80 transition hover:bg-white/20"><ChevronRight size={16} /></button>
    </div>
  ) : (
    <div className="flex items-center gap-1 rounded-[11px] bg-white/12 p-1 backdrop-blur">
      <button onClick={() => { setTutto(false); setMeseOff((o) => o - 1); }} aria-label="Mese precedente" className="grid h-8 w-8 place-items-center rounded-[8px] text-white/80 transition hover:bg-white/20"><ChevronLeft size={16} /></button>
      <button onClick={() => setTutto((t) => !t)} className={cn("rounded-[8px] px-2 text-[0.78rem] font-bold text-white transition hover:bg-white/20", tutto && "bg-white/25")}>Tutti</button>
      <button onClick={() => { setTutto(false); setMeseOff((o) => o + 1); }} aria-label="Mese successivo" className="grid h-8 w-8 place-items-center rounded-[8px] text-white/80 transition hover:bg-white/20"><ChevronRight size={16} /></button>
    </div>
  );

  return (
    <div>
      <PageHero
        grad="bg-gradient-to-br from-lavoro-500 via-lavoro-500 to-lavoro-700"
        eyebrow="Agenda"
        titolo={titolo}
        sottotitolo={sottotitolo}
        icona={<CalendarDays size={22} />}
        azione={
          <div className="flex items-center gap-1.5">
            {navPeriodo}
            <Button variante="glass" onClick={() => apri("lavoro", { data: iso(oggi) })} className="hidden sm:inline-flex"><Plus size={16} /> Lavoro</Button>
          </div>
        }
      />

      {/* selettore vista */}
      <Segmented voci={VISTE} attivo={vista} onChange={(k) => setVista(k as Vista)} className="mb-3" />

      {/* filtri operatore */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <FilterChip attivo={opFiltro === "tutti"} onClick={() => setOpFiltro("tutti")}>Tutta la squadra</FilterChip>
        {db.operatori.filter((o) => o.attivo).map((o) => (
          <FilterChip key={o.id} attivo={opFiltro === o.id} onClick={() => setOpFiltro(o.id)}>{o.nome}</FilterChip>
        ))}
      </div>

      {/* fascia statistiche del periodo — ogni dato la sua forma */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard accent="lavoro" label="Lavori" valore={<Conta valore={stat.totale} />} icona={<Hammer size={15} />} ratio={stat.totale > 0 ? stat.fatti / stat.totale : 0} nota={`${stat.daFare} da fare · ${stat.inCorso} in corso · ${stat.fatti} fatti`} />
        <StatCard accent="operatore" label="Ore" valore={<Conta valore={stat.oreReali} suffix=" h" />} icona={<Clock size={15} />} nota={stat.orePrev > 0 ? `${fmtOre(stat.orePrev)} previste` : "nessuna stima"} />
        <StatCard accent="uscita" label="Da incassare" valore={<Cifra valore={stat.residuo} />} icona={<Hourglass size={15} />} nota={stat.residuo > 0 ? "ancora aperto" : "tutto saldato"} />
        <StatCard accent="entrata" label="Incassato" valore={<Cifra valore={stat.incassato} />} icona={<Banknote size={15} />} ratio={stat.daPrendere > 0 ? stat.incassato / stat.daPrendere : 0} nota={`su ${euro(stat.daPrendere)} attesi`} />
      </div>

      {/* corpo della vista */}
      {vista === "settimana" && <VistaSettimana giorni={giorni} isOggi={isOggi} />}
      {vista === "bacheca" && <VistaBacheca lavori={lavoriScope} />}
      {vista === "lista" && <VistaLista lavori={lavoriScope} statoFiltro={statoFiltro} setStatoFiltro={setStatoFiltro} margine={stat.margine} />}
    </div>
  );
}

/* ----------------------------- Vista settimana ----------------------------- */
function VistaSettimana({ giorni, isOggi }: { giorni: { d: Date; lavori: Lavoro[] }[]; isOggi: (d: Date) => boolean }) {
  const db = useStore((s) => s.db);
  const apri = useUI((s) => s.apri);
  return (
    <motion.div variants={listaContenitore} initial="hidden" animate="show" className="grid gap-3 lg:grid-cols-2">
      {giorni.map(({ d, lavori }) => {
        const residuoGiorno = lavori.reduce((a, l) => a + riepilogoLavoro(db, l.id).residuo, 0);
        return (
          <motion.div key={d.toISOString()} variants={listaElemento}>
            <Card className={cn("overflow-hidden", isOggi(d) && "ring-2 ring-brand-300")}>
              <div className="flex items-center justify-between border-b border-line bg-surface-2 px-4 py-2.5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
                  <span className={cn("grid h-8 w-8 place-items-center rounded-[10px] text-[0.7rem]", isOggi(d) ? "bg-brand-500 text-white" : "bg-surface text-muted")}>{d.getDate()}</span>
                  {NOMI[(d.getDay() + 6) % 7]}
                </h3>
                <div className="flex items-center gap-2">
                  {residuoGiorno > 0 && <span className="rounded-full bg-uscita-50 px-2 py-0.5 text-[0.66rem] font-bold text-uscita-600">{euro(residuoGiorno)}</span>}
                  <button onClick={() => apri("lavoro", { data: iso(d) })} className="grid h-7 w-7 place-items-center rounded-[9px] text-muted transition hover:bg-brand-50 hover:text-brand-600"><Plus size={16} /></button>
                </div>
              </div>
              {lavori.length === 0 ? (
                <p className="px-4 py-4 text-sm text-muted">Niente in programma.</p>
              ) : (
                <div className="grid gap-2 p-2.5">
                  {lavori.map((l) => <CartaLavoro key={l.id} l={l} />)}
                </div>
              )}
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

/* ------------------------------ Vista bacheca ------------------------------ */
function VistaBacheca({ lavori }: { lavori: Lavoro[] }) {
  const db = useStore((s) => s.db);
  const apri = useUI((s) => s.apri);
  const colonne: { k: StatoLavoro; label: string }[] = [
    { k: "da_fare", label: "Da fare" },
    { k: "in_corso", label: "In corso" },
    { k: "fatto", label: "Fatti" },
  ];
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {colonne.map((col) => {
        const items = lavori.filter((l) => l.stato === col.k);
        const residuo = items.reduce((a, l) => a + riepilogoLavoro(db, l.id).residuo, 0);
        return (
          <div key={col.k} className="flex flex-col rounded-[16px] border border-line bg-surface-2/60 p-2.5">
            <div className="mb-2 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", SPINA[col.k])} />
                <span className="text-sm font-bold text-ink">{col.label}</span>
                <Badge tono={STATO_LAVORO_TONO[col.k]}>{items.length}</Badge>
              </div>
              {col.k === "da_fare" && (
                <button onClick={() => apri("lavoro", { data: iso(new Date()) })} className="grid h-7 w-7 place-items-center rounded-[9px] text-muted transition hover:bg-surface hover:text-brand-600"><Plus size={16} /></button>
              )}
            </div>
            {residuo > 0 && <div className="mb-2 px-1 text-[0.7rem] font-semibold text-uscita-600">Da incassare {euro(residuo)}</div>}
            {items.length === 0 ? (
              <p className="px-1 py-6 text-center text-[0.78rem] text-muted">Vuoto</p>
            ) : (
              <motion.div variants={listaContenitore} initial="hidden" animate="show" className="grid gap-2">
                {items.map((l) => <motion.div key={l.id} variants={listaElemento}><CartaLavoro l={l} mostraData /></motion.div>)}
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------- Vista lista ------------------------------- */
function VistaLista({ lavori, statoFiltro, setStatoFiltro, margine }: {
  lavori: Lavoro[];
  statoFiltro: StatoLavoro | "tutti";
  setStatoFiltro: (s: StatoLavoro | "tutti") => void;
  margine: number;
}) {
  const filtrati = statoFiltro === "tutti" ? lavori : lavori.filter((l) => l.stato === statoFiltro);
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <FilterChip attivo={statoFiltro === "tutti"} onClick={() => setStatoFiltro("tutti")}>Tutti</FilterChip>
        {STATO_LAVORO.map((s) => (
          <FilterChip key={s} attivo={statoFiltro === s} onClick={() => setStatoFiltro(s)}>{etichetta(s)}</FilterChip>
        ))}
        <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-[0.74rem] font-semibold text-ink-soft">
          <TrendingUp size={13} className={margine >= 0 ? "text-entrata-500" : "text-spesa-500"} /> Margine {euro(margine)}
        </span>
      </div>
      {filtrati.length === 0 ? (
        <EmptyState icona={<Hammer size={24} />} testo="Nessun lavoro in questo periodo." />
      ) : (
        <motion.div variants={listaContenitore} initial="hidden" animate="show" className="grid gap-2.5 lg:grid-cols-2">
          {filtrati.map((l) => <motion.div key={l.id} variants={listaElemento}><CartaLavoro l={l} mostraData /></motion.div>)}
        </motion.div>
      )}
    </div>
  );
}
