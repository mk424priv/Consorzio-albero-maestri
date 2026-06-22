import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Banknote,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Columns3,
  Hammer,
  LayoutList,
  Play,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { listaContenitore, listaElemento, tapSoft } from "@/lib/motion";
import { useStore } from "@/store/store";
import { useUI } from "@/store/ui";
import { dataIT, euro, meseAnnoIT } from "@/lib/format";
import { etichetta, STATO_LAVORO, type StatoLavoro } from "@/lib/dominio";
import { ENTITA, STATO_LAVORO_TONO } from "@/lib/entita";
import { riepilogoLavoro } from "@/lib/conti";
import type { Lavoro } from "@/lib/types";
import { Avatar, Badge, Barra, Button, Card, EmptyState, FilterChip, PageHero, Segmented } from "@/components/ui";

const NOMI = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

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

/* =========================================================================
   CARTA LAVORO — il cuore di tutto. Tutta cliccabile (apre lo schermo del
   lavoro). Mostra a colpo d'occhio cliente, squadra, ore e soldi, e propone
   sempre la "prossima mossa" giusta in base allo stato.
   ========================================================================= */
function CartaLavoro({ l, mostraData = false }: { l: Lavoro; mostraData?: boolean }) {
  const db = useStore((s) => s.db);
  const cambia = useStore((s) => s.cambiaStatoLavoro);
  const apriScheda = useUI((s) => s.apriSchedaLavoro);
  const apri = useUI((s) => s.apri);
  const r = riepilogoLavoro(db, l.id);
  const cli = db.clienti.find((c) => c.id === l.clienteId);
  const op = db.operatori.find((o) => o.id === l.operatoreId);

  function riscuoti() {
    if (r.pagamentoApertoId) apri("riscuoti", { pagamentoId: r.pagamentoApertoId });
    else apri("incasso", { clienteId: l.clienteId, lavoroId: l.id });
  }

  // La "prossima mossa": un'unica azione chiara, contestuale allo stato.
  const mossa =
    l.stato === "da_fare"
      ? { label: "Inizia", Icon: Play, cls: "bg-lavoro-500 text-white hover:bg-lavoro-600", run: () => cambia(l.id, "in_corso") }
      : l.stato === "in_corso"
        ? { label: "Completa", Icon: Check, cls: "bg-success text-white hover:brightness-95", run: () => cambia(l.id, "fatto") }
        : l.stato === "fatto" && r.residuo > 0
          ? { label: `Incassa ${euro(r.residuo)}`, Icon: Banknote, cls: "bg-entrata-500 text-white hover:bg-entrata-600", run: riscuoti }
          : null;

  // Barra di avanzamento contestuale: ore (in corso) o incasso (fatto).
  const prog =
    l.stato === "in_corso" && r.durataPrevista && r.durataPrevista > 0
      ? { ratio: r.oreReali / r.durataPrevista, accent: "operatore" as const, label: `${r.oreReali}/${r.durataPrevista} h` }
      : l.stato === "fatto" && r.daPrendere > 0
        ? { ratio: r.incassato / r.daPrendere, accent: "entrata" as const, label: r.residuo > 0 ? `${euro(r.incassato)} / ${euro(r.daPrendere)}` : "Saldato" }
        : null;

  return (
    <motion.div
      whileTap={tapSoft}
      onClick={() => apriScheda(l.id)}
      className="group relative cursor-pointer overflow-hidden rounded-[15px] border border-line bg-surface p-3 pl-3.5 shadow-[var(--shadow-sm)] transition hover:border-lavoro-200 hover:shadow-[var(--shadow-md)]"
    >
      <span className={cn("absolute inset-y-0 left-0 w-1.5", SPINA[l.stato])} />

      {/* riga 1 — titolo + stato soldi */}
      <div className="flex items-start gap-2">
        <h4 className="min-w-0 flex-1 truncate text-[0.92rem] font-bold leading-snug text-ink">{l.titolo}</h4>
        {r.residuo > 0 ? (
          <span className="shrink-0 rounded-full bg-uscita-50 px-2 py-0.5 text-[0.7rem] font-bold text-uscita-600">{euro(r.residuo)}</span>
        ) : r.daPrendere > 0 ? (
          <span className="shrink-0 rounded-full bg-entrata-50 px-2 py-0.5 text-[0.7rem] font-bold text-entrata-600">Saldato</span>
        ) : null}
      </div>

      {/* riga 2 — chi / quando / ore */}
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.72rem] text-muted">
        <span className="truncate font-semibold text-cliente-600">{cli ? `${cli.nome} ${cli.cognome}` : "—"}</span>
        {mostraData && <span>· {dataIT(l.data)}</span>}
        {op && <span className="inline-flex items-center gap-1"><Avatar nome={op.nome} size="sm" grad={ENTITA.operatore.grad} className="!h-4 !w-4 !text-[0.5rem]" /> {op.nome}</span>}
        {(r.oreReali > 0 || r.durataPrevista != null) && (
          <span className="inline-flex items-center gap-1 text-operatore-600"><Clock size={11} /> {r.oreReali}h{r.durataPrevista != null ? `/${r.durataPrevista}` : ""}</span>
        )}
      </div>

      {/* riga 3 — avanzamento contestuale */}
      {prog && (
        <div className="mt-2 flex items-center gap-2">
          <Barra ratio={prog.ratio} accent={prog.accent} className="h-1.5 flex-1" />
          <span className="shrink-0 text-[0.66rem] font-semibold text-muted">{prog.label}</span>
        </div>
      )}

      {/* riga 4 — prossima mossa + invito ad aprire */}
      <div className="mt-2.5 flex items-center gap-2">
        {mossa ? (
          <button
            onClick={(e) => { e.stopPropagation(); mossa.run(); }}
            className={cn("inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[0.76rem] font-bold shadow-sm transition active:scale-95", mossa.cls)}
          >
            <mossa.Icon size={14} /> {mossa.label}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-[0.74rem] font-bold text-success"><Check size={14} /> Concluso</span>
        )}
        <span className="ml-auto inline-flex items-center gap-0.5 text-[0.68rem] font-semibold text-muted/55 transition-colors group-hover:text-lavoro-500">
          Apri <ChevronRight size={13} />
        </span>
      </div>
    </motion.div>
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

      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <FilterChip attivo={opFiltro === "tutti"} onClick={() => setOpFiltro("tutti")}>Tutta la squadra</FilterChip>
        {db.operatori.filter((o) => o.attivo).map((o) => (
          <FilterChip key={o.id} attivo={opFiltro === o.id} onClick={() => setOpFiltro(o.id)}>{o.nome}</FilterChip>
        ))}
      </div>

      {vista === "settimana" && <VistaSettimana giorni={giorni} isOggi={isOggi} />}
      {vista === "bacheca" && <VistaBacheca lavori={lavoriScope} />}
      {vista === "lista" && <VistaLista lavori={lavoriScope} statoFiltro={statoFiltro} setStatoFiltro={setStatoFiltro} />}
    </div>
  );
}

