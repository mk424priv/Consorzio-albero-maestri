// EDITOR CARD AGENDA — foglio leggero per una card di lavoro: fascia oraria,
// cliente, prezzo, intervento, stato pagamento. Salva un Lavoro reale.
import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { AlignLeft, Banknote, Check, Clock, Euro, Search, Trash2, User, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useIsDesktop } from "@/lib/hooks";
import { dialogVar, overlayVar, sheetMobile } from "@/lib/motion";
import { useStore } from "@/store/store";
import { useUI } from "@/store/ui";
import { useToast } from "@/store/toast";
import { festaDoppia } from "@/lib/festa";
import { operatoreIo, calcoloLavoro } from "@/lib/lavoro-calc";
import { inputData } from "@/lib/format";
import { ENTITA } from "@/lib/entita";
import { Avatar, Button, RuotaOrario, type Orario } from "@/components/ui";

const n = (s: string) => { const t = (s ?? "").trim().replace(",", "."); return t === "" ? 0 : Number.isFinite(Number(t)) ? Number(t) : 0; };
const due = (x: number) => String(x).padStart(2, "0");
const fmtOra = (o: Orario) => `${due(o.h)}:${due(o.m)}`;
const parseOra = (s?: string | null, fb: Orario = { h: 8, m: 0 }): Orario => {
  if (!s) return fb; const [h, m] = s.split(":").map(Number); return { h: h || 0, m: m || 0 };
};

