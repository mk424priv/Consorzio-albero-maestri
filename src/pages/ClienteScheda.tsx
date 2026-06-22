import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Banknote,
  ChevronRight,
  Clock,
  Copy,
  Fuel,
  Hammer,
  Hourglass,
  Mail,
  MapPin,
  MoreVertical,
  Pencil,
  Phone,
  Plus,
  ReceiptText,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/store/store";
import { useUI } from "@/store/ui";
import { useToast } from "@/store/toast";
import { codiceCliente } from "@/lib/codice-parlante";
import { riepilogoCliente, statoCalcolato } from "@/lib/conti";
import { feedCliente, type TipoEvento } from "@/lib/movimenti";
import { dataIT, euro, inputData, ore as fmtOre } from "@/lib/format";
import { etichetta, CATEGORIA_SPESA } from "@/lib/dominio";
import { ENTITA, type ChiaveEntita } from "@/lib/entita";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Cifra,
  Codice,
  EmptyState,
  Menu,
  RigaEditabile,
  Segmented,
  StatusBadge,
  Table,
  Th,
  type Cella,
} from "@/components/ui";

const TABS = [
  { k: "panoramica", label: "Panoramica" },
  { k: "lavori", label: "Lavori" },
  { k: "pagamenti", label: "Pagamenti" },
  { k: "ore", label: "Ore" },
  { k: "spese", label: "Spese" },
];

// Copia negli appunti con feedback.
function copia(testo: string, mostra: (m: string, t?: "success" | "error" | "info") => void, etichettaMsg = "Copiato") {
  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(testo).then(() => mostra(`${etichettaMsg} ✓`)).catch(() => mostra("Copia non riuscita", "error"));
  }
}
const parseNum = (s: string) => { const t = s.trim().replace(",", "."); return t === "" ? null : Number.isFinite(Number(t)) ? Number(t) : null; };

// Livello "gamificato" del cliente in base all'incassato di sempre.
function livelloCliente(incassato: number): { nome: string; grad: string } {
  if (incassato >= 10000) return { nome: "Platino", grad: "from-slate-400 to-slate-600" };
  if (incassato >= 5000) return { nome: "Oro", grad: "from-amber-400 to-amber-600" };
  if (incassato >= 2000) return { nome: "Argento", grad: "from-zinc-300 to-zinc-500" };
  if (incassato >= 500) return { nome: "Bronzo", grad: "from-orange-400 to-orange-600" };
  return { nome: "Nuovo", grad: "from-brand-400 to-brand-600" };
}

// Dashboard compatta e cliccabile → apre la sezione relativa.
function StatClic({ accent, label, valore, nota, icona, onClick }: { accent: ChiaveEntita; label: string; valore: React.ReactNode; nota?: string; icona: React.ReactNode; onClick: () => void }) {
  const meta = ENTITA[accent];
  return (
    <button onClick={onClick} className="relative overflow-hidden rounded-[12px] border border-line bg-surface p-2.5 pl-3 text-left shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
      <span className={cn("absolute inset-y-0 left-0 w-1", meta.dot)} />
      <div className="flex items-center justify-between gap-1">
        <span className="text-[0.6rem] font-bold uppercase tracking-wide text-muted">{label}</span>
        <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-[8px]", meta.soft)}>{icona}</span>
      </div>
      <div className="mt-0.5 font-display text-[1.05rem] font-bold leading-none text-ink">{valore}</div>
      <div className="mt-0.5 flex items-center gap-0.5 text-[0.6rem] text-muted">{nota}<ChevronRight size={10} className="ml-auto opacity-50" /></div>
    </button>
  );
}

