// CABINA DI REGIA — schermata principale per inserire un intervento dal
// campo in pochi tocchi. Al salvataggio i dati vengono smistati in automatico
// nelle aree secondarie (clienti, squadra, lavori, contabilità, calendario).
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Clock,
  Euro,
  HardHat,
  LogIn,
  LogOut,
  RotateCcw,
  Search,
  Sparkles,
  User,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/store/store";
import { useToast } from "@/store/toast";
import { festaDoppia } from "@/lib/festa";
import { inputData, euro } from "@/lib/format";
import { ENTITA } from "@/lib/entita";
import { Avatar, ChipPicker, AmountField, RuotaOrario, Stepper, type Orario } from "@/components/ui";

const parseNum = (s: string) => { const t = s.trim().replace(",", "."); return t === "" ? null : Number.isFinite(Number(t)) ? Number(t) : null; };
const due = (n: number) => String(n).padStart(2, "0");
const fmtOra = (o: Orario) => `${due(o.h)}:${due(o.m)}`;

// Blocco campo: etichetta grande + controllo. Pochi, chiari, grandi.
function Gruppo({ n, icona, titolo, tinta, children }: { n: number; icona: React.ReactNode; titolo: string; tinta: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[18px] border border-line bg-surface p-3.5 shadow-[var(--shadow-sm)]">
      <div className="mb-2.5 flex items-center gap-2.5">
        <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-[10px] text-white", tinta)}>{icona}</span>
        <h2 className="text-[0.95rem] font-bold text-ink">{titolo}</h2>
        <span className="ml-auto grid h-6 w-6 place-items-center rounded-full bg-surface-2 text-[0.7rem] font-bold text-muted">{n}</span>
      </div>
      {children}
    </section>
  );
}

