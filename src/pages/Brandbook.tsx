import { AnimatePresence, motion } from "framer-motion";
import {
  Activity, AlertCircle, ArrowDownLeft, ArrowUpRight, Banknote, Calendar, CheckCircle2,
  ChevronDown, ChevronLeft, Clock, CreditCard, Hammer, HardHat, Leaf, MoreHorizontal, PaintRoller,
  PenTool, Plus, Search, Settings, ShieldAlert, Sprout, TreePine, Wallet, X, Zap,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MeshGradient } from "@/components/world/MeshGradient";

/* ── primitivi di libreria (riusabili) ── */

function Avatar({ iniziali, tono = "neutro", size = 40 }: { iniziali: string; tono?: "neutro" | "blu" | "verde" | "rosso"; size?: number }) {
  const toni = {
    neutro: "bg-superficie-alta text-bianco",
    blu: "bg-blu/15 text-blu",
    verde: "bg-verde/15 text-verde",
    rosso: "bg-rosso/15 text-rosso",
  }[tono];
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${toni}`} style={{ width: size, height: size, fontSize: size * 0.34 }}>
      {iniziali}
    </span>
  );
}

function AvatarStack({ items }: { items: string[] }) {
  return (
    <div className="flex -space-x-2.5">
      {items.map((it, i) => (
        <span key={i} className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-superficie bg-superficie-alta text-[10px] font-bold text-bianco">
          {it === "io" ? "IO" : it.slice(0, 2).toUpperCase()}
        </span>
      ))}
    </div>
  );
}

function Pill({ tono, icon: Icon, children }: { tono: "verde" | "rosso" | "blu" | "ambra"; icon: React.ComponentType<{ size?: number }>; children: React.ReactNode }) {
  const m = {
    verde: "bg-verde/10 text-verde",
    rosso: "bg-rosso/10 text-rosso",
    blu: "bg-blu/10 text-blu",
    ambra: "bg-attenzione/10 text-attenzione",
  }[tono];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-chip px-3 py-1.5 text-[13px] font-medium ${m}`}>
      <Icon size={14} /> {children}
    </span>
  );
}

function Sezione({ id, titolo, nota, children }: { id?: string; titolo: string; nota?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="flex flex-col gap-7">
      <div className="flex items-center justify-between border-b border-bordo pb-4">
        <h2 className="text-2xl font-bold tracking-tight">{titolo}</h2>
        {nota && <span className="font-mono text-sm text-fumo-2">{nota}</span>}
      </div>
      {children}
    </section>
  );
}

const btn = "inline-flex items-center justify-center gap-2 font-semibold transition-all active:scale-[0.98]";

