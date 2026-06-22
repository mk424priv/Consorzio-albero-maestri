import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  Fuel,
  HandCoins,
  Plus,
  Trash2,
  Wallet,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/store/store";
import { useUI } from "@/store/ui";
import { useToast } from "@/store/toast";
import { movimenti, riepilogoMese, type TipoMovimento } from "@/lib/movimenti";
import { storicoMensile } from "@/lib/conti";
import { dataIT, euro, inputData, meseAnnoIT } from "@/lib/format";
import { etichetta, STATO_ATTREZZO } from "@/lib/dominio";
import type { StatoAttrezzo } from "@/lib/dominio";
import { ENTITA } from "@/lib/entita";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  FilterChip,
  HeroStat,
  Importo,
  PageHero,
  RigaEditabile,
  Segmented,
  StatusBadge,
  Table,
  Th,
  type Cella,
} from "@/components/ui";

const TABS = [
  { k: "movimenti", label: "Movimenti" },
  { k: "storico", label: "Storico" },
  { k: "patrimonio", label: "Patrimonio" },
];
const META_MOV: Record<TipoMovimento, keyof typeof ENTITA> = { incasso: "entrata", compenso: "uscita", spesa: "spesa" };

export function Soldi() {
  const db = useStore((s) => s.db);
  const apri = useUI((s) => s.apri);
  const [tab, setTab] = useState("movimenti");
  const oggi = new Date();
  const [anno, setAnno] = useState(oggi.getFullYear());
  const [mese, setMese] = useState(oggi.getMonth() + 1);
  const periodo = `${anno}-${String(mese).padStart(2, "0")}`;

  const r = useMemo(() => riepilogoMese(db, anno, mese), [db, anno, mese]);

  function cambiaMese(delta: number) {
    const d = new Date(anno, mese - 1 + delta, 1);
    setAnno(d.getFullYear());
    setMese(d.getMonth() + 1);
  }

  return (
    <div>
      <PageHero
        grad="bg-gradient-to-br from-uscita-400 via-entrata-500 to-entrata-700"
        eyebrow="Soldi"
        titolo="Flusso del denaro"
        sottotitolo="Entrate, uscite e saldo del mese"
        icona={<Wallet size={22} />}
        azione={
          <div className="flex items-center gap-1 rounded-[11px] bg-white/12 p-1 backdrop-blur">
            <button onClick={() => cambiaMese(-1)} aria-label="Mese precedente" className="grid h-8 w-8 place-items-center rounded-[8px] text-white/80 transition hover:bg-white/20"><ChevronLeft size={16} /></button>
            <span className="min-w-[7.5rem] px-1 text-center text-[0.8rem] font-bold text-white">{meseAnnoIT(anno, mese)}</span>
            <button onClick={() => cambiaMese(1)} aria-label="Mese successivo" className="grid h-8 w-8 place-items-center rounded-[8px] text-white/80 transition hover:bg-white/20"><ChevronRight size={16} /></button>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <HeroStat label="Incassato" valore={euro(r.incassato)} />
          <HeroStat label="Uscite" valore={euro(r.uscite)} nota="spese + compensi" />
          <HeroStat label="Saldo" valore={euro(r.saldo)} />
          <HeroStat label="Da incassare" valore={euro(r.daIncassare)} />
          <HeroStat label="Da pagare team" valore={euro(r.daPagareSquadra)} />
        </div>
      </PageHero>

      <Segmented voci={TABS} attivo={tab} onChange={setTab} className="mb-5" />

      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
        {tab === "movimenti" && <Movimenti periodo={periodo} />}
        {tab === "storico" && <Storico />}
        {tab === "patrimonio" && <Patrimonio />}
      </motion.div>

      {tab === "movimenti" && (
        <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] right-4 z-30 flex flex-col gap-2 lg:hidden">
          <Button variante="primary" dim="sm" onClick={() => apri("incasso")}><Plus size={15} /> Incasso</Button>
        </div>
      )}
    </div>
  );
}

