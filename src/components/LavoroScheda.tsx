// Schermo dedicato a un singolo lavoro: tutto ciò che serve in un'unica
// scena, senza saltare alle pagine generali. Si apre toccando una carta
// dell'Agenda (useUI.apriSchedaLavoro).
import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Banknote,
  Clock,
  Fuel,
  Hammer,
  MapPin,
  Pencil,
  Plus,
  ReceiptText,
  StickyNote,
  Trash2,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useIsDesktop } from "@/lib/hooks";
import { dialogVar, overlayVar, sheetMobile } from "@/lib/motion";
import { useStore } from "@/store/store";
import { useUI } from "@/store/ui";
import { riepilogoLavoro, statoCalcolato } from "@/lib/conti";
import { dataIT, dataLungaIT, euro } from "@/lib/format";
import { etichetta, STATO_LAVORO, type StatoLavoro } from "@/lib/dominio";
import { ENTITA } from "@/lib/entita";
import type { Lavoro } from "@/lib/types";
import { Avatar, Badge, Barra, Button, EmptyState, RingStat, StatusBadge } from "@/components/ui";

const STATO_GRAD: Record<StatoLavoro, string> = {
  da_fare: "bg-gradient-to-br from-lavoro-500 to-lavoro-700",
  in_corso: "bg-gradient-to-br from-amber-500 to-orange-600",
  fatto: "bg-gradient-to-br from-emerald-500 to-green-700",
};

function Sezione({ icona, titolo, accent, azione, children }: { icona: ReactNode; titolo: string; accent: string; azione?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[0.92rem] font-bold text-ink">
          <span className={cn("grid h-7 w-7 place-items-center rounded-[9px]", accent)}>{icona}</span>
          {titolo}
        </h3>
        {azione}
      </div>
      {children}
    </section>
  );
}