export function CardLavoroEditorHost() {
  const c = useUI((s) => s.cardLavoro);
  const chiudi = useUI((s) => s.chiudiCard);
  const desktop = useIsDesktop();
  return (
    <Dialog.Root open={!!c} onOpenChange={(o) => !o && chiudi()}>
      <AnimatePresence>
        {c && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div variants={overlayVar} initial="hidden" animate="show" exit="exit" className="fixed inset-0 z-50 bg-ink/45 backdrop-blur-[3px]" />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount onOpenAutoFocus={(e) => e.preventDefault()} aria-describedby={undefined}>
              <motion.div
                key={c.seq}
                variants={desktop ? dialogVar : sheetMobile}
                initial="hidden" animate="show" exit="exit"
                className={cn("fixed z-50 flex flex-col overflow-hidden border border-line bg-canvas shadow-[var(--shadow-lg)]", desktop ? "left-1/2 top-1/2 max-h-[92dvh] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-xl)]" : "inset-x-0 bottom-0 max-h-[94dvh] rounded-t-[var(--radius-xl)]")}
              >
                <Editor lavoroId={c.lavoroId} dataIniziale={c.data} onClose={chiudi} desktop={desktop} />
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function Editor({ lavoroId, dataIniziale, onClose, desktop }: { lavoroId?: string; dataIniziale?: string; onClose: () => void; desktop: boolean }) {
  const db = useStore((s) => s.db);
  const salva = useStore((s) => s.salvaLavoro);
  const segnaSaldato = useStore((s) => s.segnaSaldato);
  const elimina = useStore((s) => s.eliminaLavoro);
  const creaCliente = useStore((s) => s.creaCliente);
  const chiediConferma = useUI((s) => s.chiediConferma);
  const mostra = useToast((s) => s.mostra);
  const io = operatoreIo(db);
  const oggi = inputData(new Date());

  const esistente = lavoroId ? db.lavori.find((l) => l.id === lavoroId) : undefined;
  const [data, setData] = useState(esistente?.data ?? dataIniziale ?? oggi);
  const [inizio, setInizio] = useState<Orario>(parseOra(esistente?.oraInizio, { h: 8, m: 0 }));
  const [fine, setFine] = useState<Orario>(parseOra(esistente?.oraFine, { h: 12, m: 0 }));
  const [clienteId, setClienteId] = useState(esistente?.clienteId ?? "");
  const [qCli, setQCli] = useState("");
  const [prezzo, setPrezzo] = useState(esistente?.prezzo != null ? String(esistente.prezzo) : "");
  const [intervento, setIntervento] = useState(esistente?.descrizione ?? "");
  const [saldato, setSaldato] = useState(esistente ? calcoloLavoro(db, esistente).statoIncasso === "pagato" : false);

  const clienteSel = db.clienti.find((c) => c.id === clienteId);
  const nomeCliente = clienteSel ? `${clienteSel.nome} ${clienteSel.cognome}`.trim() : qCli.trim();
  const durata = useMemo(() => { const m = (fine.h * 60 + fine.m) - (inizio.h * 60 + inizio.m); return m > 0 ? Math.round((m / 60) * 100) / 100 : 0; }, [inizio, fine]);
  const fase = data > oggi ? "da_fare" : "fatto";

  const suggeriti = useMemo(() => {
    const fl = qCli.trim().toLowerCase();
    if (!fl) return [];
    return db.clienti.filter((c) => `${c.nome} ${c.cognome}`.toLowerCase().includes(fl)).slice(0, 5);
  }, [db.clienti, qCli]);
  const recenti = useMemo(() => [...db.clienti].sort((a, b) => (b.creatoIl || "").localeCompare(a.creatoIl || "")).slice(0, 6), [db.clienti]);

  function salvaCard() {
    let cid = clienteId;
    if (!cid && nomeCliente) cid = creaCliente({ nome: nomeCliente, cognome: "" });
    if (!cid) return mostra("Indica un cliente.", "info");
    const id = salva({
      id: lavoroId,
      clienteId: cid,
      fase,
      modo: "preventivo",
      conteggio: "totale",
      data,
      prezzo: n(prezzo),
      oraInizio: fmtOra(inizio),
      oraFine: fmtOra(fine),
      descrizione: intervento || null,
      partecipanti: io ? [{ collaboratoreId: io.id, oreTotale: durata }] : [],
    });
    if (fase === "fatto") segnaSaldato(id, saldato);
    festaDoppia("entrata");
    mostra(lavoroId ? "Lavoro aggiornato ✓" : "Lavoro salvato ✓");
    onClose();
  }
  function eliminaCard() {
    if (!lavoroId) return onClose();
    chiediConferma({ titolo: "Eliminare il lavoro?", pericolo: true, testoConferma: "Elimina", onConfirm: () => { elimina(lavoroId); onClose(); } });
  }

  return (
    <>
      <div className="flex items-center gap-3 border-b border-line bg-surface/90 px-4 py-3 backdrop-blur">
        {!desktop && <div className="absolute inset-x-0 top-1.5 flex justify-center"><span className="h-1.5 w-10 rounded-full bg-line-strong" /></div>}
        <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-[11px] text-muted hover:bg-surface-2"><X size={18} /></button>
        <div className="flex-1">
          <div className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-muted">{lavoroId ? "Modifica" : "Nuovo"} lavoro</div>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} className="bg-transparent text-[0.9rem] font-bold text-ink outline-none" />
        </div>
        {lavoroId && <button onClick={eliminaCard} className="grid h-9 w-9 place-items-center rounded-[11px] text-muted hover:bg-danger-soft hover:text-danger"><Trash2 size={17} /></button>}
      </div>

      <div className="grid gap-3 overflow-y-auto px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        {/* FASCIA ORARIA */}
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[0.66rem] font-bold uppercase tracking-wide text-muted"><Clock size={13} /> Fascia oraria · {durata}h</div>
          <div className="grid grid-cols-2 gap-3">
            <div><div className="mb-1 pl-1 text-[0.66rem] font-bold text-muted">Inizio</div><RuotaOrario value={inizio} onChange={setInizio} /></div>
            <div><div className="mb-1 pl-1 text-[0.66rem] font-bold text-muted">Fine</div><RuotaOrario value={fine} onChange={setFine} /></div>
          </div>
        </div>

        {/* CLIENTE */}
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[0.66rem] font-bold uppercase tracking-wide text-muted"><User size={13} /> Cliente</div>
          {clienteSel ? (
            <div className="flex items-center justify-between rounded-[13px] border border-cliente-200 bg-cliente-50 px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5"><Avatar nome={nomeCliente} grad={ENTITA.cliente.grad} size="sm" /><b className="truncate text-ink">{nomeCliente}</b></div>
              <button onClick={() => { setClienteId(""); setQCli(""); }} className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] text-muted hover:bg-surface"><X size={16} /></button>
            </div>
          ) : (
            <>
              <label className="flex items-center gap-2.5 rounded-[12px] border border-line-strong bg-surface px-3 py-2.5 focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-100">
                <Search size={17} className="text-muted" />
                <input value={qCli} onChange={(e) => setQCli(e.target.value)} placeholder="Cerca o scrivi…" className="w-full bg-transparent text-[1rem] font-semibold text-ink outline-none placeholder:font-normal placeholder:text-muted/70" />
              </label>
              {suggeriti.length > 0 && (
                <div className="mt-1.5 grid gap-1">
                  {suggeriti.map((c) => <button key={c.id} onClick={() => setClienteId(c.id)} className="flex items-center gap-2 rounded-[10px] border border-line bg-surface px-3 py-2 text-left text-[0.88rem] font-semibold text-ink hover:border-cliente-200 hover:bg-cliente-50"><Avatar nome={`${c.nome} ${c.cognome}`} grad={ENTITA.cliente.grad} size="sm" className="!h-6 !w-6 !text-[0.55rem]" /> {c.nome} {c.cognome}</button>)}
                </div>
              )}
              {qCli.trim() === "" && recenti.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {recenti.map((c) => <button key={c.id} onClick={() => setClienteId(c.id)} className="rounded-full border border-line bg-surface px-2.5 py-1 text-[0.78rem] font-semibold text-ink-soft hover:border-cliente-200">{c.nome} {c.cognome}</button>)}
                </div>
              )}
            </>
          )}
        </div>

        {/* PREZZO */}
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[0.66rem] font-bold uppercase tracking-wide text-muted"><Euro size={13} /> Prezzo</div>
          <div className="flex items-center justify-center gap-1.5 rounded-[13px] border border-line-strong bg-surface-2 py-3">
            <span className="font-display text-xl font-bold text-muted">€</span>
            <input inputMode="decimal" value={prezzo} onChange={(e) => setPrezzo(e.target.value)} placeholder="0" className="w-28 bg-transparent text-center font-display text-[1.8rem] font-bold text-ink outline-none placeholder:text-line-strong" />
          </div>
        </div>

        {/* INTERVENTO */}
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[0.66rem] font-bold uppercase tracking-wide text-muted"><AlignLeft size={13} /> Intervento</div>
          <textarea value={intervento} onChange={(e) => setIntervento(e.target.value)} rows={2} placeholder="Cosa è stato fatto / da fare…" className="w-full resize-none rounded-[12px] border border-line-strong bg-surface px-3 py-2.5 text-[1rem] text-ink outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100 placeholder:text-muted/70" />
        </div>

        {/* STATO PAGAMENTO */}
        {fase === "fatto" && (
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-[0.66rem] font-bold uppercase tracking-wide text-muted"><Banknote size={13} /> Stato pagamento</div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setSaldato(false)} className={cn("rounded-[12px] border px-3 py-3 text-sm font-bold transition", !saldato ? "border-uscita-300 bg-uscita-50 text-uscita-700 ring-2 ring-uscita-100" : "border-line bg-surface text-muted")}>Da saldare</button>
              <button onClick={() => setSaldato(true)} className={cn("rounded-[12px] border px-3 py-3 text-sm font-bold transition", saldato ? "border-entrata-300 bg-entrata-50 text-entrata-700 ring-2 ring-entrata-100" : "border-line bg-surface text-muted")}>Saldato</button>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-line bg-surface/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3 backdrop-blur">
        <Button variante="primary" dim="lg" className="w-full" onClick={salvaCard}><Check size={20} /> Salva lavoro</Button>
      </div>
    </>
  );
}