export function ClienteScheda() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const db = useStore((s) => s.db);
  const apri = useUI((s) => s.apri);
  const chiediConferma = useUI((s) => s.chiediConferma);
  const eliminaCliente = useStore((s) => s.eliminaCliente);
  const mostra = useToast((s) => s.mostra);
  const [tab, setTab] = useState("panoramica");

  const cliente = db.clienti.find((c) => c.id === id);
  const dati = useMemo(() => {
    if (!cliente) return null;
    const codice = codiceCliente(db, id);
    return { codice, r: riepilogoCliente(db, id) };
  }, [db, id, cliente]);

  if (!cliente || !dati) {
    return <EmptyState titolo="Cliente non trovato" testo="Forse è stato eliminato." azione={<Button onClick={() => navigate("/")}>Torna allo Spazio</Button>} />;
  }
  const { codice, r } = dati;
  const nomeCompl = `${cliente.nome} ${cliente.cognome}`;
  const livello = livelloCliente(r.totaleIncassato);
  const pctIncasso = r.totaleAtteso > 0 ? Math.round((r.totaleIncassato / r.totaleAtteso) * 100) : 0;

  function elimina() {
    chiediConferma({
      titolo: "Eliminare il cliente?",
      descrizione: `${nomeCompl} e tutti i suoi lavori, ore e pagamenti.`,
      pericolo: true,
      testoConferma: "Elimina",
      onConfirm: () => { eliminaCliente(id); mostra("Cliente eliminato.", "info"); navigate("/"); },
    });
  }

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-ink">
        <ArrowLeft size={16} /> Indietro
      </button>

      {/* Hero compatto */}
      <Card className="mb-3 overflow-hidden">
        <div className="bg-gradient-to-br from-cliente-50 to-surface p-4">
          <div className="flex items-start gap-3.5">
            <Avatar nome={nomeCompl} size="lg" grad="bg-gradient-to-br from-cliente-500 to-brand-700" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <button onClick={() => copia(nomeCompl, mostra, "Nome copiato")} className="min-w-0 truncate text-left text-lg font-extrabold leading-tight text-ink" title="Tocca per copiare">{nomeCompl}</button>
                <Menu
                  trigger={<button className="grid h-8 w-8 place-items-center rounded-[10px] text-muted hover:bg-surface"><MoreVertical size={17} /></button>}
                  voci={[
                    { label: "Modifica", icona: <Pencil size={16} />, onClick: () => apri("cliente", { id }) },
                    { label: "Copia codice", icona: <Copy size={16} />, onClick: () => copia(codice, mostra, "Codice copiato") },
                    { label: "Elimina", icona: <Trash2 size={16} />, pericolo: true, separa: true, onClick: elimina },
                  ]}
                />
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <button onClick={() => copia(codice, mostra, "Codice copiato")} title="Tocca per copiare"><Codice codice={codice} /></button>
                <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${livello.grad} px-2 py-0.5 text-[0.66rem] font-bold text-white shadow-sm`}>
                  <Sparkles size={11} /> {livello.nome}
                </span>
                <Badge tono="brand">{etichetta(cliente.modalitaPredefinita)}</Badge>
                {cliente.tariffaOraria ? <span className="text-[0.76rem] text-muted">{euro(cliente.tariffaOraria)}/h</span> : null}
              </div>

              {/* contatti */}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {cliente.telefono && <a href={`tel:${cliente.telefono}`} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[0.76rem] font-semibold text-ink-soft transition hover:border-brand-200 hover:text-brand-600"><Phone size={13} /> {cliente.telefono}</a>}
                {cliente.email && <a href={`mailto:${cliente.email}`} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[0.76rem] font-semibold text-ink-soft transition hover:border-brand-200 hover:text-brand-600"><Mail size={13} /> Email</a>}
                {cliente.luogo && <a href={`https://maps.google.com/?q=${encodeURIComponent(cliente.luogo)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[0.76rem] font-semibold text-ink-soft transition hover:border-brand-200 hover:text-brand-600"><MapPin size={13} /> {cliente.luogo}</a>}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Dashboard COMPATTE e CLICCABILI → aprono la sezione */}
      <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatClic accent="entrata" label="Incassato" valore={<Cifra valore={r.totaleIncassato} />} nota={`${pctIncasso}% di ${euro(r.totaleAtteso)}`} icona={<Banknote size={14} />} onClick={() => setTab("pagamenti")} />
        <StatClic accent="uscita" label="Da incassare" valore={<Cifra valore={r.saldoDaIncassare} />} nota={r.saldoDaIncassare > 0 ? "ancora aperto" : "in regola"} icona={<Hourglass size={14} />} onClick={() => setTab("pagamenti")} />
        <StatClic accent="spesa" label="Spese" valore={<Cifra valore={r.spese} />} nota="attribuite" icona={<Fuel size={14} />} onClick={() => setTab("spese")} />
        <StatClic accent={r.margine >= 0 ? "entrata" : "spesa"} label="Margine" valore={<Cifra valore={r.margine} />} nota="netto" icona={<TrendingUp size={14} />} onClick={() => setTab("ore")} />
      </div>

      {/* relazioni rapide (cliccabili) */}
      <div className="mb-4 flex flex-wrap gap-1.5 text-[0.72rem] font-semibold">
        <button onClick={() => setTab("lavori")} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-ink-soft transition hover:border-lavoro-200"><Hammer size={12} className="text-lavoro-500" /> {r.numeroLavori} lavori</button>
        <button onClick={() => setTab("ore")} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-ink-soft transition hover:border-operatore-200"><Clock size={12} className="text-operatore-500" /> {fmtOre(r.oreTotali)}</button>
        <button onClick={() => setTab("ore")} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-ink-soft transition hover:border-uscita-200"><Users size={12} className="text-uscita-500" /> Manodopera {euro(r.costoManodopera)}</button>
      </div>

      <Segmented voci={TABS} attivo={tab} onChange={setTab} className="mb-4" />

      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
        {tab === "panoramica" && <Panoramica id={id} />}
        {tab === "lavori" && <SezioneLavori id={id} />}
        {tab === "pagamenti" && <SezionePagamenti id={id} />}
        {tab === "ore" && <SezioneOre id={id} />}
        {tab === "spese" && <SezioneSpese id={id} />}
      </motion.div>
    </div>
  );
}