function Movimenti({ periodo }: { periodo: string }) {
  const db = useStore((s) => s.db);
  const apri = useUI((s) => s.apri);
  const [filtro, setFiltro] = useState<"tutti" | TipoMovimento>("tutti");
  const lista = useMemo(() => movimenti(db, periodo).filter((m) => filtro === "tutti" || m.tipo === filtro), [db, periodo, filtro]);

  const FILTRI: { k: "tutti" | TipoMovimento; label: string }[] = [
    { k: "tutti", label: "Tutti" },
    { k: "incasso", label: "Incassi" },
    { k: "compenso", label: "Compensi" },
    { k: "spesa", label: "Spese" },
  ];
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTRI.map((f) => <FilterChip key={f.k} attivo={filtro === f.k} onClick={() => setFiltro(f.k)}>{f.label}</FilterChip>)}
        <div className="ml-auto hidden gap-2 sm:flex">
          <Button variante="soft" dim="sm" onClick={() => apri("incasso")}><Banknote size={15} /> Incasso</Button>
          <Button variante="soft" dim="sm" onClick={() => apri("spesa")}><Fuel size={15} /> Spesa</Button>
          <Button variante="soft" dim="sm" onClick={() => apri("compenso")}><HandCoins size={15} /> Compenso</Button>
        </div>
      </div>
      {lista.length === 0 ? <EmptyState icona={<Wallet size={24} />} testo="Nessun movimento in questo mese." /> : (
        <Card className="divide-y divide-line overflow-hidden">
          {lista.map((m) => {
            const meta = ENTITA[META_MOV[m.tipo]];
            return (
              <div key={m.id} className="flex items-center gap-3 p-3.5">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-[12px] ${meta.soft}`}><meta.Icon size={17} /></span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-ink">{m.titolo}</div>
                  <div className="text-[0.74rem] text-muted">{dataIT(m.data)} · {etichetta(m.sottotitolo ?? "")}</div>
                </div>
                <Importo n={m.importo} segno={m.segno} />
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

function Storico() {
  const db = useStore((s) => s.db);
  const righe = useMemo(() => storicoMensile(db), [db]);
  const max = Math.max(1, ...righe.map((r) => Math.max(r.incassato, r.uscite)));
  if (righe.length === 0) return <EmptyState testo="Ancora nessun movimento registrato." />;
  return (
    <div className="grid gap-3">
      {righe.map((r, i) => (
        <Card key={r.chiave} className={cn("p-4", i === 0 && "ring-2 ring-brand-200")}>
          <div className="mb-3 flex items-center justify-between">
            <span className="font-bold text-ink">{meseAnnoIT(r.anno, r.mese)}</span>
            <span className={cn("text-sm font-extrabold", r.saldo >= 0 ? "text-success" : "text-danger")}>{euro(r.saldo)}</span>
          </div>
          <div className="grid gap-2">
            {[
              { l: "Incassato", v: r.incassato, c: "bg-entrata-500" },
              { l: "Uscite", v: r.uscite, c: "bg-spesa-500" },
            ].map((b) => (
              <div key={b.l} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-[0.74rem] font-semibold text-muted">{b.l}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(b.v / max) * 100}%` }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className={cn("h-full rounded-full", b.c)} />
                </div>
                <span className="w-20 shrink-0 text-right text-[0.78rem] font-bold tabular-nums text-ink">{euro(b.v)}</span>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

function Patrimonio() {
  const db = useStore((s) => s.db);
  const apri = useUI((s) => s.apri);
  const aggiorna = useStore((s) => s.aggiornaAttrezzo);
  const elimina = useStore((s) => s.eliminaAttrezzo);
  const chiediConferma = useUI((s) => s.chiediConferma);
  const mostra = useToast((s) => s.mostra);
  const attrezzi = [...db.attrezzi].sort((a, b) => a.nome.localeCompare(b.nome, "it"));
  const valore = attrezzi.reduce((a, x) => a + (x.costoAcquisto ?? 0), 0);
  const num = (s: string) => { const t = s.trim().replace(",", "."); return t === "" ? null : Number.isFinite(Number(t)) ? Number(t) : null; };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Badge tono="neutral">Valore totale: {euro(valore)}</Badge>
        <Button variante="soft" dim="sm" onClick={() => apri("attrezzo")}><Plus size={15} /> Attrezzo</Button>
      </div>
      {attrezzi.length === 0 ? <EmptyState icona={<Wrench size={24} />} testo="Nessun attrezzo registrato." /> : (
        <Table>
          <thead><tr><Th></Th><Th>Attrezzo</Th><Th>Acquisto</Th><Th className="text-right">Costo</Th><Th>Stato</Th><Th></Th></tr></thead>
          <tbody>
            {attrezzi.map((a) => {
              const celle: Cella[] = [
                { tipo: "testo", nome: "nome", valore: a.nome, classe: "font-semibold text-ink", display: <span className="flex items-center gap-2"><Avatar nome={a.nome} size="sm" grad={ENTITA.patrimonio.grad} />{a.nome}</span> },
                { tipo: "data", nome: "dataAcquisto", valore: inputData(a.dataAcquisto), display: a.dataAcquisto ? dataIT(a.dataAcquisto) : "—", classe: "text-muted" },
                { tipo: "numero", nome: "costoAcquisto", valore: a.costoAcquisto != null ? String(a.costoAcquisto) : "", step: "0.01", classe: "text-right", display: a.costoAcquisto ? euro(a.costoAcquisto) : "—" },
                { tipo: "select", nome: "stato", valore: a.stato, opzioni: STATO_ATTREZZO.map((s) => ({ v: s, l: etichetta(s) })), display: <StatusBadge genere="attrezzo" valore={a.stato} /> },
              ];
              return (
                <RigaEditabile
                  key={a.id}
                  celle={celle}
                  onSave={(v) => { aggiorna(a.id, { nome: v.nome.trim() || a.nome, dataAcquisto: v.dataAcquisto || null, costoAcquisto: num(v.costoAcquisto), stato: v.stato as StatoAttrezzo }); mostra("Attrezzo aggiornato."); }}
                  azioni={<button onClick={() => chiediConferma({ titolo: "Eliminare l'attrezzo?", pericolo: true, testoConferma: "Elimina", onConfirm: () => elimina(a.id) })} className="grid h-8 w-8 place-items-center rounded-[10px] text-muted hover:bg-danger-soft hover:text-danger"><Trash2 size={15} /></button>}
                />
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