function Tile({ label, valore, tinta }: { label: string; valore: string; tinta: string }) {
  return (
    <div className="rounded-[12px] border border-line bg-surface p-2.5 text-center">
      <div className="text-[0.6rem] font-bold uppercase tracking-wide text-muted">{label}</div>
      <div className={cn("mt-0.5 font-display text-[0.95rem] font-bold", tinta)}>{valore}</div>
    </div>
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
  const db = useStore((s) => s.db);
  const cambia = useStore((s) => s.cambiaStatoLavoro);
  const elimina = useStore((s) => s.eliminaLavoro);
  const apri = useUI((s) => s.apri);
  const chiediConferma = useUI((s) => s.chiediConferma);
  const navigate = useNavigate();

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
                initial="hidden"
                animate="show"
                exit="exit"
                className={cn(
                  "fixed z-[46] flex flex-col overflow-hidden border border-line bg-canvas shadow-[var(--shadow-lg)]",
                  desktop
                    ? "left-1/2 top-1/2 max-h-[90dvh] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-xl)]"
                    : "inset-x-0 bottom-0 max-h-[94dvh] rounded-t-[var(--radius-xl)]",
                )}
              >
                <Corpo lavoro={lavoro} db={db} desktop={desktop} cambia={cambia} elimina={elimina} apri={apri} chiediConferma={chiediConferma} navigate={navigate} onClose={onClose} />
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function Corpo({
  lavoro: l,
  db,
  desktop,
  cambia,
  elimina,
  apri,
  chiediConferma,
  navigate,
  onClose,
}: {
  lavoro: Lavoro;
  db: ReturnType<typeof useStore.getState>["db"];
  desktop: boolean;
  cambia: (id: string, stato: StatoLavoro) => void;
  elimina: (id: string) => void;
  apri: ReturnType<typeof useUI.getState>["apri"];
  chiediConferma: ReturnType<typeof useUI.getState>["chiediConferma"];
  navigate: ReturnType<typeof useNavigate>;
  onClose: () => void;
}) {
  const r = riepilogoLavoro(db, l.id);
  const cli = db.clienti.find((c) => c.id === l.clienteId);
  const op = db.operatori.find((o) => o.id === l.operatoreId);
  const oreEntries = db.ore.filter((o) => o.lavoroId === l.id).sort((a, b) => b.data.localeCompare(a.data));
  const pagamenti = db.pagamenti.filter((p) => p.lavoroId === l.id).sort((a, b) => b.dataEmissione.localeCompare(a.dataEmissione));
  const spese = db.spese.filter((s) => s.lavoroId === l.id).sort((a, b) => b.data.localeCompare(a.data));
  const ratioOre = r.durataPrevista && r.durataPrevista > 0 ? r.oreReali / r.durataPrevista : 0;

  function riscuoti() {
    if (r.pagamentoApertoId) apri("riscuoti", { pagamentoId: r.pagamentoApertoId });
    else apri("incasso", { clienteId: l.clienteId, lavoroId: l.id });
  }
  function eliminaLavoro() {
    chiediConferma({
      titolo: "Eliminare il lavoro?",
      descrizione: `${l.titolo} e i collegamenti restano nello storico del cliente.`,
      pericolo: true,
      testoConferma: "Elimina",
      onConfirm: () => { elimina(l.id); onClose(); },
    });
  }

  return (
    <>
      {/* INTESTAZIONE colorata in base allo stato */}
      <div className={cn("relative shrink-0 overflow-hidden text-white", STATO_GRAD[l.stato])}>
        <div className="pointer-events-none absolute -right-8 -top-10 text-white/10"><Hammer size={140} strokeWidth={1.1} /></div>
        {!desktop && <div className="relative flex justify-center pt-2.5"><span className="h-1.5 w-10 rounded-full bg-white/45" /></div>}
        <div className="relative flex items-start justify-between gap-3 px-5 pb-4 pt-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-white/20 backdrop-blur"><Hammer size={20} /></span>
            <div className="min-w-0">
              <Dialog.Title className="font-display text-lg font-bold leading-tight">{l.titolo}</Dialog.Title>
              <button onClick={() => { navigate(`/cliente/${l.clienteId}`); onClose(); }} className="mt-0.5 block truncate text-left text-[0.82rem] text-white/85 hover:underline">
                {cli ? `${cli.nome} ${cli.cognome}` : "—"}
              </button>
            </div>
          </div>
          <Dialog.Close asChild>
            <button aria-label="Chiudi" className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] text-white/80 transition hover:bg-white/20 hover:text-white"><X size={18} /></button>
          </Dialog.Close>
        </div>
        {/* meta riga */}
        <div className="relative flex flex-wrap items-center gap-2 px-5 pb-3 text-[0.74rem] text-white/85">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 font-semibold backdrop-blur">{dataLungaIT(l.data)}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 font-semibold backdrop-blur">{etichetta(l.tipoCompenso)}</span>
          {op && <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 font-semibold backdrop-blur"><Avatar nome={op.nome} size="sm" grad="bg-white/30" className="!h-4 !w-4 !text-[0.5rem]" /> {op.nome}</span>}
          {l.luogo && <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 font-semibold backdrop-blur"><MapPin size={12} /> {l.luogo}</span>}
        </div>
        {/* stepper di stato */}
        <div className="relative px-5 pb-4">
          <div className="flex gap-1 rounded-[12px] bg-white/15 p-1 backdrop-blur">
            {STATO_LAVORO.map((k) => (
              <button key={k} onClick={() => cambia(l.id, k)} className={cn("flex-1 rounded-[9px] px-2 py-1.5 text-[0.74rem] font-bold transition", l.stato === k ? "bg-white text-ink shadow-sm" : "text-white/80 hover:bg-white/15")}>
                {etichetta(k)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CORPO scorrevole */}
      <div className="grid gap-5 overflow-y-auto px-5 py-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
        {/* SOLDI */}
        <div className="rounded-[16px] border border-line bg-surface p-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <div className="text-[0.64rem] font-bold uppercase tracking-wide text-muted">Da prendere</div>
              <div className="font-display text-[1.9rem] font-bold leading-none text-ink">{euro(r.daPrendere)}</div>
              <Barra ratio={r.daPrendere > 0 ? r.incassato / r.daPrendere : l.stato === "fatto" ? 1 : 0} accent="entrata" className="my-2" />
              <div className="flex items-center justify-between text-[0.74rem] font-semibold">
                <span className="text-entrata-600">Incassato {euro(r.incassato)}</span>
                {r.residuo > 0 ? <span className="text-uscita-600">Resta {euro(r.residuo)}</span> : <span className="text-success">Saldato ✓</span>}
              </div>
            </div>
            <RingStat accent="entrata" ratio={r.daPrendere > 0 ? r.incassato / r.daPrendere : l.stato === "fatto" ? 1 : 0} label="Incasso" valore={euro(r.incassato)} className="hidden shrink-0 border-0 p-0 shadow-none sm:flex" />
          </div>
          {r.residuo > 0 && (
            <Button variante="primary" dim="lg" className="mt-3 w-full" onClick={riscuoti}><Banknote size={17} /> Incassa {euro(r.residuo)}</Button>
          )}
        </div>

        {/* MINI METRICHE */}
        <div className="grid grid-cols-3 gap-2">
          <Tile label="Manodopera" valore={euro(r.costoManodopera)} tinta="text-uscita-600" />
          <Tile label="Spese" valore={euro(r.spese)} tinta="text-spesa-600" />
          <Tile label="Margine" valore={euro(r.margine)} tinta={r.margine >= 0 ? "text-entrata-600" : "text-spesa-600"} />
        </div>

        {/* ORE */}
        <Sezione
          icona={<Clock size={15} />}
          titolo="Ore"
          accent={ENTITA.operatore.soft}
          azione={<Button variante="soft" dim="sm" onClick={() => apri("ore", { clienteId: l.clienteId, operatoreId: l.operatoreId ?? undefined, lavoroId: l.id, data: l.data })}><Plus size={14} /> Registra</Button>}
        >
          <div className="rounded-[14px] border border-line bg-surface p-3">
            <div className="flex items-center justify-between text-[0.78rem] font-semibold">
              <span className="text-ink">{r.oreReali} h svolte</span>
              <span className="text-muted">{r.durataPrevista != null ? `stima ${r.durataPrevista} h` : "nessuna stima"}</span>
            </div>
            {r.durataPrevista != null && <Barra ratio={ratioOre} accent="operatore" className="mt-2" />}
            {oreEntries.length > 0 && (
              <div className="mt-3 divide-y divide-line">
                {oreEntries.map((o) => {
                  const opp = db.operatori.find((x) => x.id === o.operatoreId);
                  return (
                    <div key={o.id} className="flex items-center gap-2.5 py-2">
                      <Avatar nome={opp?.nome ?? "?"} size="sm" grad={ENTITA.operatore.grad} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[0.8rem] font-semibold text-ink">{opp?.nome ?? "—"}</div>
                        <div className="text-[0.7rem] text-muted">{dataIT(o.data)}{o.note ? ` · ${o.note}` : ""}</div>
                      </div>
                      <span className="rounded-full bg-operatore-50 px-2 py-0.5 text-[0.72rem] font-bold text-operatore-600">{o.ore} h</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Sezione>

        {/* PAGAMENTI */}
        <Sezione
          icona={<Banknote size={15} />}
          titolo="Pagamenti"
          accent={ENTITA.entrata.soft}
          azione={<Button variante="soft" dim="sm" onClick={() => apri("incasso", { clienteId: l.clienteId, lavoroId: l.id })}><Plus size={14} /> Incasso</Button>}
        >
          {pagamenti.length === 0 ? (
            <EmptyState icona={<Banknote size={22} />} testo="Nessun pagamento collegato a questo lavoro." className="py-6" />
          ) : (
            <div className="overflow-hidden rounded-[14px] border border-line bg-surface">
              {pagamenti.map((p, i) => {
                const st = statoCalcolato(p);
                const residuo = Math.max(0, p.importoAtteso - p.importoIncassato);
                return (
                  <div key={p.id} className={cn("flex items-center gap-2.5 p-3", i > 0 && "border-t border-line")}>
                    <div className="min-w-0 flex-1">
                      <div className="text-[0.8rem] font-semibold text-ink">{euro(p.importoIncassato)} <span className="text-muted">/ {euro(p.importoAtteso)}</span></div>
                      <div className="text-[0.7rem] text-muted">{etichetta(p.origine)} · {dataIT(p.dataEmissione)}</div>
                    </div>
                    <StatusBadge genere="pagamento" valore={st} />
                    {residuo > 0.005 && <Button variante="soft" dim="sm" onClick={() => apri("riscuoti", { pagamentoId: p.id })}><Banknote size={14} /> Incassa</Button>}
                  </div>
                );
              })}
            </div>
          )}
        </Sezione>

        {/* SPESE */}
        <Sezione
          icona={<Fuel size={15} />}
          titolo="Spese"
          accent={ENTITA.spesa.soft}
          azione={<Button variante="soft" dim="sm" onClick={() => apri("spesa", { clienteId: l.clienteId, lavoroId: l.id, data: l.data })}><Plus size={14} /> Spesa</Button>}
        >
          {spese.length === 0 ? (
            <EmptyState icona={<Fuel size={22} />} testo="Nessuna spesa su questo lavoro." className="py-6" />
          ) : (
            <div className="overflow-hidden rounded-[14px] border border-line bg-surface">
              {spese.map((s, i) => (
                <div key={s.id} className={cn("flex items-center gap-2.5 p-3", i > 0 && "border-t border-line")}>
                  <span className={cn("grid h-8 w-8 place-items-center rounded-[10px]", ENTITA.spesa.soft)}><Fuel size={15} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[0.8rem] font-semibold text-ink">{s.descrizione || etichetta(s.categoria)}</div>
                    <div className="text-[0.7rem] text-muted">{etichetta(s.categoria)} · {dataIT(s.data)}</div>
                  </div>
                  <span className="font-semibold tabular-nums text-spesa-600">− {euro(s.importo)}</span>
                </div>
              ))}
            </div>
          )}
        </Sezione>

        {/* DETTAGLI */}
        {(l.descrizione || l.note) && (
          <Sezione icona={<StickyNote size={15} />} titolo="Dettagli" accent={ENTITA.lavoro.soft}>
            <div className="grid gap-2 rounded-[14px] border border-line bg-surface p-3 text-[0.84rem] text-ink-soft">
              {l.descrizione && <p>{l.descrizione}</p>}
              {l.note && <p className="text-muted">{l.note}</p>}
            </div>
          </Sezione>
        )}

        {/* AZIONI */}
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <Button variante="outline" onClick={() => apri("lavoro", { id: l.id })}><Pencil size={15} /> Modifica</Button>
          <Button variante="outline" onClick={() => { navigate(`/cliente/${l.clienteId}`); onClose(); }}><User size={15} /> Cliente</Button>
          {r.numPreventivi === 0 && <Button variante="outline" onClick={() => apri("preventivo", { clienteId: l.clienteId })}><ReceiptText size={15} /> Preventivo</Button>}
          <Badge tono={r.margine >= 0 ? "success" : "danger"} className="ml-auto"><TrendingUp size={12} /> Margine {euro(r.margine)}</Badge>
          <Button variante="danger" dim="icon" onClick={eliminaLavoro} aria-label="Elimina"><Trash2 size={16} /></Button>
        </div>
      </div>
    </>
  );
}