export function Brandbook() {
  const navigate = useNavigate();
  const [sheet, setSheet] = useState<null | "detail" | "action" | "danger">(null);
  const [seg, setSeg] = useState<"entrate" | "uscite">("entrate");
  const [toggle, setToggle] = useState(true);

  return (
    <div className="min-h-dvh bg-fondo text-bianco">
      {/* header */}
      <div className="sticky top-0 z-40 flex items-center justify-between bg-fondo/80 px-5 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-superficie text-fumo hover:text-bianco">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Design System</h1>
        </div>
        <span className="font-mono text-xs text-fumo-2">Albero Maestri</span>
      </div>

      <div className="mx-auto flex max-w-3xl flex-col gap-24 px-5 py-12 pb-32">
        {/* HERO con mesh WebGL */}
        <section className="flex flex-col gap-6">
          <div className="relative h-52 overflow-hidden rounded-bolla">
            <MeshGradient className="absolute inset-0 h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <span className="font-mono text-xs uppercase tracking-label text-white/70">WebGL · mesh gradient</span>
              <h2 className="text-3xl font-bold tracking-tight">Verde, ma di precisione.</h2>
            </div>
          </div>
          <h1 className="text-[44px] font-bold leading-[1.05] tracking-tighter sm:text-[64px]">
            Neo-Banking
            <br />per il verde.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-fumo">
            Sistema di design utilitario e ad alto contrasto: nero profondo, superfici solide, tipografia
            decisa, accenti dinamici (blu, verde, rosso) e fill a mesh-gradient. Ogni entità — lavoro,
            cliente, operaio, soldi — ha la sua forma e il suo colore.
          </p>
        </section>

        {/* TIPOGRAFIA */}
        <Sezione titolo="Tipografia" nota="Inter · JetBrains Mono">
          <div className="grid gap-10 sm:grid-cols-2">
            <div className="space-y-8">
              <div className="flex flex-col gap-1"><span className="text-sm text-fumo-2">Display · numero-eroe</span><span className="text-[56px] font-bold leading-none tracking-tighter">€ 1.872</span></div>
              <div className="flex flex-col gap-1"><span className="text-sm text-fumo-2">Header pagina</span><span className="text-[32px] font-bold tracking-tight">Agenda</span></div>
              <div className="flex flex-col gap-1"><span className="text-sm text-fumo-2">Titolo sezione</span><span className="text-xl font-medium">Da incassare</span></div>
            </div>
            <div className="space-y-8">
              <div className="flex flex-col gap-1"><span className="text-sm text-fumo-2">Corpo</span><p className="text-base leading-relaxed text-fumo">Testo standard per descrizioni e info secondarie. Alto contrasto, morbido sull'occhio.</p></div>
              <div className="flex flex-col gap-1"><span className="text-sm text-fumo-2">Voce di lista</span><p className="text-base font-medium">Potatura siepi e ulivi</p></div>
              <div className="flex flex-col gap-1"><span className="text-sm text-fumo-2">Micro-dati · mono</span><span className="font-mono text-[13px] font-medium text-fumo-2">24 GIU 2026 · GR-05-06-00</span></div>
            </div>
          </div>
        </Sezione>

        {/* PALETTE */}
        <Sezione titolo="Palette & Superfici" nota="Mono + Accenti">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[["#000000", "Nero", "Sfondo"], ["#111111", "Superficie", "Card"], ["#1c1c1c", "Alta", "Hover"], ["#ffffff", "Bianco", "Testo/Bottoni"]].map(([c, n, d]) => (
              <div key={n} className="flex flex-col gap-2">
                <div className="flex h-24 items-end rounded-vetro p-3" style={{ background: c, boxShadow: "inset 0 0 0 1px #1f1f1f" }}><span className="text-sm font-semibold" style={{ color: c === "#ffffff" ? "#000" : "#fff" }}>{n}</span></div>
                <span className="text-xs text-fumo-2">{c} · {d}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[["#0a58ff", "Blu", "Programmato"], ["#00d15e", "Verde", "Incassato"], ["#ff3b30", "Rosso", "Da incassare"]].map(([c, n, d]) => (
              <div key={n} className="flex flex-col gap-2">
                <div className="flex h-24 items-end rounded-vetro p-3" style={{ background: c }}><span className="text-sm font-semibold" style={{ color: c === "#00d15e" ? "#000" : "#fff" }}>{n}</span></div>
                <span className="text-xs text-fumo-2">{c} · {d}</span>
              </div>
            ))}
          </div>
        </Sezione>

        {/* FILL & GRADIENTI */}
        <Sezione titolo="Fill & Gradienti" nota="Mesh · Glow">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative h-44 overflow-hidden rounded-bolla mesh-blu p-6">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 mix-blend-overlay blur-[40px]" />
              <div className="absolute bottom-6 left-6"><span className="block font-semibold">Premium Mesh</span><span className="text-sm text-white/70">Hero card & empty state</span></div>
            </div>
            <div className="relative h-44 overflow-hidden rounded-bolla bg-superficie p-6">
              <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-verde/25 blur-[50px]" />
              <div className="absolute bottom-6 left-6"><span className="block font-semibold">Subtle Glow</span><span className="text-sm text-fumo">Stati attivi & highlight</span></div>
            </div>
            <div className="relative h-32 overflow-hidden rounded-bolla mesh-verde p-5"><span className="absolute bottom-5 left-5 font-semibold text-black">Mesh Verde · incasso</span></div>
            <div className="relative h-32 overflow-hidden rounded-bolla mesh-rosso p-5"><span className="absolute bottom-5 left-5 font-semibold">Mesh Rosso · uscita</span></div>
          </div>
        </Sezione>

        {/* ICONE */}
        <Sezione titolo="Iconografia" nota="lucide-react">
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
            {[HardHat, Hammer, PaintRoller, PenTool, TreePine, Sprout, Leaf, Zap, Calendar, Wallet, Banknote, Activity, Clock, Settings, CreditCard, ShieldAlert].map((I, i) => (
              <div key={i} className="flex aspect-square items-center justify-center rounded-vetro bg-superficie text-fumo"><I size={22} /></div>
            ))}
          </div>
        </Sezione>

        {/* BOTTONI */}
        <Sezione titolo="Bottoni" nota="Azioni">
          <div className="grid gap-4 sm:grid-cols-2">
            <button className={`${btn} w-full rounded-btn bg-white py-4 text-base text-black hover:bg-neutral-200`}>Azione primaria</button>
            <button className={`${btn} w-full rounded-btn bg-superficie py-4 text-base text-bianco hover:bg-superficie-alta`}><Activity size={18} /> Secondaria</button>
            <button className={`${btn} w-full rounded-btn bg-blu py-4 text-base text-white hover:bg-blu/90`}>Accento · Paga</button>
            <button className={`${btn} w-full rounded-btn border border-bordo py-4 text-base text-rosso hover:bg-rosso/10`}><ShieldAlert size={18} /> Distruttiva</button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button className={`${btn} rounded-pill bg-white px-5 py-2.5 text-sm text-black`}>Riscuoti</button>
            <button className={`${btn} rounded-pill bg-superficie px-5 py-2.5 text-sm text-bianco`}>Annulla</button>
            <button className={`${btn} h-11 w-11 rounded-full bg-superficie text-bianco`}><Plus size={20} /></button>
            <button className={`${btn} h-11 w-11 rounded-full bg-white text-black`}><Plus size={20} /></button>
            <button className={`${btn} h-9 w-9 rounded-full text-fumo hover:bg-superficie`}><MoreHorizontal size={18} /></button>
          </div>
          {/* action row */}
          <div className="flex justify-around pt-2">
            {[[ArrowUpRight, "Crea"], [ArrowDownLeft, "Incassa"], [Activity, "Dashboard"], [MoreHorizontal, "Altro"]].map(([I, l], i) => {
              const Ico = I as React.ComponentType<{ size?: number }>;
              return (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-superficie text-bianco hover:bg-superficie-alta"><Ico size={22} /></div>
                  <span className="text-xs font-medium text-fumo">{l as string}</span>
                </div>
              );
            })}
          </div>
        </Sezione>

        {/* INPUT & CONTROLLI */}
        <Sezione titolo="Input & Controlli" nota="Forms">
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="space-y-5">
              <input placeholder="Nome cliente" className="w-full rounded-btn bg-superficie px-5 py-4 text-base text-bianco placeholder-fumo-2 focus:bg-superficie-alta focus:outline-none" />
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-fumo-2" size={18} />
                <input placeholder="Cerca…" className="w-full rounded-pill bg-superficie py-3.5 pl-12 pr-5 text-base text-bianco placeholder-fumo-2 focus:bg-superficie-alta focus:outline-none" />
              </div>
              <div className="flex flex-col items-center rounded-bolla bg-superficie py-10">
                <span className="mb-2 text-sm font-medium text-fumo-2">Importo</span>
                <div className="flex items-center gap-2"><span className="text-5xl font-bold tracking-tighter">€</span><span className="text-6xl font-bold tracking-tighter">800</span></div>
              </div>
            </div>
            <div className="space-y-5">
              <div className="flex rounded-btn bg-superficie p-1">
                {(["entrate", "uscite"] as const).map((s) => (
                  <button key={s} onClick={() => setSeg(s)} className={`flex-1 rounded-xl py-2.5 text-sm font-medium capitalize transition-colors ${seg === s ? "bg-superficie-3 text-bianco" : "text-fumo-2"}`}>{s}</button>
                ))}
              </div>
              <div className="flex items-center justify-between rounded-vetro bg-superficie p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-superficie-alta"><Settings size={18} /></div>
                  <div className="flex flex-col"><span className="font-medium">Notifiche</span><span className="text-[13px] text-fumo-2">Promemoria incassi</span></div>
                </div>
                <button onClick={() => setToggle((v) => !v)} className={`relative h-7 w-12 rounded-full transition-colors ${toggle ? "bg-blu" : "bg-superficie-3"}`}>
                  <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${toggle ? "right-1" : "left-1"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between rounded-vetro bg-superficie p-5 hover:bg-superficie-alta">
                <div className="flex items-center gap-4"><Avatar iniziali="GR" tono="verde" /><div className="flex flex-col"><span className="font-medium">Giardino Rossi</span><span className="text-[13px] text-fumo-2">25 €/h · 4 lavori</span></div></div>
                <ChevronDown size={20} className="text-fumo-2" />
              </div>
            </div>
          </div>
        </Sezione>

        {/* STATI, AVATAR, PROGRESS */}
        <Sezione titolo="Stati, Avatar, Progress" nota="Indicatori">
          <div className="flex flex-wrap gap-3">
            <Pill tono="verde" icon={CheckCircle2}>Saldato</Pill>
            <Pill tono="rosso" icon={Clock}>In ritardo</Pill>
            <Pill tono="blu" icon={Activity}>Programmato</Pill>
            <Pill tono="ambra" icon={AlertCircle}>Parziale</Pill>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <AvatarStack items={["io", "Luca", "Marta"]} />
            <Avatar iniziali="IO" tono="blu" size={44} />
            <Avatar iniziali="VB" tono="rosso" size={44} />
            <span className="inline-flex items-center rounded-pill bg-blu/12 px-3 py-1 font-mono text-sm font-medium text-blu">GR-05-06-00</span>
          </div>
          <div className="rounded-vetro bg-superficie p-5">
            <div className="mb-3 flex items-center justify-between"><span className="font-medium">Obiettivo settimanale</span><span className="font-mono text-sm text-fumo-2">75%</span></div>
            <div className="h-2.5 overflow-hidden rounded-full bg-superficie-alta"><div className="h-full rounded-full bg-blu" style={{ width: "75%" }} /></div>
          </div>
        </Sezione>

        {/* CARD ENTITÀ */}
        <Sezione titolo="Card per stato (Lavoro)" nota="3 forme distinte">
          {/* programmato */}
          <div className="statocard statocard--programmato flex flex-col gap-3 p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Activity className="mt-0.5 h-5 w-5 shrink-0 text-blu" />
                <div className="flex flex-col"><span className="font-medium">Impianto nuovo prato</span><span className="text-[13px] text-fumo-2">Anna Verdi · AV-00-00-00</span></div>
              </div>
              <span className="flex items-center gap-1.5 rounded-chip bg-superficie-alta px-2.5 py-1 text-[13px]"><Clock className="h-3.5 w-3.5 text-fumo-2" /> 10:00</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-bordo pt-3"><AvatarStack items={["io"]} /><button className="text-fumo-2 hover:text-bianco"><MoreHorizontal size={20} /></button></div>
          </div>
          {/* da incassare */}
          <div className="statocard statocard--incassare flex flex-col gap-3 p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rosso" /><div className="flex flex-col"><span className="font-medium">Villa Bianchi</span><span className="text-[13px] text-fumo-2 line-clamp-1">Sistemazione giardino villa</span></div></div>
              <span className="shrink-0 text-xl font-bold tracking-tight">€ 500</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-bordo pt-4">
              <span className="rounded-chip bg-superficie-alta px-2.5 py-1 text-[13px] text-fumo-2">12h tot</span>
              <button className="rounded-btn bg-white px-5 py-2.5 text-sm font-semibold text-black active:scale-95">Riscuoti</button>
            </div>
          </div>
          {/* pagato (riga compatta) */}
          <div className="flex items-center justify-between rounded-vetro px-4 py-3 hover:bg-superficie">
            <div className="flex items-center gap-4"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-verde/10 text-verde"><CheckCircle2 size={16} strokeWidth={2.5} /></div><span className="font-medium">Giardino Rossi</span></div>
            <span className="font-bold tracking-tight text-verde">€ 300</span>
          </div>
        </Sezione>

        {/* CLIENTE / OPERAIO */}
        <Sezione titolo="Card Cliente & Operaio" nota="Anagrafiche">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-vetro bg-superficie p-4 hover:bg-superficie-alta">
              <div className="flex items-center gap-3"><Avatar iniziali="GR" tono="verde" /><div className="flex flex-col"><span className="font-medium">Giardino Rossi</span><span className="text-[13px] text-fumo-2">4 lavori · GR-05-06-00</span></div></div>
              <span className="text-sm font-semibold text-rosso">€ 672</span>
            </div>
            <div className="flex items-center justify-between rounded-vetro bg-superficie p-4 hover:bg-superficie-alta">
              <div className="flex items-center gap-3"><Avatar iniziali="LU" tono="blu" /><div className="flex flex-col"><span className="font-medium">Luca</span><span className="text-[13px] text-fumo-2">collaboratore · 12 €/h</span></div></div>
              <span className="text-sm font-semibold text-rosso">€ 32</span>
            </div>
          </div>
        </Sezione>

        {/* OVERLAY */}
        <Sezione titolo="Overlay & Sheet" nota="Bottom sheet">
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setSheet("detail")} className={`${btn} rounded-pill bg-superficie px-6 py-3 text-sm`}><Wallet size={18} /> Dettaglio</button>
            <button onClick={() => setSheet("action")} className={`${btn} rounded-pill bg-superficie px-6 py-3 text-sm`}><CreditCard size={18} /> Incassa subito</button>
            <button onClick={() => setSheet("danger")} className={`${btn} rounded-pill bg-rosso/10 px-6 py-3 text-sm text-rosso`}><ShieldAlert size={18} /> Conferma</button>
          </div>
        </Sezione>
      </div>

      {/* SHEET */}
      <AnimatePresence>
        {sheet && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
            <div className="absolute inset-0 bg-black/60" onClick={() => setSheet(null)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="relative w-full max-w-lg rounded-t-bolla bg-superficie p-6 sm:rounded-bolla">
              <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-superficie-3 sm:hidden" />
              {sheet === "detail" && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-start justify-between"><Avatar iniziali="VB" tono="rosso" size={64} /><button onClick={() => setSheet(null)} className="flex h-10 w-10 items-center justify-center rounded-full bg-superficie-alta text-fumo"><X size={20} /></button></div>
                  <div><h3 className="text-3xl font-bold tracking-tight">Villa Bianchi</h3><p className="text-fumo">Sistemazione giardino · ieri</p></div>
                  <div className="flex flex-col gap-4 border-t border-bordo pt-6">
                    <div className="flex justify-between"><span className="text-fumo">Da incassare</span><span className="text-lg font-semibold text-rosso">€ 500</span></div>
                    <div className="flex justify-between"><span className="text-fumo">Incassato</span><span className="font-semibold text-verde">€ 300</span></div>
                  </div>
                  <button className="w-full rounded-btn bg-white py-4 font-semibold text-black">Riscuoti tutto</button>
                </div>
              )}
              {sheet === "action" && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between"><h3 className="text-2xl font-bold tracking-tight">Incassa subito</h3><button onClick={() => setSheet(null)} className="flex h-10 w-10 items-center justify-center rounded-full bg-superficie-alta text-fumo"><X size={20} /></button></div>
                  <div className="flex flex-col items-center py-4"><span className="text-6xl font-bold leading-none tracking-tighter">€ 800</span><span className="mt-2 font-medium text-fumo-2">a preventivo · nessuna ora</span></div>
                  <button className="w-full rounded-btn bg-blu py-4 font-semibold text-white">Conferma incasso</button>
                </div>
              )}
              {sheet === "danger" && (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col items-center gap-3 pt-2 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rosso/10 text-rosso"><ShieldAlert size={32} /></div>
                    <h3 className="text-2xl font-bold tracking-tight">Eliminare il lavoro?</h3>
                    <p className="leading-relaxed text-fumo">Azione irreversibile. Lo storico e i pagamenti collegati resteranno.</p>
                  </div>
                  <button className="w-full rounded-btn bg-rosso py-4 font-semibold text-white">Elimina</button>
                  <button onClick={() => setSheet(null)} className="w-full rounded-btn py-4 font-semibold hover:bg-superficie-alta">Annulla</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
