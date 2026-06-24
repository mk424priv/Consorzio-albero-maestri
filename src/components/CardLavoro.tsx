import { motion } from "framer-motion";
import { Activity, Check, Clock, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { codiceCliente } from "@/lib/codice-parlante";
import { cn } from "@/lib/cn";
import { formatEuro, formatOre } from "@/lib/format";
import { calcoloLavoro, operatoreIo } from "@/lib/lavoro-calc";
import type { Lavoro } from "@/lib/types";
import { incassaLavoro, segnaSvolto } from "@/store/azioni";
import { useStore } from "@/store/store";
import { Button, Codice } from "./ui";

type StatoCard = "programmato" | "incassare" | "pagato";

const STATO: Record<StatoCard, { I: LucideIcon; c: string }> = {
  programmato: { I: Activity, c: "text-blu bg-blu/15" },
  incassare: { I: Clock, c: "text-rosso bg-rosso/15" },
  pagato: { I: Check, c: "text-verde bg-verde/15" },
};

export function CardLavoro({ lavoro }: { lavoro: Lavoro }) {
  const dati = useStore((s) => s.dati);
  const navigate = useNavigate();
  const [incassaOpen, setIncassaOpen] = useState(false);
  const [altro, setAltro] = useState("");

  const calc = calcoloLavoro(dati, lavoro);
  const cliente = lavoro.clienteId ? dati.clienti.find((c) => c.id === lavoro.clienteId) : undefined;
  const ioId = operatoreIo(dati)?.id;

  const programmato = lavoro.fase === "da_fare";
  const pagato = !programmato && calc.statoIncasso === "pagato";
  const stato: StatoCard = programmato ? "programmato" : pagato ? "pagato" : "incassare";
  const SI = STATO[stato].I;

  const chips = [...calc.partecipanti].sort((a, b) => (a.collaboratoreId === ioId ? -1 : b.collaboratoreId === ioId ? 1 : 0));
  const chipLabel = (id: string, nome: string) => (id === ioId ? "io" : nome);
  const apri = () => navigate(`/lavoro/${lavoro.id}`);

  const importo = programmato ? (
    lavoro.modo === "preventivo" && lavoro.prezzo ? <span className="text-blu">{formatEuro(lavoro.prezzo)}</span> : <span className="text-xs font-medium text-fumo-2">da svolgere</span>
  ) : pagato ? (
    <span className="text-verde">{formatEuro(calc.incassato)}</span>
  ) : (
    <span className="text-rosso">{formatEuro(calc.daIncassare)}</span>
  );

  return (
    <motion.div
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn("statocard px-3.5 py-3 text-bianco", `statocard--${stato}`, pagato && "opacity-90")}
    >
      <button type="button" onClick={apri} className="flex w-full items-center justify-between gap-3 text-left">
        <span className="flex min-w-0 items-center gap-2.5">
          <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", STATO[stato].c)}>
            <SI className="h-4 w-4" />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-[15px] font-semibold leading-tight">{lavoro.titolo}</span>
            <span className="flex min-w-0 items-center gap-1.5">
              {cliente && <Codice value={codiceCliente(dati, cliente.id)} />}
              <span className="truncate text-[11px] text-fumo-2">{cliente ? `${cliente.nome} ${cliente.cognome ?? ""}`.trim() : "Senza cliente"}</span>
            </span>
          </span>
        </span>
        <span className="shrink-0 text-right text-base font-bold tracking-tight tabular-nums">{importo}</span>
      </button>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 font-mono text-[11px] text-fumo-2">
          {!programmato && <span className="shrink-0">{formatOre(calc.oreTotali)}</span>}
          {calc.statoIncasso === "parziale" && <span className="shrink-0 text-verde">· {formatEuro(calc.incassato)} inc.</span>}
          {chips.slice(0, 2).map((p) => (
            <button key={p.collaboratoreId} type="button" onClick={() => navigate(`/operaio/${p.collaboratoreId}`)} className="shrink-0 rounded-pill bg-white/10 px-2 py-0.5 text-fumo">
              {chipLabel(p.collaboratoreId, p.nome)}
            </button>
          ))}
          {chips.length > 2 && <span className="shrink-0">+{chips.length - 2}</span>}
        </span>
        {programmato ? (
          <Button size="sm" variant="inchiostro" onClick={() => void segnaSvolto(lavoro.id)}>Svolto</Button>
        ) : pagato ? (
          <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-verde"><Check className="h-3 w-3" /> saldato</span>
        ) : (
          <Button size="sm" onClick={() => setIncassaOpen((v) => !v)}>Incassa</Button>
        )}
      </div>

      {stato === "incassare" && incassaOpen && (
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
