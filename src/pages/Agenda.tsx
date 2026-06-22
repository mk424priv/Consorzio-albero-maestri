import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Columns3,
  Hammer,
  LayoutList,
  Plus,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { listaContenitore, listaElemento, tapSoft } from "@/lib/motion";
import { useStore } from "@/store/store";
import { useUI } from "@/store/ui";
import { dataIT, euro, meseAnnoIT } from "@/lib/format";
import { etichetta, STATO_LAVORO, type StatoLavoro } from "@/lib/dominio";
import { ENTITA, STATO_LAVORO_TONO, type ChiaveEntita } from "@/lib/entita";
import { riepilogoLavoro } from "@/lib/conti";
import type { Lavoro } from "@/lib/types";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  FilterChip,
  PageHero,
  Segmented,
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

/* ----------------------- Carta del singolo lavoro -----------------------
   Compatta e tutta cliccabile: un tocco apre la scheda dedicata del lavoro.
   L'unico controllo rapido è il badge di stato (avanza lo stato).            */
function CartaLavoro({ l, mostraData = false }: { l: Lavoro; mostraData?: boolean }) {
  const db = useStore((s) => s.db);
  const apriScheda = useUI((s) => s.apriSchedaLavoro);
  const cambia = useStore((s) => s.cambiaStatoLavoro);
  const r = riepilogoLavoro(db, l.id);
  const cli = db.clienti.find((c) => c.id === l.clienteId);
  const op = db.operatori.find((o) => o.id === l.operatoreId);

  return (
    <motion.div
      whileTap={tapSoft}
      onClick={() => apriScheda(l.id)}
      className="group relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-[14px] border border-line bg-surface py-2.5 pl-3 pr-2.5 shadow-[var(--shadow-sm)] transition hover:border-lavoro-200 hover:shadow-[var(--shadow-md)]"
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", SPINA[l.stato])} />
      <div className="min-w-0 flex-1 pl-1">
        <div className="flex items-center gap-2">
          <span className="min-w-0 truncate text-sm font-bold text-ink">{l.titolo}</span>
          {r.residuo > 0 ? (
            <span className="ml-auto shrink-0 rounded-full bg-uscita-50 px-2 py-0.5 text-[0.7rem] font-bold text-uscita-600">{euro(r.residuo)}</span>
          ) : r.daPrendere > 0 ? (
            <span className="ml-auto shrink-0 rounded-full bg-entrata-50 px-2 py-0.5 text-[0.7rem] font-bold text-entrata-600">Saldato</span>
          ) : null}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.72rem] text-muted">
          <span className="truncate font-semibold text-cliente-600">{cli ? `${cli.nome} ${cli.cognome}` : "—"}</span>
          {mostraData && <span>· {dataIT(l.data)}</span>}
          {op && <span className="inline-flex items-center gap-1"><Avatar nome={op.nome} size="sm" grad={ENTITA.operatore.grad} className="!h-4 !w-4 !text-[0.5rem]" /> {op.nome}</span>}
          {(r.oreReali > 0 || r.durataPrevista != null) && (
            <span className="inline-flex items-center gap-1 text-operatore-600"><Clock size={11} /> {r.oreReali}h{r.durataPrevista != null ? `/${r.durataPrevista}` : ""}</span>
          )}
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); cambia(l.id, CICLO[l.stato]); }}
        title="Avanza stato"
        className="shrink-0"
      >
        <StatusBadge genere="lavoro" valore={l.stato} />
      </button>
      <ChevronRight size={16} className="shrink-0 text-muted/40 transition-colors group-hover:text-lavoro-400" />
    </motion.div>
  );
}

/* ----------------------------- Mini statistica ----------------------------- */
function MiniStat({ tinta, label, valore, sub }: { tinta: ChiaveEntita; label: string; valore: string; sub?: string }) {
  return (
    <div className="rounded-[12px] border border-line bg-surface px-3 py-2 shadow-[var(--shadow-sm)]">
      <div className="flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-wide text-muted">
        <span className={cn("h-1.5 w-1.5 rounded-full", ENTITA[tinta].dot)} /> {label}
      </div>
      <div className="mt-0.5 text-[0.98rem] font-extrabold leading-none text-ink">
        {valore} {sub && <span className="text-[0.7rem] font-medium text-muted">{sub}</span>}
      </div>
    </div>
  );
}

/* -------------------------------- Pagina -------------------------------- */
export function Agenda() {
  const db = useStore((s) => s.db);
  const apri = useUI((s) => s.apri);

  const [vista, setVista] = useState<Vista>("settimana");
  const [offset, setOffset] = useState(0);
  const [meseOff, setMeseOff] = useState(0);
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
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: meseAnnoIT(d.getFullYear(), d.getMonth() + 1) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meseOff]);

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

      <Segmented voci={VISTE} attivo={vista} onChange={(k) => setVista(k as Vista)} className="mb-3" />

      <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <FilterChip attivo={opFiltro === "tutti"} onClick={() => setOpFiltro("tutti")}>Tutta la squadra</FilterChip>
        {db.operatori.filter((o) => o.attivo).map((o) => (
          <FilterChip key={o.id} attivo={opFiltro === o.id} onClick={() => setOpFiltro(o.id)}>{o.nome}</FilterChip>
        ))}
      </div>

      {/* riepilogo compatto del periodo (secondario rispetto ai lavori) */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat tinta="lavoro" label="Lavori" valore={String(stat.totale)} sub={`${stat.daFare}·${stat.inCorso}·${stat.fatti}`} />
        <MiniStat tinta="operatore" label="Ore" valore={`${stat.oreReali} h`} sub={stat.orePrev > 0 ? `/ ${stat.orePrev}h` : undefined} />
        <MiniStat tinta="uscita" label="Da incassare" valore={euro(stat.residuo)} />
        <MiniStat tinta="entrata" label="Incassato" valore={euro(stat.incassato)} />
      </div>

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
