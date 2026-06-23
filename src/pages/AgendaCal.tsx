// HOME — Agenda calendario. Vista Giorno/Settimana/Mese/Anno (default
// Settimana). Sotto il giorno selezionato, le card di lavoro + aggiungi.
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Banknote, Check, ChevronLeft, ChevronRight, Clock, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { listaContenitore, listaElemento } from "@/lib/motion";
import { useStore } from "@/store/store";
import { useUI } from "@/store/ui";
import { calcoloLavoro } from "@/lib/lavoro-calc";
import { euro, dataLungaIT, meseAnnoIT, inputData } from "@/lib/format";
import { EmptyState, Segmented } from "@/components/ui";
import type { Lavoro } from "@/lib/types";

type Periodo = "giorno" | "settimana" | "mese" | "anno";
const PERIODI = [
  { k: "giorno", label: "Giorno" },
  { k: "settimana", label: "Settimana" },
  { k: "mese", label: "Mese" },
  { k: "anno", label: "Anno" },
];
const GIORNI = ["L", "M", "M", "G", "V", "S", "D"];
const MESI = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

const iso = (d: Date) => inputData(d);
const fromIso = (s: string) => new Date(s + "T00:00:00");
function lunediDi(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }

export function AgendaCal() {
  const db = useStore((s) => s.db);
  const apriCard = useUI((s) => s.apriCard);
  const oggi = iso(new Date());
  const [periodo, setPeriodo] = useState<Periodo>("settimana");
  const [sel, setSel] = useState(oggi);

  const haLavori = (giorno: string) => db.lavori.some((l) => l.data === giorno);
  const selD = fromIso(sel);

  function shift(delta: number) {
    const d = fromIso(sel);
    if (periodo === "giorno") d.setDate(d.getDate() + delta);
    else if (periodo === "settimana") d.setDate(d.getDate() + delta * 7);
    else if (periodo === "mese") d.setMonth(d.getMonth() + delta);
    else d.setFullYear(d.getFullYear() + delta);
    setSel(iso(d));
  }

  // etichetta periodo
  const etichetta = (() => {
    if (periodo === "giorno") return dataLungaIT(sel);
    if (periodo === "anno") return String(selD.getFullYear());
    if (periodo === "mese") return meseAnnoIT(selD.getFullYear(), selD.getMonth() + 1);
    const ini = lunediDi(selD); const fin = new Date(ini); fin.setDate(fin.getDate() + 6);
    return `${ini.getDate()} ${MESI[ini.getMonth()]} – ${fin.getDate()} ${MESI[fin.getMonth()]}`;
  })();

  // celle settimana
  const settimana = useMemo(() => {
    const ini = lunediDi(selD);
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(ini); d.setDate(d.getDate() + i); return d; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, periodo]);

  // celle mese (con offset iniziale lun)
  const mese = useMemo(() => {
    const primo = new Date(selD.getFullYear(), selD.getMonth(), 1);
    const offset = (primo.getDay() + 6) % 7;
    const giorni = new Date(selD.getFullYear(), selD.getMonth() + 1, 0).getDate();
    const celle: (Date | null)[] = Array.from({ length: offset }, () => null);
    for (let g = 1; g <= giorni; g++) celle.push(new Date(selD.getFullYear(), selD.getMonth(), g));
    return celle;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, periodo]);

  return (
    <div>
      {/* intestazione */}
      <div className="mb-3 flex items-center justify-between gap-2 rounded-[16px] bg-gradient-to-br from-brand-400 to-brand-600 px-3 py-2.5 text-white shadow-[var(--shadow-md)]">
        <button onClick={() => shift(-1)} className="grid h-9 w-9 place-items-center rounded-[10px] hover:bg-white/20"><ChevronLeft size={18} /></button>
        <div className="text-center">
          <div className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-white/75">Agenda</div>
          <div className="text-[0.95rem] font-extrabold capitalize leading-tight">{etichetta}</div>
        </div>
        <button onClick={() => shift(1)} className="grid h-9 w-9 place-items-center rounded-[10px] hover:bg-white/20"><ChevronRight size={18} /></button>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <Segmented voci={PERIODI} attivo={periodo} onChange={(k) => setPeriodo(k as Periodo)} className="flex-1" />
        <button onClick={() => setSel(oggi)} className="shrink-0 rounded-[11px] border border-line bg-surface px-3 py-2 text-[0.78rem] font-bold text-brand-600">Oggi</button>
      </div>

      {/* selettore calendario */}
      {periodo === "settimana" && (
        <div className="mb-4 grid grid-cols-7 gap-1.5">
          {settimana.map((d, i) => {
            const k = iso(d); const att = k === sel; const oggiQ = k === oggi;
            return (
              <button key={k} onClick={() => setSel(k)} className={cn("flex flex-col items-center gap-0.5 rounded-[12px] border py-2 transition", att ? "border-brand-300 bg-brand-50" : "border-line bg-surface")}>
                <span className="text-[0.6rem] font-bold uppercase text-muted">{GIORNI[i]}</span>
                <span className={cn("grid h-7 w-7 place-items-center rounded-full text-[0.85rem] font-bold", att ? "bg-brand-500 text-white" : oggiQ ? "text-brand-600" : "text-ink")}>{d.getDate()}</span>
                <span className={cn("h-1.5 w-1.5 rounded-full", haLavori(k) ? "bg-lavoro-500" : "bg-transparent")} />
              </button>
            );
          })}
        </div>
      )}
      {periodo === "mese" && (
        <div className="mb-4 rounded-[16px] border border-line bg-surface p-2">
          <div className="mb-1 grid grid-cols-7 text-center text-[0.6rem] font-bold uppercase text-muted">{GIORNI.map((g, i) => <span key={i}>{g}</span>)}</div>
          <div className="grid grid-cols-7 gap-1">
            {mese.map((d, i) => d ? (() => { const k = iso(d); const att = k === sel; const oggiQ = k === oggi; return (
              <button key={k} onClick={() => setSel(k)} className={cn("flex flex-col items-center rounded-[9px] py-1.5 transition", att ? "bg-brand-50 ring-1 ring-brand-200" : "hover:bg-surface-2")}>
                <span className={cn("grid h-7 w-7 place-items-center rounded-full text-[0.82rem] font-semibold", att ? "bg-brand-500 text-white" : oggiQ ? "text-brand-600 font-bold" : "text-ink")}>{d.getDate()}</span>
                <span className={cn("mt-0.5 h-1 w-1 rounded-full", haLavori(k) ? "bg-lavoro-500" : "bg-transparent")} />
              </button>
            ); })() : <span key={`v${i}`} />)}
          </div>
        </div>
      )}
      {periodo === "giorno" && (
        <div className="mb-4 flex items-center justify-center gap-2 rounded-[14px] border border-line bg-surface py-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-500 text-sm font-bold text-white">{selD.getDate()}</span>
          <span className="text-[0.9rem] font-bold capitalize text-ink">{dataLungaIT(sel)}</span>
        </div>
      )}

      {/* corpo */}
      {periodo === "anno" ? (
        <AnnoGriglia db={db} anno={selD.getFullYear()} onMese={(m) => { setSel(iso(new Date(selD.getFullYear(), m, 1))); setPeriodo("mese"); }} />
      ) : (
        <GiornoAgenda data={sel} onAdd={() => apriCard({ data: sel })} />
      )}
    </div>
  );
}

