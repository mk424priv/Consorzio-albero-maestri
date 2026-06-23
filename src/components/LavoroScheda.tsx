// DETTAGLIO RECORD — schermo dedicato a un lavoro. Tutta l'economia da
// calcoloLavoro; azioni canoniche (fase, incasso, duplica, modifica, elimina).
import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Banknote, Clock, Copy, Euro, Fuel, Pencil, RotateCcw, Trash2, User, Users, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useIsDesktop } from "@/lib/hooks";
import { dialogVar, overlayVar, sheetMobile } from "@/lib/motion";
import { useStore } from "@/store/store";
import { useUI } from "@/store/ui";
import { useToast } from "@/store/toast";
import { calcoloLavoro, faseLavoro, modoLavoro, pagamentoApertoLavoro } from "@/lib/lavoro-calc";
import { statoCalcolato } from "@/lib/conti";
import { dataLungaIT, dataIT, euro } from "@/lib/format";
import { etichetta } from "@/lib/dominio";
import { ENTITA } from "@/lib/entita";
import type { Lavoro } from "@/lib/types";
import { Avatar, Barra, Button, EmptyState, StatusBadge } from "@/components/ui";

const GRAD_FASE: Record<string, string> = {
  fatto: "bg-gradient-to-br from-emerald-500 to-green-700",
  da_fare: "bg-gradient-to-br from-amber-500 to-orange-600",
};

function Sezione({ icona, titolo, accent, azione, children }: { icona: ReactNode; titolo: string; accent: string; azione?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[0.92rem] font-bold text-ink"><span className={cn("grid h-7 w-7 place-items-center rounded-[9px]", accent)}>{icona}</span>{titolo}</h3>
        {azione}
      </div>
      {children}
    </section>
  );
}

export function LavoroSchedaHost() {
  const id = useUI((s) => s.schedaLavoro);
  const chiudi = useUI((s) => s.chiudiSchedaLavoro);
  const db = useStore((s) => s.db);
  const lavoro = id ? db.lavori.find((l) => l.id === id) : undefined;
  return <LavoroScheda aperto={!!lavoro} lavoro={lavoro} onClose={chiudi} />;
}

