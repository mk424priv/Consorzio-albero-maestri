// WIZARD RECORD — la cabina di regia: crea/modifica un lavoro in pochi tocchi,
// con progressive disclosure. Al salvataggio store.salvaLavoro smista tutto.
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Clock, Euro, Plus, Search, Trash2, User, Users, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/store/store";
import { useUI } from "@/store/ui";
import { useToast } from "@/store/toast";
import { festaDoppia } from "@/lib/festa";
import { inputData, euro } from "@/lib/format";
import { operatoreIo } from "@/lib/lavoro-calc";
import { ENTITA } from "@/lib/entita";
import { Avatar, Button, Stepper } from "@/components/ui";

const n = (s: string) => { const t = (s ?? "").trim().replace(",", "."); return t === "" ? 0 : Number.isFinite(Number(t)) ? Number(t) : 0; };
const oggi = () => inputData(new Date());

type Fase = "fatto" | "da_fare";
type Modo = "preventivo" | "ore";
type Conteggio = "totale" | "per_giorni";

export function RecordWizardHost() {
  const w = useUI((s) => s.wizard);
  const chiudi = useUI((s) => s.chiudiWizard);
  return (
    <AnimatePresence>
      {w && <RecordWizard key={w.seq} lavoroId={w.lavoroId} onClose={chiudi} />}
    </AnimatePresence>
  );
}

function Gruppo({ icona, titolo, tinta, azione, children }: { icona: React.ReactNode; titolo: string; tinta: string; azione?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-[18px] border border-line bg-surface p-3.5 shadow-[var(--shadow-sm)]">
      <div className="mb-2.5 flex items-center gap-2.5">
        <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-[10px] text-white", tinta)}>{icona}</span>
        <h2 className="text-[0.95rem] font-bold text-ink">{titolo}</h2>
        {azione && <div className="ml-auto">{azione}</div>}
      </div>
      {children}
    </section>
  );
}