function GiornoAgenda({ data, onAdd }: { data: string; onAdd: () => void }) {
  const db = useStore((s) => s.db);
  const lavori = db.lavori.filter((l) => l.data === data).sort((a, b) => (a.oraInizio ?? "99").localeCompare(b.oraInizio ?? "99"));
  return (
    <div>
      <motion.div variants={listaContenitore} initial="hidden" animate="show" className="grid gap-2">
        {lavori.length === 0 ? (
          <EmptyState icona={<Clock size={22} />} testo="Niente in questo giorno." className="py-8" />
        ) : (
          lavori.map((l) => <motion.div key={l.id} variants={listaElemento}><CardAgenda l={l} /></motion.div>)
        )}
      </motion.div>
      <button onClick={onAdd} className="mt-3 flex w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-brand-200 bg-brand-50/50 py-3 text-sm font-bold text-brand-600 transition hover:bg-brand-50">
        <Plus size={17} /> Aggiungi lavoro
      </button>
    </div>
  );
}

function CardAgenda({ l }: { l: Lavoro }) {
  const db = useStore((s) => s.db);
  const apriCard = useUI((s) => s.apriCard);
  const segnaSaldato = useStore((s) => s.segnaSaldato);
  const c = calcoloLavoro(db, l);
  const cli = db.clienti.find((x) => x.id === l.clienteId);
  const saldato = c.statoIncasso === "pagato";
  const ora = l.oraInizio ? `${l.oraInizio}${l.oraFine ? `–${l.oraFine}` : ""}` : null;
  return (
    <div className="group relative overflow-hidden rounded-[15px] border border-line bg-surface p-3 shadow-[var(--shadow-sm)] transition hover:border-brand-200 hover:shadow-[var(--shadow-md)]">
      <button onClick={() => apriCard({ lavoroId: l.id })} className="block w-full text-left">
        <div className="flex items-start gap-2.5">
          <div className="flex w-14 shrink-0 flex-col items-center rounded-[10px] bg-lavoro-50 py-1.5 text-lavoro-700">
            <Clock size={13} />
            <span className="mt-0.5 text-[0.66rem] font-bold leading-tight">{l.oraInizio ?? "—"}</span>
            {l.oraFine && <span className="text-[0.6rem] text-lavoro-500">{l.oraFine}</span>}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-ink">{cli ? `${cli.nome} ${cli.cognome}` : "—"}</div>
            {l.descrizione && <div className="mt-0.5 line-clamp-2 text-[0.78rem] text-muted">{l.descrizione}</div>}
            {ora && <div className="mt-0.5 text-[0.7rem] text-muted">{ora} · {c.oreTotali}h</div>}
          </div>
          <div className="shrink-0 text-right">
            <div className="font-display text-[1rem] font-bold text-ink">{euro(c.lordo)}</div>
          </div>
        </div>
      </button>
      <div className="mt-2 flex items-center justify-end">
        <button onClick={() => segnaSaldato(l.id, !saldato)} className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.7rem] font-bold transition", saldato ? "bg-entrata-50 text-entrata-600" : "bg-uscita-50 text-uscita-600")}>
          {saldato ? <><Check size={12} /> Saldato</> : <><Banknote size={12} /> Da saldare</>}
        </button>
      </div>
    </div>
  );
}