/* ----------------------------- Vista settimana ----------------------------- */
function VistaSettimana({ giorni, isOggi }: { giorni: { d: Date; lavori: Lavoro[] }[]; isOggi: (d: Date) => boolean }) {
  const apri = useUI((s) => s.apri);
  return (
    <motion.div variants={listaContenitore} initial="hidden" animate="show" className="grid gap-3 lg:grid-cols-2">
      {giorni.map(({ d, lavori }) => (
        <motion.div key={d.toISOString()} variants={listaElemento}>
          <Card className={cn("overflow-hidden", isOggi(d) && "ring-2 ring-brand-300")}>
            <div className="flex items-center justify-between border-b border-line bg-surface-2 px-4 py-2.5">
              <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
                <span className={cn("grid h-8 w-8 place-items-center rounded-[10px] text-[0.7rem]", isOggi(d) ? "bg-brand-500 text-white" : "bg-surface text-muted")}>{d.getDate()}</span>
                {NOMI[(d.getDay() + 6) % 7]}
              </h3>
              <button onClick={() => apri("lavoro", { data: iso(d) })} className="grid h-7 w-7 place-items-center rounded-[9px] text-muted transition hover:bg-brand-50 hover:text-brand-600"><Plus size={16} /></button>
            </div>
            {lavori.length === 0 ? (
              <button onClick={() => apri("lavoro", { data: iso(d) })} className="w-full px-4 py-5 text-left text-sm text-muted transition hover:text-brand-600">+ Aggiungi un lavoro</button>
            ) : (
              <div className="grid gap-2 p-2.5">
                {lavori.map((l) => <CartaLavoro key={l.id} l={l} />)}
              </div>
            )}
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ------------------------------ Vista bacheca ------------------------------ */
function VistaBacheca({ lavori }: { lavori: Lavoro[] }) {
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
function VistaLista({ lavori, statoFiltro, setStatoFiltro }: {
  lavori: Lavoro[];
  statoFiltro: StatoLavoro | "tutti";
  setStatoFiltro: (s: StatoLavoro | "tutti") => void;
}) {
  const filtrati = statoFiltro === "tutti" ? lavori : lavori.filter((l) => l.stato === statoFiltro);
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <FilterChip attivo={statoFiltro === "tutti"} onClick={() => setStatoFiltro("tutti")}>Tutti</FilterChip>
        {STATO_LAVORO.map((s) => (
          <FilterChip key={s} attivo={statoFiltro === s} onClick={() => setStatoFiltro(s)}>{etichetta(s)}</FilterChip>
        ))}
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
