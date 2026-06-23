// CENTRO — l'home: i record di lavoro del mese, raggruppati per giorno.
// Card compatte → aprono il dettaglio. Badge "Prossimo" stile Telegram.
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Banknote, CalendarDays, ChevronLeft, ChevronRight, ChevronUp, Clock, Euro, Hammer, Plus, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { listaContenitore, listaElemento } from "@/lib/motion";
import { useStore } from "@/store/store";
import { useUI } from "@/store/ui";
import { calcoloLavoro, faseLavoro, modoLavoro } from "@/lib/lavoro-calc";
import { euro, meseAnnoIT, dataLungaIT } from "@/lib/format";
import { ENTITA } from "@/lib/entita";
import { EmptyState, Segmented } from "@/components/ui";
import type { Lavoro } from "@/lib/types";

const SPINA: Record<string, string> = { fatto: "bg-success", da_fare: "bg-warn" };
const FILTRI = [
  { k: "tutti", label: "Tutti" },
  { k: "fatto", label: "Fatti" },
  { k: "da_fare", label: "Da fare" },
];

export function Records() {
  const db = useStore((s) => s.db);
  const apriWizard = useUI((s) => s.apriWizard);
  const apriScheda = useUI((s) => s.apriSchedaLavoro);
  const oggi = new Date();
  const [meseOff, setMeseOff] = useState(0);
  const [filtro, setFiltro] = useState("tutti");

  const mese = useMemo(() => {
    const d = new Date(oggi.getFullYear(), oggi.getMonth() + meseOff, 1);
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, anno: d.getFullYear(), mese: d.getMonth() + 1 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meseOff]);

  const lavoriMese = useMemo(() => {
    return db.lavori
      .filter((l) => l.data.slice(0, 7) === mese.key)
      .filter((l) => filtro === "tutti" || faseLavoro(l) === filtro)
      .sort((a, b) => b.data.localeCompare(a.data) || (a.ordineNelGiorno ?? 99) - (b.ordineNelGiorno ?? 99));
  }, [db.lavori, mese.key, filtro]);

  const giorni = useMemo(() => {
    const map = new Map<string, Lavoro[]>();
    for (const l of lavoriMese) {
      const arr = map.get(l.data) ?? [];
      arr.push(l);
      map.set(l.data, arr);
    }
    return [...map.entries()];
  }, [lavoriMese]);

  // prossimo da_fare (oggi o futuro)
  const oggiKey = `${oggi.getFullYear()}-${String(oggi.getMonth() + 1).padStart(2, "0")}-${String(oggi.getDate()).padStart(2, "0")}`;
  const prossimo = useMemo(() => {
    return db.lavori
      .filter((l) => faseLavoro(l) === "da_fare" && l.data >= oggiKey)
      .sort((a, b) => a.data.localeCompare(b.data))[0];
  }, [db.lavori, oggiKey]);
  const nomeCli = (id: string) => { const c = db.clienti.find((x) => x.id === id); return c ? `${c.nome} ${c.cognome}` : "—"; };

  return (
    <div className="relative">
      {/* Hero / navigazione mese */}
      <div className="mb-4 flex items-center justify-between gap-3 rounded-[18px] bg-gradient-to-br from-brand-400 to-brand-600 p-4 text-white shadow-[var(--shadow-md)]">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-white/15 backdrop-blur"><CalendarDays size={22} /></span>
          <div>
            <div className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-white/75">I tuoi interventi</div>
            <h1 className="text-xl font-extrabold capitalize leading-tight">{meseAnnoIT(mese.anno, mese.mese)}</h1>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-[11px] bg-white/12 p-1 backdrop-blur">
          <button onClick={() => setMeseOff((o) => o - 1)} className="grid h-8 w-8 place-items-center rounded-[8px] text-white/80 hover:bg-white/20"><ChevronLeft size={16} /></button>
          {meseOff !== 0 && <button onClick={() => setMeseOff(0)} className="rounded-[8px] px-2 text-[0.78rem] font-bold text-white hover:bg-white/20">Oggi</button>}
          <button onClick={() => setMeseOff((o) => o + 1)} className="grid h-8 w-8 place-items-center rounded-[8px] text-white/80 hover:bg-white/20"><ChevronRight size={16} /></button>
        </div>
      </div>

      <Segmented voci={FILTRI} attivo={filtro} onChange={setFiltro} className="mb-4" />

      {giorni.length === 0 ? (
        <EmptyState icona={<Hammer size={26} />} titolo="Nessun intervento" testo="Tocca + per registrare il primo lavoro di questo mese." azione={<button onClick={() => apriWizard()} className="inline-flex items-center gap-2 rounded-[12px] bg-gradient-to-b from-brand-400 to-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-[var(--shadow-glow)]"><Plus size={16} /> Nuovo intervento</button>} />
      ) : (
        <motion.div variants={listaContenitore} initial="hidden" animate="show" className="grid gap-5">
          {giorni.map(([data, items]) => (
            <motion.div key={data} variants={listaElemento}>
              <h3 className="mb-2 px-1 text-[0.8rem] font-bold capitalize text-ink-soft">{dataLungaIT(data)}</h3>
              <div className="grid gap-2">
                {items.map((l) => <CartaRecord key={l.id} l={l} onApri={() => apriScheda(l.id)} />)}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Badge "Prossimo" stile Telegram */}
      {prossimo && (
        <button onClick={() => apriScheda(prossimo.id)} className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] right-4 z-30 inline-flex items-center gap-2 rounded-full bg-warn px-3.5 py-2 text-[0.78rem] font-bold text-white shadow-[var(--shadow-md)] lg:bottom-6">
          <ChevronUp size={15} /> Prossimo · {nomeCli(prossimo.clienteId)}
        </button>
      )}
    </div>
  );
}

function CartaRecord({ l, onApri }: { l: Lavoro; onApri: () => void }) {
  const db = useStore((s) => s.db);
  const c = calcoloLavoro(db, l);
  const cli = db.clienti.find((x) => x.id === l.clienteId);
  const fase = faseLavoro(l);
  const modo = modoLavoro(l);
  return (
    <motion.button whileTap={{ scale: 0.985 }} onClick={onApri} className="group relative w-full overflow-hidden rounded-[15px] border border-line bg-surface p-3 pl-3.5 text-left shadow-[var(--shadow-sm)] transition hover:border-brand-200 hover:shadow-[var(--shadow-md)]">
      <span className={cn("absolute inset-y-0 left-0 w-1.5", SPINA[fase])} />
      <div className="flex items-start gap-2">
        <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-[11px]", ENTITA.lavoro.soft)}>
          {modo === "preventivo" ? <Euro size={16} /> : <Clock size={16} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{cli ? `${cli.nome} ${cli.cognome}` : "—"}</span>
            <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[0.66rem] font-bold", fase === "fatto" ? "bg-success-soft text-success" : "bg-warn-soft text-warn")}>{fase === "fatto" ? "Fatto" : "Da fare"}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.72rem] text-muted">
            {c.oreTotali > 0 && <span className="inline-flex items-center gap-1 text-operatore-600"><Clock size={11} /> {c.oreTotali}h</span>}
            {c.partecipanti.length > 1 && <span className="inline-flex items-center gap-1"><Users size={11} /> {c.partecipanti.length}</span>}
            {fase === "fatto" && c.lordo > 0 && <span className="inline-flex items-center gap-1 text-entrata-600"><Banknote size={11} /> {euro(c.incassato)}/{euro(c.lordo)}</span>}
            {fase === "da_fare" && c.lordo > 0 && <span className="text-preventivo-600">stima {euro(c.lordo)}</span>}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className={cn("font-display text-[0.95rem] font-bold", c.netto >= 0 ? "text-ink" : "text-spesa-600")}>{euro(c.netto)}</div>
          <div className="text-[0.6rem] uppercase tracking-wide text-muted">netto</div>
        </div>
      </div>
      {fase === "fatto" && c.daIncassare > 0 && (
        <div className="mt-1.5 ml-1 inline-block rounded-full bg-uscita-50 px-2 py-0.5 text-[0.66rem] font-bold text-uscita-600">resta {euro(c.daIncassare)}</div>
      )}
    </motion.button>
  );
}
