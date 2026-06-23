// DASHBOARD — un solo posto, dati rilevanti, niente mischiato. Tre proiezioni
// (Generale / Per cliente / Per collaboratore) sopra calcoloLavoro + libroOperatore.
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronRight as Arr, TrendingUp, Banknote, Hourglass, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/cn";
import { listaContenitore, listaElemento } from "@/lib/motion";
import { useStore } from "@/store/store";
import { calcoloLavoro, faseLavoro } from "@/lib/lavoro-calc";
import { libroOperatore } from "@/lib/squadra";
import { storicoMensile } from "@/lib/conti";
import { euro, meseAnnoIT } from "@/lib/format";
import { ENTITA } from "@/lib/entita";
import { Avatar, Cifra, EmptyState, Segmented, Sparkline, StatCard } from "@/components/ui";

const PROIEZIONI = [
  { k: "generale", label: "Generale" },
  { k: "clienti", label: "Per cliente" },
  { k: "squadra", label: "Per collaboratore" },
];

export function Dashboard() {
  const db = useStore((s) => s.db);
  const navigate = useNavigate();
  const oggi = new Date();
  const [proiezione, setProiezione] = useState("generale");
  const [meseOff, setMeseOff] = useState(0);
  const [tutto, setTutto] = useState(false);

  const mese = useMemo(() => {
    const d = new Date(oggi.getFullYear(), oggi.getMonth() + meseOff, 1);
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, anno: d.getFullYear(), mese: d.getMonth() + 1 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meseOff]);
  const inScope = (iso: string) => (tutto ? true : iso.slice(0, 7) === mese.key);
  const lavoriScope = useMemo(() => db.lavori.filter((l) => inScope(l.data)), [db.lavori, mese.key, tutto]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3 rounded-[18px] bg-gradient-to-br from-entrata-400 via-entrata-500 to-entrata-700 p-4 text-white shadow-[var(--shadow-md)]">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-white/15 backdrop-blur"><Wallet size={22} /></span>
          <div>
            <div className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-white/75">Dashboard</div>
            <h1 className="text-xl font-extrabold capitalize leading-tight">{tutto ? "Tutto" : meseAnnoIT(mese.anno, mese.mese)}</h1>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-[11px] bg-white/12 p-1 backdrop-blur">
          <button onClick={() => { setTutto(false); setMeseOff((o) => o - 1); }} className="grid h-8 w-8 place-items-center rounded-[8px] text-white/80 hover:bg-white/20"><ChevronLeft size={16} /></button>
          <button onClick={() => setTutto((t) => !t)} className={cn("rounded-[8px] px-2 text-[0.78rem] font-bold text-white hover:bg-white/20", tutto && "bg-white/25")}>Tutto</button>
          <button onClick={() => { setTutto(false); setMeseOff((o) => o + 1); }} className="grid h-8 w-8 place-items-center rounded-[8px] text-white/80 hover:bg-white/20"><ChevronRight size={16} /></button>
        </div>
      </div>

      <Segmented voci={PROIEZIONI} attivo={proiezione} onChange={setProiezione} className="mb-4" />

      <motion.div key={proiezione} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {proiezione === "generale" && <Generale db={db} lavori={lavoriScope} />}
        {proiezione === "clienti" && <PerCliente db={db} lavori={lavoriScope} onApri={(id) => navigate(`/cliente/${id}`)} />}
        {proiezione === "squadra" && <PerCollaboratore db={db} periodo={tutto ? undefined : mese.key} onApri={(id) => navigate(`/operatore/${id}`)} />}
      </motion.div>
    </div>
  );
}

function Generale({ db, lavori }: { db: ReturnType<typeof useStore.getState>["db"]; lavori: ReturnType<typeof useStore.getState>["db"]["lavori"] }) {
  let lordo = 0, spese = 0, costo = 0, incassato = 0, daInc = 0, pianificati = 0;
  for (const l of lavori) {
    const c = calcoloLavoro(db, l);
    if (faseLavoro(l) === "da_fare") { pianificati++; continue; }
    lordo += c.lordo; spese += c.speseTotali; costo += c.costoCollaboratori; incassato += c.incassato; daInc += c.daIncassare;
  }
  const netto = Math.round((lordo - spese - costo) * 100) / 100;
  const trend = [...storicoMensile(db)].reverse().map((x) => x.saldo);
  return (
    <div className="grid gap-3">
      <div className="rounded-[18px] border border-entrata-100 bg-entrata-50 p-4">
        <div className="text-[0.66rem] font-bold uppercase tracking-wide text-entrata-700">Utile netto</div>
        <div className="font-display text-[2.4rem] font-bold leading-none text-ink"><Cifra valore={netto} /></div>
        <div className="mt-1.5 text-[0.74rem] text-muted">Lordo {euro(lordo)} − Spese {euro(spese)} − Squadra {euro(costo)}</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatCard accent="entrata" label="Incassato" valore={<Cifra valore={incassato} />} icona={<Banknote size={15} />} />
        <StatCard accent="uscita" label="Da incassare" valore={<Cifra valore={daInc} />} icona={<Hourglass size={15} />} />
      </div>
      <div className="rounded-[16px] border border-line bg-surface p-3.5">
        <div className="mb-1 flex items-center justify-between"><span className="text-[0.66rem] font-bold uppercase tracking-wide text-muted">Andamento utile</span><span className="text-[0.62rem] text-muted">{pianificati} pianificati</span></div>
        {trend.length > 1 ? <Sparkline accent="entrata" valori={trend} height={52} /> : <div className="py-4 text-center text-[0.72rem] text-muted">Serve più storico</div>}
      </div>
    </div>
  );
}