function RecordWizard({ lavoroId, onClose }: { lavoroId?: string; onClose: () => void }) {
  const db = useStore((s) => s.db);
  const creaCliente = useStore((s) => s.creaCliente);
  const creaOperatore = useStore((s) => s.creaOperatore);
  const aggiornaCliente = useStore((s) => s.aggiornaCliente);
  const salva = useStore((s) => s.salvaLavoro);
  const mostra = useToast((s) => s.mostra);
  const io = operatoreIo(db);

  const esistente = lavoroId ? db.lavori.find((l) => l.id === lavoroId) : undefined;

  // ---- stato ----
  const [fase, setFase] = useState<Fase>((esistente?.fase ?? (esistente?.stato === "fatto" ? "fatto" : "da_fare")) || "fatto");
  const [data, setData] = useState(esistente?.data ?? oggi());
  const [clienteId, setClienteId] = useState(esistente?.clienteId ?? "");
  const [qCli, setQCli] = useState("");
  const [tariffaNuovo, setTariffaNuovo] = useState<string>("");
  const [modo, setModo] = useState<Modo>((esistente?.modo ?? (esistente?.tipoCompenso === "ore" ? "ore" : "preventivo")) || "ore");
  const [conteggio, setConteggio] = useState<Conteggio>(esistente?.conteggio ?? "totale");
  const [prezzo, setPrezzo] = useState(esistente?.prezzo != null ? String(esistente.prezzo) : "");
  // partecipanti (totale): id attivi + ore per id
  const idIniziali = esistente?.partecipanti?.map((p) => p.collaboratoreId) ?? (io ? [io.id] : []);
  const [attivi, setAttivi] = useState<string[]>(idIniziali.length ? idIniziali : io ? [io.id] : []);
  const oreInizialiTotale: Record<string, string> = {};
  if (esistente) for (const p of esistente.partecipanti ?? []) {
    const tot = db.ore.filter((o) => o.lavoroId === esistente.id && o.operatoreId === p.collaboratoreId).reduce((a, o) => a + o.ore, 0);
    oreInizialiTotale[p.collaboratoreId] = tot ? String(tot) : "";
  }
  const [oreTotali, setOreTotali] = useState<Record<string, string>>(oreInizialiTotale);
  // per_giorni: righe
  type RigaUI = { data: string; ore: Record<string, string> };
  const righeIniziali: RigaUI[] = useMemo(() => {
    if (!esistente || esistente.conteggio !== "per_giorni") return [{ data: data, ore: {} }];
    const perData = new Map<string, Record<string, string>>();
    for (const o of db.ore.filter((x) => x.lavoroId === esistente.id)) {
      const r = perData.get(o.data) ?? {};
      r[o.operatoreId ?? ""] = String((Number(r[o.operatoreId ?? ""] ?? 0)) + o.ore);
      perData.set(o.data, r);
    }
    return [...perData.entries()].map(([d, ore]) => ({ data: d, ore }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [righe, setRighe] = useState<RigaUI[]>(righeIniziali.length ? righeIniziali : [{ data: data, ore: {} }]);
  const [spese, setSpese] = useState<{ descrizione: string; importo: string }[]>(
    esistente ? db.spese.filter((s) => s.lavoroId === esistente.id).map((s) => ({ descrizione: s.descrizione ?? "", importo: String(s.importo) })) : [],
  );
  const [incassato, setIncassato] = useState("");
  const [tariffaModal, setTariffaModal] = useState(false);
  const [apriCollab, setApriCollab] = useState(false);

  const clienteSel = db.clienti.find((c) => c.id === clienteId);
  const nomeCliente = clienteSel ? `${clienteSel.nome} ${clienteSel.cognome}`.trim() : qCli.trim();
  const tariffaCliente = clienteSel?.tariffaOraria ?? (tariffaNuovo ? n(tariffaNuovo) : null);

  // ore totali per partecipante (totale o per_giorni)
  const oreDi = (cid: string) =>
    conteggio === "per_giorni" ? righe.reduce((a, r) => a + n(r.ore[cid] ?? ""), 0) : n(oreTotali[cid] ?? "");
  const oreTot = attivi.reduce((a, c) => a + oreDi(c), 0);

  // economia live
  const lordo = modo === "preventivo" ? n(prezzo) : Math.round(oreTot * (tariffaCliente ?? 0) * 100) / 100;
  const costo = attivi.reduce((a, c) => {
    if (c === io?.id) return a; // le mie ore = profitto (default)
    const t = db.operatori.find((o) => o.id === c)?.tariffaOraria ?? 0;
    return a + oreDi(c) * t;
  }, 0);
  const speseTot = spese.reduce((a, s) => a + n(s.importo), 0);
  const netto = Math.round((lordo - costo - speseTot) * 100) / 100;

  // tariffa mancante quando serve (modo ore)
  const serveTariffa = modo === "ore" && (clienteSel ? clienteSel.tariffaOraria == null : nomeCliente !== "" && tariffaNuovo.trim() === "");
  useEffect(() => {
    if (serveTariffa && !tariffaModal) setTariffaModal(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, clienteId]);

  function toggleAttivo(cid: string) {
    if (cid === io?.id) return; // io sempre attivo
    setAttivi((a) => (a.includes(cid) ? a.filter((x) => x !== cid) : [...a, cid]));
  }
  function setOreRiga(i: number, cid: string, v: string) {
    setRighe((rs) => rs.map((r, idx) => (idx === i ? { ...r, ore: { ...r.ore, [cid]: v } } : r)));
  }

  function salvaTariffaCliente() {
    if (clienteSel) aggiornaCliente(clienteSel.id, { tariffaOraria: n(tariffaNuovo) || null });
    setTariffaModal(false);
  }

  function salvaRecord() {
    // cliente nuovo in modalità ore senza tariffa → chiedi la tariffa prima
    if (modo === "ore" && !clienteId && nomeCliente && tariffaNuovo.trim() === "") {
      setTariffaModal(true);
      return;
    }
    let cid = clienteId;
    if (!cid && nomeCliente) {
      cid = creaCliente({ nome: nomeCliente, cognome: "", tariffaOraria: tariffaNuovo ? n(tariffaNuovo) : null });
    }
    if (!cid) return mostra("Indica un cliente.", "info");
    if (modo === "ore" && (tariffaCliente == null || tariffaCliente === 0)) {
      // consentito ma avvisa (lordo 0)
    }
    const partecipanti = attivi.map((c) => ({ collaboratoreId: c, oreTotale: conteggio === "totale" ? oreDi(c) : undefined }));
    const righeOut = conteggio === "per_giorni"
      ? righe.filter((r) => r.data).map((r) => ({ data: r.data, ore: Object.fromEntries(attivi.map((c) => [c, n(r.ore[c] ?? "")])) }))
      : undefined;
    salva({
      id: lavoroId,
      clienteId: cid,
      fase,
      modo,
      conteggio,
      data,
      prezzo: modo === "preventivo" ? n(prezzo) : null,
      partecipanti,
      righe: righeOut,
      spese: spese.map((s) => ({ descrizione: s.descrizione, importo: n(s.importo) })),
      incassatoIniziale: fase === "fatto" ? n(incassato) : 0,
      titolo: esistente?.titolo,
    });
    festaDoppia("entrata");
    mostra(lavoroId ? "Intervento aggiornato ✓" : "Intervento salvato e smistato ✓");
    onClose();
  }

  // suggerimenti cliente
  const suggeriti = useMemo(() => {
    const fl = qCli.trim().toLowerCase();
    if (!fl) return [];
    return db.clienti.filter((c) => `${c.nome} ${c.cognome}`.toLowerCase().includes(fl)).slice(0, 6);
  }, [db.clienti, qCli]);
  const recenti = useMemo(() => [...db.clienti].sort((a, b) => (b.creatoIl || "").localeCompare(a.creatoIl || "")).slice(0, 6), [db.clienti]);

  const giornoLabel = (() => { try { return new Date(data + "T00:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }); } catch { return data; } })();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex flex-col bg-canvas">
      {/* HEADER */}
      <div className="flex items-center gap-3 border-b border-line bg-surface/90 px-4 py-3 pt-safe backdrop-blur">
        <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-[11px] text-muted hover:bg-surface-2"><X size={18} /></button>
        <div className="min-w-0 flex-1">
          <div className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-muted">{lavoroId ? "Modifica" : "Nuovo"} intervento</div>
          <div className="text-[0.85rem] font-bold capitalize text-ink">{giornoLabel}</div>
        </div>
        {/* Fase */}
        <div className="flex rounded-[11px] border border-line bg-surface-2 p-1">
          {(["fatto", "da_fare"] as Fase[]).map((f) => (
            <button key={f} onClick={() => setFase(f)} className={cn("rounded-[8px] px-3 py-1.5 text-[0.74rem] font-bold transition", fase === f ? (f === "fatto" ? "bg-success text-white" : "bg-warn text-white") : "text-muted")}>
              {f === "fatto" ? "Fatto" : "Da fare"}
            </button>
          ))}
        </div>
      </div>

      {/* BODY */}
      <div className="mx-auto w-full max-w-xl flex-1 overflow-y-auto px-4 py-4">
        <div className="grid gap-3">
          {/* DATA */}
          <Gruppo icona={<Clock size={16} />} titolo="Data" tinta={ENTITA.lavoro.solid}>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setData(oggi())} className={cn("rounded-full border px-3 py-2 text-sm font-bold transition", data === oggi() ? "border-brand-300 bg-brand-50 text-brand-600" : "border-line bg-surface text-muted")}>Oggi</button>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} className="h-11 flex-1 rounded-[12px] border border-line-strong bg-surface px-3 text-[1rem] font-semibold text-ink outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100" />
            </div>
          </Gruppo>

          {/* CLIENTE */}
          <Gruppo icona={<User size={16} />} titolo="Cliente" tinta={ENTITA.cliente.solid}>
            {clienteSel ? (
              <div className="flex items-center justify-between rounded-[14px] border border-cliente-200 bg-cliente-50 px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar nome={nomeCliente} grad={ENTITA.cliente.grad} size="md" />
                  <div className="min-w-0">
                    <b className="block truncate text-ink">{nomeCliente}</b>
                    <span className="text-[0.7rem] text-muted">{clienteSel.tariffaOraria ? `${euro(clienteSel.tariffaOraria)}/h` : "tariffa non impostata"}</span>
                  </div>
                </div>
                <button onClick={() => { setClienteId(""); setQCli(""); }} className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] text-muted hover:bg-surface"><X size={17} /></button>
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
                      <button key={c.id} onClick={() => setClienteId(c.id)} className="flex items-center gap-2.5 rounded-[12px] border border-line bg-surface px-3 py-2 text-left transition hover:border-cliente-200 hover:bg-cliente-50">
                        <Avatar nome={`${c.nome} ${c.cognome}`} grad={ENTITA.cliente.grad} size="sm" />
                        <span className="font-semibold text-ink">{c.nome} {c.cognome}</span>
                      </button>
                    ))}
                  </div>
                )}
                {qCli.trim() === "" && recenti.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {recenti.map((c) => <button key={c.id} onClick={() => setClienteId(c.id)} className="rounded-full border border-line bg-surface px-3 py-1.5 text-[0.8rem] font-semibold text-ink-soft transition hover:border-cliente-200">{c.nome} {c.cognome}</button>)}
                  </div>
                )}
                {qCli.trim() !== "" && suggeriti.length === 0 && (
                  <div className="mt-2 rounded-[12px] border border-dashed border-cliente-200 bg-cliente-50/60 px-3 py-2 text-[0.8rem] font-semibold text-cliente-700">Nuovo cliente: «{qCli.trim()}»</div>
                )}
              </>
            )}
          </Gruppo>

          {/* MODO */}
          <Gruppo icona={modo === "preventivo" ? <Euro size={16} /> : <Clock size={16} />} titolo="Modo" tinta={ENTITA.preventivo.solid}>
            <div className="mb-3 grid grid-cols-2 gap-2">
              {(["preventivo", "ore"] as Modo[]).map((m) => (
                <button key={m} onClick={() => setModo(m)} className={cn("rounded-[12px] border px-3 py-2.5 text-sm font-bold transition", modo === m ? "border-preventivo-300 bg-preventivo-50 text-preventivo-700 ring-2 ring-preventivo-100" : "border-line bg-surface text-muted")}>
                  {m === "preventivo" ? "💶 Preventivo" : "⏱ A ore"}
                </button>
              ))}
            </div>

            {modo === "preventivo" ? (
              <div>
                <div className="mb-1 text-[0.6rem] font-bold uppercase tracking-wide text-muted">Prezzo concordato</div>
                <div className="flex items-center justify-center gap-1.5 rounded-[16px] border border-line-strong bg-surface-2 py-4">
                  <span className="font-display text-2xl font-bold text-muted">€</span>
                  <input inputMode="decimal" value={prezzo} onChange={(e) => setPrezzo(e.target.value)} placeholder="0" className="w-40 bg-transparent text-center font-display text-[2.2rem] font-bold text-ink outline-none placeholder:text-line-strong" />
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-2 flex rounded-[11px] border border-line bg-surface-2 p-1">
                  {(["totale", "per_giorni"] as Conteggio[]).map((c) => (
                    <button key={c} onClick={() => setConteggio(c)} className={cn("flex-1 rounded-[8px] px-2 py-1.5 text-[0.74rem] font-bold transition", conteggio === c ? "bg-surface text-ink shadow-sm" : "text-muted")}>{c === "totale" ? "Totale" : "Per giorni"}</button>
                  ))}
                </div>
                {conteggio === "totale" ? (
                  <div className="grid gap-2">
                    {attivi.map((cid) => (
                      <div key={cid} className="rounded-[12px] border border-line bg-surface-2/60 p-2">
                        <div className="mb-1 text-center text-[0.72rem] font-bold text-ink">{db.operatori.find((o) => o.id === cid)?.nome}{cid === io?.id ? " (io)" : ""}</div>
                        <Stepper value={oreTotali[cid] ?? ""} onChange={(v) => setOreTotali((s) => ({ ...s, [cid]: v }))} step={0.5} presets={[4, 6, 8]} tinta="operatore" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {righe.map((r, i) => (
                      <div key={i} className="rounded-[12px] border border-line bg-surface-2/60 p-2.5">
                        <div className="mb-2 flex items-center gap-2">
                          <input type="date" value={r.data} onChange={(e) => setRighe((rs) => rs.map((x, idx) => (idx === i ? { ...x, data: e.target.value } : x)))} className="h-9 flex-1 rounded-[10px] border border-line-strong bg-surface px-2 text-[0.9rem] font-semibold text-ink outline-none" />
                          {righe.length > 1 && <button onClick={() => setRighe((rs) => rs.filter((_, idx) => idx !== i))} className="grid h-9 w-9 place-items-center rounded-[10px] text-muted hover:bg-danger-soft hover:text-danger"><Trash2 size={15} /></button>}
                        </div>
                        <div className="grid gap-1.5">
                          {attivi.map((cid) => (
                            <div key={cid} className="flex items-center gap-2">
                              <span className="flex-1 truncate text-[0.78rem] font-semibold text-ink-soft">{db.operatori.find((o) => o.id === cid)?.nome}{cid === io?.id ? " (io)" : ""}</span>
                              <input inputMode="decimal" value={r.ore[cid] ?? ""} onChange={(e) => setOreRiga(i, cid, e.target.value)} placeholder="0" className="h-9 w-20 rounded-[10px] border border-line-strong bg-surface px-2 text-center text-[0.9rem] font-bold text-ink outline-none" />
                              <span className="text-[0.72rem] text-muted">h</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setRighe((rs) => [...rs, { data: oggi(), ore: {} }])} className="rounded-[12px] border border-dashed border-operatore-200 bg-operatore-50/40 py-2 text-[0.82rem] font-bold text-operatore-600">+ Aggiungi giorno</button>
                  </div>
                )}
                <div className="mt-2 text-center text-[0.78rem] font-bold text-operatore-600">Totale {oreTot} h{tariffaCliente ? ` · ${euro(lordo)}` : ""}</div>
              </div>
            )}
          </Gruppo>

          {/* COLLABORATORI */}
          <Gruppo icona={<Users size={16} />} titolo="Chi ha lavorato" tinta={ENTITA.operatore.solid} azione={<button onClick={() => setApriCollab((v) => !v)} className="text-[0.74rem] font-bold text-operatore-600">{apriCollab ? "Chiudi" : "Gestisci"}</button>}>
            <div className="flex flex-wrap gap-1.5">
              {db.operatori.filter((o) => o.attivo).map((o) => {
                const sel = attivi.includes(o.id);
                return (
                  <button key={o.id} onClick={() => toggleAttivo(o.id)} disabled={o.id === io?.id} className={cn("inline-flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-3 transition", sel ? "border-operatore-300 bg-operatore-50 text-operatore-700 ring-2 ring-operatore-100" : "border-line bg-surface text-muted")}>
                    <Avatar nome={o.nome} size="sm" grad={ENTITA.operatore.grad} className="!h-6 !w-6 !text-[0.55rem]" />
                    <span className="text-[0.8rem] font-semibold">{o.nome}{o.id === io?.id ? " (io)" : ""}</span>
                  </button>
                );
              })}
            </div>
            {apriCollab && <NuovoCollab onCrea={(nome, tar) => { const id = creaOperatore({ nome, tariffaOraria: tar }); setAttivi((a) => [...a, id]); setApriCollab(false); }} />}
          </Gruppo>

          {/* SPESE */}
          <Gruppo icona={<Euro size={16} />} titolo="Spese" tinta={ENTITA.spesa.solid} azione={<button onClick={() => setSpese((s) => [...s, { descrizione: "", importo: "" }])} className="text-[0.74rem] font-bold text-spesa-600">+ Aggiungi</button>}>
            {spese.length === 0 ? (
              <p className="text-[0.78rem] text-muted">Nessuna spesa.</p>
            ) : (
              <div className="grid gap-2">
                {spese.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={s.descrizione} onChange={(e) => setSpese((ss) => ss.map((x, idx) => (idx === i ? { ...x, descrizione: e.target.value } : x)))} placeholder="Descrizione" className="h-9 flex-1 rounded-[10px] border border-line-strong bg-surface px-2 text-[0.9rem] text-ink outline-none" />
                    <input inputMode="decimal" value={s.importo} onChange={(e) => setSpese((ss) => ss.map((x, idx) => (idx === i ? { ...x, importo: e.target.value } : x)))} placeholder="0" className="h-9 w-20 rounded-[10px] border border-line-strong bg-surface px-2 text-center text-[0.9rem] font-bold text-ink outline-none" />
                    <button onClick={() => setSpese((ss) => ss.filter((_, idx) => idx !== i))} className="grid h-9 w-9 place-items-center rounded-[10px] text-muted hover:bg-danger-soft hover:text-danger"><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
            )}
          </Gruppo>

          {/* INCASSO (solo fatto) */}
          {fase === "fatto" && lordo > 0 && (
            <Gruppo icona={<Euro size={16} />} titolo="Incassato subito?" tinta={ENTITA.entrata.solid}>
              <div className="flex items-center gap-2">
                <div className="flex flex-1 items-center justify-center gap-1.5 rounded-[12px] border border-line-strong bg-surface-2 py-2.5">
                  <span className="font-bold text-muted">€</span>
                  <input inputMode="decimal" value={incassato} onChange={(e) => setIncassato(e.target.value)} placeholder="0" className="w-24 bg-transparent text-center font-display text-[1.4rem] font-bold text-ink outline-none placeholder:text-line-strong" />
                </div>
                <button onClick={() => setIncassato(String(lordo))} className="rounded-[10px] border border-entrata-200 bg-entrata-50 px-3 py-2 text-[0.78rem] font-bold text-entrata-600">Tutto</button>
              </div>
            </Gruppo>
          )}
        </div>
        <div className="h-28" />
      </div>

      {/* FOOTER */}
      <div className="border-t border-line bg-surface/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3 backdrop-blur">
        <div className="mx-auto w-full max-w-xl">
          <div className="mb-2 flex items-center justify-between text-[0.78rem]">
            <span className="text-muted">Lordo <b className="text-ink">{euro(lordo)}</b> − Spese {euro(speseTot)} − Squadra {euro(costo)}</span>
            <span className="font-display text-[1.05rem] font-extrabold text-ink">Netto {euro(netto)}</span>
          </div>
          <Button variante="primary" dim="lg" className="w-full" onClick={salvaRecord}><Check size={20} /> Salva intervento</Button>
        </div>
      </div>

      {/* MODALE TARIFFA */}
      <AnimatePresence>
        {tariffaModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 grid place-items-center bg-ink/45 p-6 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-xs rounded-[18px] border border-line bg-surface p-5 shadow-[var(--shadow-lg)]">
              <div className="mb-1 flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-[11px] bg-cliente-50 text-cliente-600"><Euro size={18} /></span><b className="text-ink">Tariffa oraria</b></div>
              <p className="mb-3 text-[0.78rem] text-muted">Per «{nomeCliente || "questo cliente"}» — serve per calcolare il lavoro a ore.</p>
              <div className="flex items-center justify-center gap-1.5 rounded-[14px] border border-line-strong bg-surface-2 py-3">
                <span className="text-xl font-bold text-muted">€</span>
                <input autoFocus inputMode="decimal" value={tariffaNuovo} onChange={(e) => setTariffaNuovo(e.target.value)} placeholder="30" className="w-24 bg-transparent text-center font-display text-[1.8rem] font-bold text-ink outline-none placeholder:text-line-strong" />
                <span className="text-sm font-semibold text-muted">/h</span>
              </div>
              <div className="mt-4 flex gap-2">
                <Button className="flex-1" onClick={() => setTariffaModal(false)}>Salta</Button>
                <Button variante="primary" className="flex-1" onClick={salvaTariffaCliente}>Salva</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function NuovoCollab({ onCrea }: { onCrea: (nome: string, tariffa: number | null) => void }) {
  const [nome, setNome] = useState("");
  const [tar, setTar] = useState("");
  return (
    <div className="mt-3 grid gap-2 rounded-[12px] border border-dashed border-operatore-200 bg-operatore-50/40 p-3">
      <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome collaboratore" className="h-9 rounded-[10px] border border-line-strong bg-surface px-2 text-[0.9rem] text-ink outline-none" />
      <div className="flex items-center gap-2">
        <input inputMode="decimal" value={tar} onChange={(e) => setTar(e.target.value)} placeholder="€/h (costo)" className="h-9 flex-1 rounded-[10px] border border-line-strong bg-surface px-2 text-[0.9rem] text-ink outline-none" />
        <Button variante="primary" dim="sm" onClick={() => { if (nome.trim()) onCrea(nome.trim(), tar ? Number(tar.replace(",", ".")) : null); }}><Plus size={15} /> Aggiungi</Button>
      </div>
    </div>
  );
}
