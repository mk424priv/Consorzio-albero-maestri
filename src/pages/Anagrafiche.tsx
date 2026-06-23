// ANAGRAFICHE — chi è chi: Clienti e Collaboratori in un posto. Chi/cosa/
// quando/quanto. CRUD rapido; tap → profilo.
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, HandCoins, Pencil, Plus, Search, Users } from "lucide-react";
import { listaContenitore, listaElemento } from "@/lib/motion";
import { useStore } from "@/store/store";
import { useUI } from "@/store/ui";
import { riepilogoCliente } from "@/lib/conti";
import { libroOperatore } from "@/lib/squadra";
import { euro, ore as fmtOre } from "@/lib/format";
import { etichetta } from "@/lib/dominio";
import { ENTITA } from "@/lib/entita";
import { Avatar, Badge, Button, EmptyState, Segmented } from "@/components/ui";

const TAB = [
  { k: "clienti", label: "Clienti" },
  { k: "collaboratori", label: "Collaboratori" },
];

export function Anagrafiche() {
  const [tab, setTab] = useState("clienti");
  const apri = useUI((s) => s.apri);
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3 rounded-[18px] bg-gradient-to-br from-cliente-500 to-brand-700 p-4 text-white shadow-[var(--shadow-md)]">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-white/15 backdrop-blur"><Users size={22} /></span>
          <div>
            <div className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-white/75">Rubrica</div>
            <h1 className="text-xl font-extrabold leading-tight">Chi è chi</h1>
          </div>
        </div>
        <Button variante="glass" onClick={() => apri(tab === "clienti" ? "cliente" : "operatore")}><Plus size={16} /> Nuovo</Button>
      </div>

      <Segmented voci={TAB} attivo={tab} onChange={setTab} className="mb-4" />

      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {tab === "clienti" ? <Clienti /> : <Collaboratori />}
      </motion.div>
    </div>
  );
}

function Clienti() {
  const db = useStore((s) => s.db);
  const apri = useUI((s) => s.apri);
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const righe = useMemo(() => {
    const fl = q.trim().toLowerCase();
    return db.clienti
      .filter((c) => !fl || `${c.nome} ${c.cognome}`.toLowerCase().includes(fl))
      .map((c) => ({ c, r: riepilogoCliente(db, c.id) }))
      .sort((a, b) => b.r.saldoDaIncassare - a.r.saldoDaIncassare || a.c.nome.localeCompare(b.c.nome, "it"));
  }, [db, q]);
  return (
    <div>
      <label className="mb-3 flex items-center gap-2.5 rounded-[13px] border border-line-strong bg-surface px-3 py-2.5 focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-100">
        <Search size={18} className="text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca cliente…" className="w-full bg-transparent text-[1rem] font-semibold text-ink outline-none placeholder:font-normal placeholder:text-muted/70" />
      </label>
      {righe.length === 0 ? (
        <EmptyState icona={<Users size={24} />} titolo="Nessun cliente" testo="Aggiungi il primo cliente." azione={<Button variante="primary" onClick={() => apri("cliente")}><Plus size={16} /> Nuovo cliente</Button>} />
      ) : (
        <motion.div variants={listaContenitore} initial="hidden" animate="show" className="grid gap-2">
          {righe.map(({ c, r }) => (
            <motion.div key={c.id} variants={listaElemento} className="flex items-center gap-3 rounded-[13px] border border-line bg-surface p-3 shadow-[var(--shadow-sm)]">
              <button onClick={() => navigate(`/cliente/${c.id}`)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <Avatar nome={`${c.nome} ${c.cognome}`} grad={ENTITA.cliente.grad} size="md" />
                <div className="min-w-0">
                  <div className="truncate font-semibold text-ink">{c.nome} {c.cognome}</div>
                  <div className="text-[0.72rem] text-muted">{c.tariffaOraria ? `${euro(c.tariffaOraria)}/h · ` : ""}{r.numeroLavori} lavori</div>
                </div>
              </button>
              {r.saldoDaIncassare > 0 ? <Badge tono="warn">{euro(r.saldoDaIncassare)}</Badge> : <Badge tono="success">in pari</Badge>}
              <button onClick={() => apri("cliente", { id: c.id })} className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] text-muted hover:bg-brand-50 hover:text-brand-600"><Pencil size={15} /></button>
              <button onClick={() => navigate(`/cliente/${c.id}`)} className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] text-muted"><ChevronRight size={16} /></button>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function Collaboratori() {
  const db = useStore((s) => s.db);
  const apri = useUI((s) => s.apri);
  const navigate = useNavigate();
  const righe = useMemo(() => db.operatori.map((o) => ({ o, libro: libroOperatore(db, o.id) })).sort((a, b) => b.libro.saldo - a.libro.saldo), [db]);
  if (righe.length === 0) return <EmptyState icona={<Users size={24} />} titolo="Nessun collaboratore" testo="Aggiungi chi lavora con te." azione={<Button variante="primary" onClick={() => apri("operatore")}><Plus size={16} /> Nuovo</Button>} />;
  return (
    <motion.div variants={listaContenitore} initial="hidden" animate="show" className="grid gap-2">
      {righe.map(({ o, libro }) => (
        <motion.div key={o.id} variants={listaElemento} className="flex items-center gap-3 rounded-[13px] border border-line bg-surface p-3 shadow-[var(--shadow-sm)]">
          <button onClick={() => navigate(`/operatore/${o.id}`)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
            <Avatar nome={o.nome} grad={ENTITA.operatore.grad} size="md" />
            <div className="min-w-0">
              <div className="truncate font-semibold text-ink">{o.nome} {o.ruolo === "titolare" && <span className="text-[0.66rem] font-bold text-operatore-600">(io)</span>}</div>
              <div className="text-[0.72rem] text-muted">{o.tariffaOraria ? `${euro(o.tariffaOraria)}/h · ` : ""}{fmtOre(libro.ore)} · {etichetta(libro.stato)}</div>
            </div>
          </button>
          {libro.saldo > 0 ? <Badge tono="warn">{euro(libro.saldo)}</Badge> : <Badge tono="success">saldato</Badge>}
          <button onClick={() => apri("compenso", { operatoreId: o.id })} className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] text-muted hover:bg-uscita-50 hover:text-uscita-600" aria-label="Paga"><HandCoins size={15} /></button>
          <button onClick={() => apri("operatore", { id: o.id })} className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] text-muted hover:bg-brand-50 hover:text-brand-600"><Pencil size={15} /></button>
        </motion.div>
      ))}
    </motion.div>
  );
}