function AnnoGriglia({ db, anno, onMese }: { db: ReturnType<typeof useStore.getState>["db"]; anno: number; onMese: (m: number) => void }) {
  const perMese = useMemo(() => {
    const arr = Array.from({ length: 12 }, () => ({ n: 0, lordo: 0 }));
    for (const l of db.lavori) {
      if (l.data.slice(0, 4) !== String(anno)) continue;
      const m = Number(l.data.slice(5, 7)) - 1;
      arr[m].n += 1; arr[m].lordo += calcoloLavoro(db, l).lordo;
    }
    return arr;
  }, [db, anno]);
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {MESI.map((nome, m) => (
        <button key={m} onClick={() => onMese(m)} className="rounded-[14px] border border-line bg-surface p-3 text-left shadow-[var(--shadow-sm)] transition hover:border-brand-200 hover:shadow-[var(--shadow-md)]">
          <div className="text-[0.9rem] font-bold text-ink">{nome}</div>
          <div className="mt-1 text-[0.72rem] text-muted">{perMese[m].n} lavori</div>
          {perMese[m].lordo > 0 && <div className="mt-0.5 font-display text-[0.95rem] font-bold text-entrata-600">{euro(perMese[m].lordo)}</div>}
        </button>
      ))}
    </div>
  );
}