/* azioni compatte per le righe (copia + elimina) */
function AzioniRiga({ onCopia, onElimina }: { onCopia: () => void; onElimina: () => void }) {
  return (
    <div className="flex justify-end gap-1">
      <button onClick={onCopia} aria-label="Copia" className="grid h-8 w-8 place-items-center rounded-[10px] text-muted transition hover:bg-brand-50 hover:text-brand-600"><Copy size={15} /></button>
      <button onClick={onElimina} aria-label="Elimina" className="grid h-8 w-8 place-items-center rounded-[10px] text-muted transition hover:bg-danger-soft hover:text-danger"><Trash2 size={15} /></button>
    </div>
  );
}

/* ----------------------------- Panoramica ----------------------------- */
const ICONA_EVENTO: Record<TipoEvento, keyof typeof ENTITA> = {
  lavoro: "lavoro", ore: "ore", pagamento: "entrata", spesa: "spesa", preventivo: "preventivo",
};
function Panoramica({ id }: { id: string }) {
  const db = useStore((s) => s.db);
  const apri = useUI((s) => s.apri);
  const eventi = useMemo(() => feedCliente(db, id), [db, id]);
  const azioni = [
    { tipo: "lavoro" as const, label: "Lavoro", Icona: Hammer, c: ENTITA.lavoro.soft },
    { tipo: "preventivo" as const, label: "Preventivo", Icona: ReceiptText, c: ENTITA.preventivo.soft },
    { tipo: "ore" as const, label: "Ore", Icona: Clock, c: ENTITA.operatore.soft },
    { tipo: "spesa" as const, label: "Spesa", Icona: Fuel, c: ENTITA.spesa.soft },
  ];
  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {azioni.map((a) => (
          <button key={a.tipo} onClick={() => apri(a.tipo, { clienteId: id })} className="flex flex-col items-center gap-2 rounded-[14px] border border-line bg-surface p-3.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
            <span className={`grid h-10 w-10 place-items-center rounded-[12px] ${a.c}`}><a.Icona size={18} /></span>
            {a.label}
          </button>
        ))}
      </div>
      <div>
        <h3 className="mb-3 text-[0.95rem] font-bold text-ink">Attività recente</h3>
        {eventi.length === 0 ? (
          <EmptyState testo="Ancora nessuna attività." />
        ) : (
          <Card className="divide-y divide-line overflow-hidden">
            {eventi.map((e) => {
              const meta = ENTITA[ICONA_EVENTO[e.tipo]];
              return (
                <div key={e.id} className="flex items-center gap-3 p-3.5">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[11px] ${meta.soft}`}><meta.Icon size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-ink">{meta.label}: {etichetta(e.titolo)}</div>
                    <div className="text-[0.74rem] text-muted">{dataIT(e.data)}{e.dettaglio ? ` · ${etichetta(e.dettaglio)}` : ""}</div>
                  </div>
                </div>
              );
            })}
          </Card>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- Lavori (cartelle) ------------------------------- */
function SezioneLavori({ id }: { id: string }) {
  const db = useStore((s) => s.db);
  const apri = useUI((s) => s.apri);
  const apriScheda = useUI((s) => s.apriSchedaLavoro);
  const mostra = useToast((s) => s.mostra);
  const lavori = db.lavori.filter((l) => l.clienteId === id).sort((a, b) => b.data.localeCompare(a.data));
  const operatore = (oid?: string | null) => db.operatori.find((o) => o.id === oid);
  return (
    <div>
      <div className="mb-3 flex justify-end"><Button variante="soft" dim="sm" onClick={() => apri("lavoro", { clienteId: id })}><Plus size={15} /> Lavoro</Button></div>
      {lavori.length === 0 ? <EmptyState icona={<Hammer size={24} />} testo="Nessun lavoro." /> : (
        <div className="grid gap-2">
          {lavori.map((l) => {
            const op = operatore(l.operatoreId);
            const oreReali = db.ore.filter((o) => o.lavoroId === l.id).reduce((a, o) => a + o.ore, 0);
            return (
              <button key={l.id} onClick={() => apriScheda(l.id)} className="group flex w-full items-center gap-3 rounded-[13px] border border-line bg-surface p-3 text-left shadow-[var(--shadow-sm)] transition hover:border-lavoro-200 hover:shadow-[var(--shadow-md)]">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[11px] ${ENTITA.lavoro.soft}`}><Hammer size={16} /></span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-ink">{l.titolo}</div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.74rem] text-muted">
                    {dataIT(l.data)}
                    {op && <span className="inline-flex items-center gap-1"><Avatar nome={op.nome} size="sm" grad={ENTITA.operatore.grad} className="!h-4 !w-4 !text-[0.5rem]" /> {op.nome}</span>}
                    {(oreReali > 0 || l.durataPrevistaOre != null) && (
                      <span className="inline-flex items-center gap-1 text-operatore-600"><Clock size={11} /> {oreReali}h{l.durataPrevistaOre != null ? `/${l.durataPrevistaOre}` : ""}</span>
                    )}
                  </div>
                </div>
                <StatusBadge genere="lavoro" valore={l.stato} />
                <Menu trigger={<span onClick={(e) => e.stopPropagation()} className="grid h-8 w-8 place-items-center rounded-[10px] text-muted hover:bg-canvas"><MoreVertical size={16} /></span>} voci={[
                  { label: "Apri cartella", icona: <ChevronRight size={15} />, onClick: () => apriScheda(l.id) },
                  { label: "Modifica", icona: <Pencil size={15} />, onClick: () => apri("lavoro", { id: l.id }) },
                  { label: "Copia titolo", icona: <Copy size={15} />, onClick: () => copia(l.titolo, mostra, "Titolo copiato") },
                ]} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Pagamenti ----------------------------- */
function SezionePagamenti({ id }: { id: string }) {
  const db = useStore((s) => s.db);
  const apri = useUI((s) => s.apri);
  const aggiorna = useStore((s) => s.aggiornaPagamento);
  const elimina = useStore((s) => s.eliminaPagamento);
  const chiediConferma = useUI((s) => s.chiediConferma);
  const mostra = useToast((s) => s.mostra);
  const pagamenti = db.pagamenti.filter((p) => p.clienteId === id).sort((a, b) => b.dataEmissione.localeCompare(a.dataEmissione));
  return (
    <div>
      <div className="mb-3 flex justify-end gap-2">
        <Button variante="soft" dim="sm" onClick={() => apri("preventivo", { clienteId: id })}><ReceiptText size={15} /> Preventivo</Button>
        <Button variante="soft" dim="sm" onClick={() => apri("incasso", { clienteId: id })}><Banknote size={15} /> Incasso</Button>
      </div>
      {pagamenti.length === 0 ? <EmptyState icona={<Banknote size={24} />} testo="Nessun pagamento." /> : (
        <Table>
          <thead><tr><Th></Th><Th>Emesso</Th><Th>Origine</Th><Th className="text-right">Atteso</Th><Th className="text-right">Incassato</Th><Th>Scadenza</Th><Th>Stato</Th><Th></Th></tr></thead>
          <tbody>
            {pagamenti.map((p) => {
              const st = statoCalcolato(p);
              const celle: Cella[] = [
                { tipo: "statico", nodo: dataIT(p.dataEmissione), classe: "text-muted whitespace-nowrap" },
                { tipo: "statico", nodo: etichetta(p.origine) },
                { tipo: "numero", nome: "atteso", valore: String(p.importoAtteso), step: "0.01", display: euro(p.importoAtteso), classe: "text-right tabular-nums" },
                { tipo: "statico", nodo: euro(p.importoIncassato), classe: "text-right tabular-nums text-entrata-600" },
                { tipo: "data", nome: "scadenza", valore: inputData(p.dataScadenza), display: p.dataScadenza ? dataIT(p.dataScadenza) : "—", classe: "whitespace-nowrap text-muted" },
                { tipo: "statico", nodo: <StatusBadge genere="pagamento" valore={st} /> },
              ];
              return (
                <RigaEditabile
                  key={p.id}
                  celle={celle}
                  onSave={(v) => { aggiorna(p.id, { importoAtteso: parseNum(v.atteso) ?? p.importoAtteso, dataScadenza: v.scadenza || null }); mostra("Pagamento aggiornato."); }}
                  azioni={
                    <div className="flex items-center justify-end gap-1">
                      {st !== "pagato" && <Button dim="sm" variante="soft" onClick={() => apri("riscuoti", { pagamentoId: p.id })}>Incassa</Button>}
                      <button onClick={() => copia(euro(p.importoAtteso), mostra, "Importo copiato")} aria-label="Copia" className="grid h-8 w-8 place-items-center rounded-[10px] text-muted hover:bg-brand-50 hover:text-brand-600"><Copy size={15} /></button>
                      <button onClick={() => chiediConferma({ titolo: "Eliminare il pagamento?", pericolo: true, testoConferma: "Elimina", onConfirm: () => elimina(p.id) })} aria-label="Elimina" className="grid h-8 w-8 place-items-center rounded-[10px] text-muted hover:bg-danger-soft hover:text-danger"><Trash2 size={15} /></button>
                    </div>
                  }
                />
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}

/* -------------------------------- Ore -------------------------------- */
function SezioneOre({ id }: { id: string }) {
  const db = useStore((s) => s.db);
  const apri = useUI((s) => s.apri);
  const aggiorna = useStore((s) => s.aggiornaOre);
  const elimina = useStore((s) => s.eliminaOre);
  const genera = useStore((s) => s.generaCompensoCliente);
  const chiediConferma = useUI((s) => s.chiediConferma);
  const mostra = useToast((s) => s.mostra);
  const ore = db.ore.filter((o) => o.clienteId === id).sort((a, b) => b.data.localeCompare(a.data));
  const opzioniOp = [{ v: "", l: "—" }, ...db.operatori.map((o) => ({ v: o.id, l: o.nome }))];
  const nomeOp = (oid?: string | null) => db.operatori.find((o) => o.id === oid)?.nome ?? "—";
  const r = riepilogoCliente(db, id);
  const oggi = new Date();
  function compenso() {
    const res = genera(id, oggi.getFullYear(), oggi.getMonth() + 1);
    mostra(res.messaggio, res.ok ? "success" : "error");
  }
  return (
    <div>
      <div className="mb-3 grid grid-cols-3 gap-2">
        {[
          { l: "Ore", v: fmtOre(r.oreTotali), c: "text-ink" },
          { l: "Manodopera", v: euro(r.costoManodopera), c: "text-uscita-600" },
          { l: "Fatturabile", v: euro(r.valoreFatturabile), c: "text-preventivo-600" },
        ].map((x) => (
          <button key={x.l} onClick={() => copia(x.v, mostra)} className="rounded-[12px] border border-line bg-surface p-2.5 text-center transition hover:border-brand-200" title="Tocca per copiare">
            <div className="text-[0.6rem] font-bold uppercase tracking-wide text-muted">{x.l}</div>
            <div className={cn("font-display text-[1rem] font-bold", x.c)}>{x.v}</div>
          </button>
        ))}
      </div>
      <div className="mb-3 flex justify-end gap-2">
        <Button variante="outline" dim="sm" onClick={compenso}><Sparkles size={15} /> Genera incasso del mese</Button>
        <Button variante="soft" dim="sm" onClick={() => apri("ore", { clienteId: id })}><Plus size={15} /> Ore</Button>
      </div>
      {ore.length === 0 ? <EmptyState icona={<Clock size={24} />} testo="Nessuna ora registrata." /> : (
        <Table>
          <thead><tr><Th></Th><Th>Data</Th><Th>Operatore</Th><Th className="text-right">Ore</Th><Th>Note</Th><Th></Th></tr></thead>
          <tbody>
            {ore.map((o) => {
              const celle: Cella[] = [
                { tipo: "data", nome: "data", valore: inputData(o.data), display: dataIT(o.data), classe: "whitespace-nowrap text-muted" },
                { tipo: "select", nome: "operatore", valore: o.operatoreId ?? "", opzioni: opzioniOp, display: nomeOp(o.operatoreId) },
                { tipo: "numero", nome: "ore", valore: String(o.ore), step: "0.5", display: <b className="text-ink">{fmtOre(o.ore)}</b>, classe: "text-right tabular-nums" },
                { tipo: "testo", nome: "note", valore: o.note ?? "", display: o.note || "—", classe: "text-muted" },
              ];
              return (
                <RigaEditabile
                  key={o.id}
                  celle={celle}
                  onSave={(v) => { aggiorna(o.id, { data: v.data || o.data, operatoreId: v.operatore || null, ore: parseNum(v.ore) ?? o.ore, note: v.note || null }); mostra("Ore aggiornate."); }}
                  azioni={<AzioniRiga onCopia={() => copia(`${o.ore}h ${nomeOp(o.operatoreId)} ${dataIT(o.data)}`, mostra)} onElimina={() => chiediConferma({ titolo: "Eliminare la registrazione?", pericolo: true, testoConferma: "Elimina", onConfirm: () => elimina(o.id) })} />}
                />
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}

/* ------------------------------- Spese ------------------------------- */
function SezioneSpese({ id }: { id: string }) {
  const db = useStore((s) => s.db);
  const apri = useUI((s) => s.apri);
  const aggiorna = useStore((s) => s.aggiornaSpesa);
  const elimina = useStore((s) => s.eliminaSpesa);
  const chiediConferma = useUI((s) => s.chiediConferma);
  const mostra = useToast((s) => s.mostra);
  const spese = db.spese.filter((s) => s.clienteId === id).sort((a, b) => b.data.localeCompare(a.data));
  const totale = spese.reduce((a, s) => a + s.importo, 0);
  const opzioniCat = CATEGORIA_SPESA.map((c) => ({ v: c, l: etichetta(c) }));
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <button onClick={() => copia(euro(totale), mostra)} className="text-sm font-semibold text-ink-soft" title="Tocca per copiare">Totale <b className="text-spesa-600">{euro(totale)}</b></button>
        <Button variante="soft" dim="sm" onClick={() => apri("spesa", { clienteId: id })}><Plus size={15} /> Spesa</Button>
      </div>
      {spese.length === 0 ? <EmptyState icona={<Fuel size={24} />} testo="Nessuna spesa attribuita." /> : (
        <Table>
          <thead><tr><Th></Th><Th>Data</Th><Th>Categoria</Th><Th className="text-right">Importo</Th><Th>Descrizione</Th><Th></Th></tr></thead>
          <tbody>
            {spese.map((s) => {
              const celle: Cella[] = [
                { tipo: "data", nome: "data", valore: inputData(s.data), display: dataIT(s.data), classe: "whitespace-nowrap text-muted" },
                { tipo: "select", nome: "categoria", valore: s.categoria, opzioni: opzioniCat, display: etichetta(s.categoria) },
                { tipo: "numero", nome: "importo", valore: String(s.importo), step: "0.01", display: <b className="text-spesa-600">{euro(s.importo)}</b>, classe: "text-right tabular-nums" },
                { tipo: "testo", nome: "descrizione", valore: s.descrizione ?? "", display: s.descrizione || "—", classe: "text-muted" },
              ];
              return (
                <RigaEditabile
                  key={s.id}
                  celle={celle}
                  onSave={(v) => { aggiorna(s.id, { data: v.data || s.data, categoria: (v.categoria as typeof s.categoria) || s.categoria, importo: parseNum(v.importo) ?? s.importo, descrizione: v.descrizione || null }); mostra("Spesa aggiornata."); }}
                  azioni={<AzioniRiga onCopia={() => copia(euro(s.importo), mostra, "Importo copiato")} onElimina={() => chiediConferma({ titolo: "Eliminare la spesa?", pericolo: true, testoConferma: "Elimina", onConfirm: () => elimina(s.id) })} />}
                />
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