function LavoroScheda({ aperto, lavoro, onClose }: { aperto: boolean; lavoro?: Lavoro; onClose: () => void }) {
  const desktop = useIsDesktop();
  return (
    <Dialog.Root open={aperto} onOpenChange={(o) => !o && onClose()}>
      <AnimatePresence>
        {aperto && lavoro && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div variants={overlayVar} initial="hidden" animate="show" exit="exit" className="fixed inset-0 z-[45] bg-ink/45 backdrop-blur-[3px]" />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount onOpenAutoFocus={(e) => e.preventDefault()} aria-describedby={undefined}>
              <motion.div
                key={lavoro.id}
                variants={desktop ? dialogVar : sheetMobile}
                initial="hidden" animate="show" exit="exit"
                className={cn("fixed z-[46] flex flex-col overflow-hidden border border-line bg-canvas shadow-[var(--shadow-lg)]", desktop ? "left-1/2 top-1/2 max-h-[90dvh] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-xl)]" : "inset-x-0 bottom-0 max-h-[94dvh] rounded-t-[var(--radius-xl)]")}
              >
                <Corpo lavoro={lavoro} desktop={desktop} onClose={onClose} />
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function Corpo({ lavoro: l, desktop, onClose }: { lavoro: Lavoro; desktop: boolean; onClose: () => void }) {
  const db = useStore((s) => s.db);
  const apri = useUI((s) => s.apri);
  const apriWizard = useUI((s) => s.apriWizard);
  const chiediConferma = useUI((s) => s.chiediConferma);
  const segnaFatto = useStore((s) => s.segnaFatto);
  const segnaDaFare = useStore((s) => s.segnaDaFare);
  const duplicaLavoro = useStore((s) => s.duplicaLavoro);
  const aggiornaTariffe = useStore((s) => s.aggiornaTariffeLavoro);
  const elimina = useStore((s) => s.eliminaLavoro);
  const eliminaSpesa = useStore((s) => s.eliminaSpesa);
  const mostra = useToast((s) => s.mostra);
  const navigate = useNavigate();

  const c = calcoloLavoro(db, l);
  const fase = faseLavoro(l);
  const modo = modoLavoro(l);
  const cli = db.clienti.find((x) => x.id === l.clienteId);
  const spese = db.spese.filter((s) => s.lavoroId === l.id).sort((a, b) => b.data.localeCompare(a.data));
  const pagamenti = db.pagamenti.filter((p) => p.lavoroId === l.id);

  function incassa() {
    const apId = pagamentoApertoLavoro(db, l.id);
    if (apId) apri("riscuoti", { pagamentoId: apId });
    else apri("incasso", { clienteId: l.clienteId, lavoroId: l.id });
  }
  function modifica() { onClose(); apriWizard(l.id); }
  function duplica() { duplicaLavoro(l.id); onClose(); mostra("Duplicato come piano 🗓️"); }
  function eliminaRec() {
    chiediConferma({ titolo: "Eliminare l'intervento?", descrizione: cli ? `${cli.nome} ${cli.cognome}` : undefined, pericolo: true, testoConferma: "Elimina", onConfirm: () => { elimina(l.id); onClose(); } });
  }
  function copia(t: string) { navigator?.clipboard?.writeText(t).then(() => mostra("Copiato ✓")).catch(() => {}); }

  return (
    <>
      {/* HEADER */}
      <div className={cn("relative shrink-0 overflow-hidden text-white", GRAD_FASE[fase])}>
        {!desktop && <div className="relative flex justify-center pt-2.5"><span className="h-1.5 w-10 rounded-full bg-white/45" /></div>}
        <div className="relative flex items-start justify-between gap-3 px-5 pb-4 pt-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-white/20 backdrop-blur">{modo === "preventivo" ? <Euro size={20} /> : <Clock size={20} />}</span>
            <div className="min-w-0">
              <Dialog.Title className="font-display text-lg font-bold leading-tight">{cli ? `${cli.nome} ${cli.cognome}` : "—"}</Dialog.Title>
              <div className="mt-0.5 text-[0.78rem] capitalize text-white/85">{dataLungaIT(l.data)}</div>
            </div>
          </div>
          <Dialog.Close asChild><button className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] text-white/80 hover:bg-white/20"><X size={18} /></button></Dialog.Close>
        </div>
        {/* fase stepper */}
        <div className="relative px-5 pb-4">
          <div className="flex gap-1 rounded-[12px] bg-white/15 p-1 backdrop-blur">
            <button onClick={() => segnaFatto(l.id)} className={cn("flex-1 rounded-[9px] px-2 py-1.5 text-[0.74rem] font-bold transition", fase === "fatto" ? "bg-white text-ink shadow-sm" : "text-white/80 hover:bg-white/15")}>Fatto</button>
            <button onClick={() => segnaDaFare(l.id)} className={cn("flex-1 rounded-[9px] px-2 py-1.5 text-[0.74rem] font-bold transition", fase === "da_fare" ? "bg-white text-ink shadow-sm" : "text-white/80 hover:bg-white/15")}>Da fare</button>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="grid gap-5 overflow-y-auto px-5 py-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
        {/* ECONOMIA */}
        <div className="rounded-[16px] border border-line bg-surface p-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[0.64rem] font-bold uppercase tracking-wide text-muted">{modo === "preventivo" ? "Prezzo" : "Lordo (ore)"}</div>
              <button onClick={() => copia(euro(c.lordo))} className="font-display text-[1.9rem] font-bold leading-none text-ink">{euro(c.lordo)}</button>
            </div>
            <div className="text-right">
              <div className="text-[0.6rem] font-bold uppercase tracking-wide text-muted">Netto</div>
              <div className={cn("font-display text-[1.4rem] font-bold", c.netto >= 0 ? "text-entrata-600" : "text-spesa-600")}>{euro(c.netto)}</div>
            </div>
          </div>
          {fase === "fatto" && c.lordo > 0 && (
            <>
              <Barra ratio={c.lordo > 0 ? c.incassato / c.lordo : 0} accent="entrata" className="my-2.5" />
              <div className="flex items-center justify-between text-[0.74rem] font-semibold">
                <span className="text-entrata-600">Incassato {euro(c.incassato)}</span>
                {c.daIncassare > 0 ? <span className="text-uscita-600">Resta {euro(c.daIncassare)}</span> : <span className="text-success">Saldato ✓</span>}
              </div>
              {c.daIncassare > 0 && <Button variante="primary" dim="lg" className="mt-3 w-full" onClick={incassa}><Banknote size={17} /> Incassa {euro(c.daIncassare)}</Button>}
            </>
          )}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[{ l: "Spese", v: euro(c.speseTotali), c: "text-spesa-600" }, { l: "Squadra", v: euro(c.costoCollaboratori), c: "text-uscita-600" }, { l: "Ore", v: `${c.oreTotali}h`, c: "text-operatore-600" }].map((x) => (
              <div key={x.l} className="rounded-[12px] border border-line bg-surface-2/50 p-2 text-center"><div className="text-[0.58rem] font-bold uppercase tracking-wide text-muted">{x.l}</div><div className={cn("font-display text-[0.92rem] font-bold", x.c)}>{x.v}</div></div>
            ))}
          </div>
        </div>

        {/* SQUADRA / ORE */}
        <Sezione icona={<Users size={15} />} titolo="Squadra e ore" accent={ENTITA.operatore.soft} azione={<Button variante="soft" dim="sm" onClick={modifica}><Pencil size={14} /> Modifica</Button>}>
          {c.partecipanti.length === 0 ? <EmptyState testo="Nessuna ora registrata." className="py-5" /> : (
            <div className="overflow-hidden rounded-[14px] border border-line bg-surface">
              {c.partecipanti.map((p, i) => (
                <div key={p.collaboratoreId} className={cn("flex items-center gap-2.5 p-3", i > 0 && "border-t border-line")}>
                  <Avatar nome={p.nome} size="sm" grad={ENTITA.operatore.grad} />
                  <div className="min-w-0 flex-1"><div className="truncate text-[0.82rem] font-semibold text-ink">{p.nome}</div><div className="text-[0.7rem] text-muted">{p.ore} h{p.costo > 0 ? ` · costo ${euro(p.costo)}` : " · io"}</div></div>
                  <span className="rounded-full bg-operatore-50 px-2 py-0.5 text-[0.72rem] font-bold text-operatore-600">{p.ore} h</span>
                </div>
              ))}
            </div>
          )}
        </Sezione>

        {/* PAGAMENTI */}
        {pagamenti.length > 0 && (
          <Sezione icona={<Banknote size={15} />} titolo="Pagamenti" accent={ENTITA.entrata.soft}>
            <div className="overflow-hidden rounded-[14px] border border-line bg-surface">
              {pagamenti.map((p, i) => {
                const st = statoCalcolato(p);
                const residuo = Math.max(0, p.importoAtteso - p.importoIncassato);
                return (
                  <div key={p.id} className={cn("flex items-center gap-2.5 p-3", i > 0 && "border-t border-line")}>
                    <div className="min-w-0 flex-1"><div className="text-[0.8rem] font-semibold text-ink">{euro(p.importoIncassato)} <span className="text-muted">/ {euro(p.importoAtteso)}</span></div><div className="text-[0.7rem] text-muted">{dataIT(p.dataEmissione)}</div></div>
                    <StatusBadge genere="pagamento" valore={st} />
                    {residuo > 0.005 && <Button variante="soft" dim="sm" onClick={() => apri("riscuoti", { pagamentoId: p.id })}><Banknote size={14} /></Button>}
                  </div>
                );
              })}
            </div>
          </Sezione>
        )}

        {/* SPESE */}
        <Sezione icona={<Fuel size={15} />} titolo="Spese" accent={ENTITA.spesa.soft} azione={<Button variante="soft" dim="sm" onClick={() => apri("spesa", { clienteId: l.clienteId, lavoroId: l.id, data: l.data })}><Pencil size={14} /> Aggiungi</Button>}>
          {spese.length === 0 ? <EmptyState testo="Nessuna spesa." className="py-5" /> : (
            <div className="overflow-hidden rounded-[14px] border border-line bg-surface">
              {spese.map((s, i) => (
                <div key={s.id} className={cn("flex items-center gap-2.5 p-3", i > 0 && "border-t border-line")}>
                  <span className={cn("grid h-8 w-8 place-items-center rounded-[10px]", ENTITA.spesa.soft)}><Fuel size={15} /></span>
                  <div className="min-w-0 flex-1"><div className="truncate text-[0.8rem] font-semibold text-ink">{s.descrizione || etichetta(s.categoria)}</div><div className="text-[0.7rem] text-muted">{dataIT(s.data)}</div></div>
                  <span className="font-semibold tabular-nums text-spesa-600">− {euro(s.importo)}</span>
                  <button onClick={() => eliminaSpesa(s.id)} className="grid h-8 w-8 place-items-center rounded-[10px] text-muted hover:bg-danger-soft hover:text-danger"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </Sezione>

        {/* AZIONI */}
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <Button variante="outline" onClick={modifica}><Pencil size={15} /> Modifica</Button>
          <Button variante="outline" onClick={duplica}><Copy size={15} /> Duplica</Button>
          <Button variante="outline" onClick={() => { navigate(`/cliente/${l.clienteId}`); onClose(); }}><User size={15} /> Cliente</Button>
          <Button variante="ghost" dim="sm" onClick={() => { aggiornaTariffe(l.id); mostra("Tariffe aggiornate."); }}><RotateCcw size={14} /> Tariffe</Button>
          <Button variante="danger" dim="icon" className="ml-auto" onClick={eliminaRec} aria-label="Elimina"><Trash2 size={16} /></Button>
        </div>
      </div>
    </>
  );
}