function PerCliente({ db, lavori, onApri }: { db: ReturnType<typeof useStore.getState>["db"]; lavori: ReturnType<typeof useStore.getState>["db"]["lavori"]; onApri: (id: string) => void }) {
  const righe = useMemo(() => {
    const map = new Map<string, { lordo: number; incassato: number; daInc: number; ore: number; netto: number }>();
    for (const l of lavori) {
      if (faseLavoro(l) === "da_fare") continue;
      const c = calcoloLavoro(db, l);
      const r = map.get(l.clienteId) ?? { lordo: 0, incassato: 0, daInc: 0, ore: 0, netto: 0 };
      r.lordo += c.lordo; r.incassato += c.incassato; r.daInc += c.daIncassare; r.ore += c.oreTotali; r.netto += c.netto;
      map.set(l.clienteId, r);
    }
    return [...map.entries()].map(([id, v]) => ({ id, ...v, nome: (() => { const c = db.clienti.find((x) => x.id === id); return c ? `${c.nome} ${c.cognome}` : "—"; })() })).sort((a, b) => b.daInc - a.daInc || b.netto - a.netto);
  }, [db, lavori]);
  if (righe.length === 0) return <EmptyState icona={<Users size={24} />} testo="Nessun lavoro fatto nel periodo." />;
  return (
    <motion.div variants={listaContenitore} initial="hidden" animate="show" className="grid gap-2">
      {righe.map((r) => (
        <motion.button key={r.id} variants={listaElemento} onClick={() => onApri(r.id)} className="flex w-full items-center gap-3 rounded-[13px] border border-line bg-surface p-3 text-left shadow-[var(--shadow-sm)] transition hover:border-cliente-200 hover:shadow-[var(--shadow-md)]">
          <Avatar nome={r.nome} grad={ENTITA.cliente.grad} size="md" />
          <div className="min-w-0 flex-1"><div className="truncate font-semibold text-ink">{r.nome}</div><div className="text-[0.72rem] text-muted">{r.ore}h · netto {euro(r.netto)}</div></div>
          <div className="shrink-0 text-right">
            {r.daInc > 0 ? <div className="font-bold text-uscita-600">{euro(r.daInc)}</div> : <div className="text-[0.74rem] font-bold text-success">saldato</div>}
            <div className="text-[0.6rem] uppercase tracking-wide text-muted">incassato {euro(r.incassato)}</div>
          </div>
          <Arr size={16} className="shrink-0 text-muted/40" />
        </motion.button>
      ))}
    </motion.div>
  );
}

function PerCollaboratore({ db, periodo, onApri }: { db: ReturnType<typeof useStore.getState>["db"]; periodo?: string; onApri: (id: string) => void }) {
  const righe = db.operatori.filter((o) => o.attivo).map((o) => ({ o, libro: libroOperatore(db, o.id, periodo) })).sort((a, b) => b.libro.saldo - a.libro.saldo);
  if (righe.length === 0) return <EmptyState icona={<Users size={24} />} testo="Nessun collaboratore." />;
  return (
    <motion.div variants={listaContenitore} initial="hidden" animate="show" className="grid gap-2">
      {righe.map(({ o, libro }) => (
        <motion.button key={o.id} variants={listaElemento} onClick={() => onApri(o.id)} className="flex w-full items-center gap-3 rounded-[13px] border border-line bg-surface p-3 text-left shadow-[var(--shadow-sm)] transition hover:border-operatore-200 hover:shadow-[var(--shadow-md)]">
          <Avatar nome={o.nome} grad={ENTITA.operatore.grad} size="md" />
          <div className="min-w-0 flex-1"><div className="truncate font-semibold text-ink">{o.nome}</div><div className="text-[0.72rem] text-muted">{libro.ore}h · dovuto {euro(libro.dovuto)}</div></div>
          <div className="shrink-0 text-right">
            {libro.saldo > 0 ? <div className="inline-flex items-center gap-1 font-bold text-uscita-600"><TrendingUp size={13} /> {euro(libro.saldo)}</div> : <div className="text-[0.74rem] font-bold text-success">saldato</div>}
            <div className="text-[0.6rem] uppercase tracking-wide text-muted">pagato {euro(libro.pagato)}</div>
          </div>
          <Arr size={16} className="shrink-0 text-muted/40" />
        </motion.button>
      ))}
    </motion.div>
  );
}
