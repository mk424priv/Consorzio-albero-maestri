import { motion } from "framer-motion";
import { Calendar, Check, Clock, type LucideIcon, PieChart } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { codiceCliente } from "@/lib/codice-parlante";
import { cn } from "@/lib/cn";
import { formatData, formatEuro, formatOre } from "@/lib/format";
import { calcoloLavoro, operatoreIo } from "@/lib/lavoro-calc";
import type { Lavoro } from "@/lib/types";
import { incassaLavoro, segnaSvolto } from "@/store/azioni";
import { useStore } from "@/store/store";
import { Button, Codice } from "./ui";

type StatoSvolto = "incassare" | "parziale" | "pagato";

const STATO: Record<StatoSvolto, { I: LucideIcon; chip: string; amount: string }> = {
  incassare: { I: Clock, chip: "text-rosso bg-rosso/15", amount: "text-rosso" },
  parziale: { I: PieChart, chip: "text-arancio bg-arancio/15", amount: "text-arancio" },
  pagato: { I: Check, chip: "text-verde bg-verde/15", amount: "text-verde" },
};

export function CardLavoro({ lavoro }: { lavoro: Lavoro }) {
  const dati = useStore((s) => s.dati);
  const navigate = useNavigate();
  const [incassaOpen, setIncassaOpen] = useState(false);
  const [altro, setAltro] = useState("");

  const calc = calcoloLavoro(dati, lavoro);
  const cliente = lavoro.clienteId ? dati.clienti.find((c) => c.id === lavoro.clienteId) : undefined;
  const ioId = operatoreIo(dati)?.id;
  const chips = [...calc.partecipanti].sort((a, b) => (a.collaboratoreId === ioId ? -1 : b.collaboratoreId === ioId ? 1 : 0));
  const chipLabel = (id: string, nome: string) => (id === ioId ? "io" : nome);
  const apri = () => navigate(`/lavoro/${lavoro.id}`);
  const nomeCliente = cliente ? `${cliente.nome} ${cliente.cognome ?? ""}`.trim() : "Senza cliente";

  const Chips = () => (
    <span className="flex min-w-0 items-center gap-1.5 font-mono text-[11px] text-fumo-2">
      {chips.slice(0, 2).map((p) => (
        <button key={p.collaboratoreId} type="button" onClick={() => navigate(`/operaio/${p.collaboratoreId}`)} className="shrink-0 rounded-pill bg-white/10 px-2 py-0.5 text-fumo">
          {chipLabel(p.collaboratoreId, p.nome)}
        </button>
      ))}
      {chips.length > 2 && <span className="shrink-0">+{chips.length - 2}</span>}
    </span>
  );

  // ── PROGRAMMATO: forma diversa (tratteggio / fantasma, blu) ──
  if (lavoro.fase === "da_fare") {
    return (
      <motion.div whileTap={{ scale: 0.99 }} className="rounded-vetro border border-dashed border-blu/35 bg-blu/[0.05] px-3.5 py-3 text-bianco">
        <button type="button" onClick={apri} className="flex w-full items-center justify-between gap-3 text-left">
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blu/15 text-blu"><Calendar className="h-4 w-4" /></span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-[15px] font-semibold leading-tight">{lavoro.titolo}</span>
              <span className="flex min-w-0 items-center gap-1.5">
                {cliente && <Codice value={codiceCliente(dati, cliente.id)} />}
                <span className="truncate text-[11px] text-fumo-2">{nomeCliente}</span>
              </span>
            </span>
          </span>
          <span className="shrink-0 text-right">
            <span className="block font-mono text-[10px] uppercase tracking-label text-blu">programmato</span>
            <span className="block text-sm font-medium text-fumo">{lavoro.modo === "preventivo" && lavoro.prezzo ? formatEuro(lavoro.prezzo) : formatData(lavoro.data)}</span>
          </span>
        </button>
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <Chips />
          <Button size="sm" variant="inchiostro" onClick={() => void segnaSvolto(lavoro.id)}>Svolto</Button>
        </div>
      </motion.div>
    );
  }

  // ── SVOLTO: incassare / parziale / pagato ──
  const stato: StatoSvolto = calc.statoIncasso === "pagato" ? "pagato" : calc.statoIncasso === "parziale" ? "parziale" : "incassare";
  const s = STATO[stato];
  const SI = s.I;
  const amount = stato === "pagato" ? calc.incassato : calc.daIncassare;

  return (
    <motion.div
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn("statocard px-3.5 py-3 text-bianco", `statocard--${stato}`, stato === "pagato" && "opacity-90")}
    >
      <button type="button" onClick={apri} className="flex w-full items-center justify-between gap-3 text-left">
        <span className="flex min-w-0 items-center gap-2.5">
          <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", s.chip)}><SI className="h-4 w-4" /></span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-[15px] font-semibold leading-tight">{lavoro.titolo}</span>
            <span className="flex min-w-0 items-center gap-1.5">
              {cliente && <Codice value={codiceCliente(dati, cliente.id)} />}
              <span className="truncate text-[11px] text-fumo-2">{nomeCliente}</span>
            </span>
          </span>
        </span>
        <span className={cn("shrink-0 text-right text-base font-bold tracking-tight tabular-nums", s.amount)}>{formatEuro(amount)}</span>
      </button>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 font-mono text-[11px] text-fumo-2">
          <span className="shrink-0">{formatOre(calc.oreTotali)}</span>
          {stato === "parziale" && <span className="shrink-0 text-verde">· {formatEuro(calc.incassato)} inc.</span>}
          <Chips />
        </span>
        {stato === "pagato" ? (
          <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-verde"><Check className="h-3 w-3" /> saldato</span>
        ) : (
          <Button size="sm" onClick={() => setIncassaOpen((v) => !v)}>Incassa</Button>
        )}
      </div>

      {stato !== "pagato" && incassaOpen && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-2.5 overflow-hidden rounded-2xl bg-black/20 p-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => { void incassaLavoro(lavoro.id, calc.daIncassare); setIncassaOpen(false); }}>
              Tutto {formatEuro(calc.daIncassare)}
            </Button>
            <input
              className="h-9 w-24 rounded-pill bg-superficie-bassa px-3 font-sans text-sm text-bianco placeholder:text-fumo-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blu/50"
              placeholder="altro…"
              inputMode="decimal"
              value={altro}
              onChange={(e) => setAltro(e.target.value)}
            />
            <Button size="sm" variant="inchiostro" onClick={() => { const v = Number(altro.replace(",", ".")); if (v > 0) void incassaLavoro(lavoro.id, v); setAltro(""); setIncassaOpen(false); }}>
              Ok
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