export function Cantiere() {
  const db = useStore((s) => s.db);
  const creaCliente = useStore((s) => s.creaCliente);
  const registra = useStore((s) => s.registraIntervento);
  const mostra = useToast((s) => s.mostra);

  const oggi = inputData(new Date());
  const [data, setData] = useState(oggi);
  const [clienteId, setClienteId] = useState("");
  const [qCli, setQCli] = useState("");
  const [operatoreId, setOperatoreId] = useState("");
  const [arrivo, setArrivo] = useState<Orario>({ h: 8, m: 0 });
  const [uscita, setUscita] = useState<Orario>({ h: 17, m: 0 });
  const [oreStr, setOreStr] = useState("9");
  const [autoOre, setAutoOre] = useState(true);
  const [prezzo, setPrezzo] = useState("");
  const [resetKey, setResetKey] = useState(0);

  // Ore calcolate dagli orari (arrotondate ai 5 min → 0.05 h step).
  const oreAuto = useMemo(() => {
    const min = (uscita.h * 60 + uscita.m) - (arrivo.h * 60 + arrivo.m);
    return min > 0 ? Math.round((min / 60) * 100) / 100 : 0;
  }, [arrivo, uscita]);
  useEffect(() => { if (autoOre) setOreStr(String(oreAuto)); }, [oreAuto, autoOre]);

  const clienteSel = db.clienti.find((c) => c.id === clienteId);
  const suggeriti = useMemo(() => {
    const fl = qCli.trim().toLowerCase();
    if (!fl) return [];
    return db.clienti.filter((c) => `${c.nome} ${c.cognome}`.toLowerCase().includes(fl)).slice(0, 6);
  }, [db.clienti, qCli]);
  const recenti = useMemo(() => [...db.clienti].sort((a, b) => (b.creatoIl || "").localeCompare(a.creatoIl || "")).slice(0, 6), [db.clienti]);
  const operatoriChip = db.operatori.filter((o) => o.attivo).map((o) => ({ id: o.id, nome: o.nome }));

  const giornoLabel = new Date(data + "T00:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });

  function reset() {
    setData(oggi); setClienteId(""); setQCli(""); setOperatoreId("");
    setArrivo({ h: 8, m: 0 }); setUscita({ h: 17, m: 0 });
    setAutoOre(true); setOreStr("9"); setPrezzo("");
    setResetKey((k) => k + 1);
  }

  function salva() {
    let cid = clienteId;
    if (!cid && qCli.trim()) cid = creaCliente({ nome: qCli.trim(), cognome: "" });
    if (!cid) return mostra("Indica un cliente.", "info");
    registra({
      data,
      clienteId: cid,
      operatoreId: operatoreId || null,
      prezzo: parseNum(prezzo) ?? 0,
      ore: parseNum(oreStr) ?? 0,
      arrivo: fmtOra(arrivo),
      uscita: fmtOra(uscita),
    });
    festaDoppia("entrata");
    mostra("Intervento salvato e smistato ✓");
    reset();
  }

  return (
    <div className="mx-auto max-w-xl pb-24">
      {/* Hero compatto */}
      <div className="mb-4 flex items-center gap-3 rounded-[18px] bg-gradient-to-br from-brand-400 to-brand-600 p-4 text-white shadow-[var(--shadow-md)]">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-white/15 backdrop-blur"><HardHat size={22} /></span>
        <div className="min-w-0">
          <div className="text-[0.66rem] font-bold uppercase tracking-[0.12em] text-white/75">Cabina di regia</div>
          <h1 className="text-xl font-extrabold leading-tight">Nuovo intervento</h1>
        </div>
      </div>

      <div className="grid gap-3">
        {/* 1 — DATA */}
        <Gruppo n={1} icona={<Sparkles size={16} />} titolo="Data" tinta={ENTITA.lavoro.solid}>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setData(oggi)} className={cn("rounded-full border px-3 py-2 text-sm font-bold transition", data === oggi ? "border-brand-300 bg-brand-50 text-brand-600" : "border-line bg-surface text-muted")}>Oggi</button>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} className="h-11 flex-1 rounded-[12px] border border-line-strong bg-surface px-3 text-[1rem] font-semibold text-ink outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100" />
          </div>
          <div className="mt-1.5 pl-1 text-[0.72rem] capitalize text-muted">{giornoLabel}</div>
        </Gruppo>

        {/* 2 — CLIENTE */}
        <Gruppo n={2} icona={<User size={16} />} titolo="Cliente" tinta={ENTITA.cliente.solid}>
          {clienteSel ? (
            <div className="flex items-center justify-between rounded-[14px] border border-cliente-200 bg-cliente-50 px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <Avatar nome={`${clienteSel.nome} ${clienteSel.cognome}`} grad={ENTITA.cliente.grad} size="md" />
                <b className="truncate text-ink">{clienteSel.nome} {clienteSel.cognome}</b>
              </div>
              <button onClick={() => { setClienteId(""); setQCli(""); }} aria-label="Cambia" className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] text-muted hover:bg-surface"><X size={17} /></button>
            </div>
          ) : (
            <>
              <label className="flex items-center gap-2.5 rounded-[13px] border border-line-strong bg-surface px-3 py-2.5 focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-100">
                <Search size={18} className="text-muted" />
                <input value={qCli} onChange={(e) => setQCli(e.target.value)} placeholder="Cerca o scrivi un nome…" className="w-full bg-transparent text-[1rem] font-semibold text-ink outline-none placeholder:font-normal placeholder:text-muted/70" />
              </label>
              {suggeriti.length > 0 && (
                <div className="mt-2 grid gap-1.5">
                  {suggeriti.map((c) => (
                    <button key={c.id} onClick={() => { setClienteId(c.id); }} className="flex items-center gap-2.5 rounded-[12px] border border-line bg-surface px-3 py-2 text-left transition hover:border-cliente-200 hover:bg-cliente-50">
                      <Avatar nome={`${c.nome} ${c.cognome}`} grad={ENTITA.cliente.grad} size="sm" />
                      <span className="font-semibold text-ink">{c.nome} {c.cognome}</span>
                    </button>
                  ))}
                </div>
              )}
              {qCli.trim() === "" && recenti.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {recenti.map((c) => (
                    <button key={c.id} onClick={() => setClienteId(c.id)} className="rounded-full border border-line bg-surface px-3 py-1.5 text-[0.8rem] font-semibold text-ink-soft transition hover:border-cliente-200 hover:text-cliente-700">{c.nome} {c.cognome}</button>
                  ))}
                </div>
              )}
              {qCli.trim() !== "" && suggeriti.length === 0 && (
                <div className="mt-2 rounded-[12px] border border-dashed border-cliente-200 bg-cliente-50/60 px-3 py-2 text-[0.8rem] font-semibold text-cliente-700">Nuovo cliente: «{qCli.trim()}» (creato al salvataggio)</div>
              )}
            </>
          )}
        </Gruppo>

        {/* 3 — COLLABORATORE */}
        <Gruppo n={3} icona={<Users size={16} />} titolo="Collaboratore" tinta={ENTITA.operatore.solid}>
          {operatoriChip.length === 0 ? (
            <p className="text-[0.8rem] text-muted">Nessun collaboratore. Aggiungilo nell'area Squadra.</p>
          ) : (
            <ChipPicker tinta="operatore" items={operatoriChip} value={operatoreId} onChange={setOperatoreId} consentiNessuno />
          )}
        </Gruppo>

        {/* 4 — ORARI (rotella stile iPhone) */}
        <Gruppo n={4} icona={<Clock size={16} />} titolo="Orari in cantiere" tinta={ENTITA.ore.solid}>
          <div className="grid grid-cols-2 gap-3" key={resetKey}>
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 pl-1 text-[0.72rem] font-bold uppercase tracking-wide text-muted"><LogIn size={13} /> Arrivo</div>
              <RuotaOrario value={arrivo} onChange={setArrivo} />
            </div>
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 pl-1 text-[0.72rem] font-bold uppercase tracking-wide text-muted"><LogOut size={13} /> Uscita</div>
              <RuotaOrario value={uscita} onChange={setUscita} />
            </div>
          </div>
        </Gruppo>

        {/* 5 — ORE SVOLTE (auto + modificabili) */}
        <Gruppo n={5} icona={<Clock size={16} />} titolo="Ore svolte" tinta={ENTITA.operatore.solid}>
          <Stepper value={oreStr} onChange={(v) => { setOreStr(v); setAutoOre(false); }} step={0.5} presets={[4, 6, 8, 9]} tinta="operatore" />
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className={cn("rounded-full px-2.5 py-1 text-[0.68rem] font-bold", autoOre ? "bg-operatore-50 text-operatore-600" : "bg-warn-soft text-warn")}>
              {autoOre ? `calcolate da ${fmtOra(arrivo)}–${fmtOra(uscita)}` : "modificate a mano"}
            </span>
            {!autoOre && (
              <button onClick={() => setAutoOre(true)} className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-[0.68rem] font-bold text-muted hover:text-ink"><RotateCcw size={12} /> Ricalcola</button>
            )}
          </div>
        </Gruppo>

        {/* 6 — PREZZO */}
        <Gruppo n={6} icona={<Euro size={16} />} titolo="Prezzo del lavoro" tinta={ENTITA.entrata.solid}>
          <AmountField value={prezzo} onChange={setPrezzo} tinta="entrata" suggerimenti={[{ label: "50", valore: 50 }, { label: "100", valore: 100 }, { label: "200", valore: 200 }, { label: "500", valore: 500 }]} />
        </Gruppo>
      </div>

      {/* Riepilogo + Salva (sticky in basso) */}
      <div className="sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] z-20 mt-4 lg:bottom-4">
        <button onClick={salva} className="flex w-full items-center justify-center gap-2.5 rounded-[16px] bg-gradient-to-b from-brand-400 to-brand-500 py-4 text-[1.05rem] font-extrabold text-white shadow-[var(--shadow-glow)] transition active:scale-[0.99]">
          <Check size={22} /> Salva intervento
          <span className="ml-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[0.8rem] font-bold">{oreStr || 0}h · {euro(parseNum(prezzo) ?? 0)}</span>
        </button>
      </div>
    </div>
  );
}
