import { motion } from "framer-motion";
import { CalendarClock, Check, Clock, MoreHorizontal } from "lucide-react";
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

function StatoTag({ stato }: { stato: StatoCard }) {
  const map = {
    programmato: { c: "text-blu bg-blu/15", t: "Programmato", I: CalendarClock },
    incassare: { c: "text-rosso bg-rosso/15", t: "Da incassare", I: Clock },
    pagato: { c: "text-verde bg-verde/15", t: "Saldato", I: Check },
  }[stato];
  const I = map.I;
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-pill px-2.5 py-1 font-mono text-[0.58rem] font-semibold uppercase tracking-wider", map.c)}>
      <I className="h-3 w-3" /> {map.t}
    </span>
  );
}

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

  const chips = [...calc.partecipanti].sort((a, b) => (a.collaboratoreId === ioId ? -1 : b.collaboratoreId === ioId ? 1 : 0));
  const chipLabel = (id: string, nome: string) => (id === ioId ? "io" : nome);
  const apri = () => navigate(`/lavoro/${lavoro.id}`);

  return (
    <motion.div
      whileTap={{ scale: 0.985 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn("statocard px-4 py-3.5 text-bianco", `statocard--${stato}`, pagato && "opacity-90")}
    >
      <button type="button" onClick={apri} className="flex w-full items-start justify-between gap-2 text-left">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            {cliente && <Codice value={codiceCliente(dati, cliente.id)} />}
            <span className="truncate text-sm font-medium text-fumo">
              {cliente ? `${cliente.nome} ${cliente.cognome ?? ""}`.trim() : "Senza cliente"}
            </span>
          </div>
          <span className="truncate font-display text-[1.05rem] font-semibold leading-tight text-bianco">{lavoro.titolo}</span>
        </div>
        <StatoTag stato={stato} />
      </button>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        {programmato ? (
          <span className="font-mono text-sm text-blu">
            {lavoro.modo === "preventivo" && lavoro.prezzo ? `${formatEuro(lavoro.prezzo)} previsto` : "da svolgere"}
          </span>
        ) : (
          <>
            <span className="font-mono text-sm tabular-nums text-fumo">{formatOre(calc.oreTotali)}</span>
            <RigaSoldi calc={calc} />
          </>
        )}
      </div>

      {chips.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {chips.slice(0, 3).map((p) => (
            <button
              key={p.collaboratoreId}
              type="button"
              onClick={() => navigate(`/operaio/${p.collaboratoreId}`)}
              className="rounded-pill bg-white/10 px-2.5 py-0.5 font-mono text-[0.62rem] text-fumo"
            >
              {chipLabel(p.collaboratoreId, p.nome)}
            </button>
          ))}
          {chips.length > 3 && <span className="font-mono text-[0.62rem] text-fumo-2">+{chips.length - 3}</span>}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        {programmato ? (
          <Button size="sm" variant="inchiostro" onClick={() => void segnaSvolto(lavoro.id)}>
            Segna svolto
          </Button>
        ) : pagato ? (
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-positivo">
            <Check className="h-3.5 w-3.5" /> Saldato
          </span>
        ) : (
          <Button size="sm" variant="ottone" onClick={() => setIncassaOpen((v) => !v)}>
            Incassa
          </Button>
        )}
        <button type="button" onClick={apri} aria-label="Apri lavoro" className="grid h-8 w-8 place-items-center rounded-full text-fumo-2 transition-colors hover:bg-white/10">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {stato === "incassare" && incassaOpen && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 overflow-hidden rounded-2xl bg-white/[0.06] p-3">
          <p className="font-mono text-xs text-fumo-2">
            Da incassare: <span className="text-rosso">{formatEuro(calc.daIncassare)}</span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => { void incassaLavoro(lavoro.id, calc.daIncassare); setIncassaOpen(false); }}>
              Tutto {formatEuro(calc.daIncassare)}
            </Button>
            <input
              className="h-9 w-24 rounded-pill bg-white/[0.06] px-3 font-sans text-sm text-bianco placeholder:text-fumo-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/60"
              placeholder="altro…"
              inputMode="decimal"
              value={altro}
              onChange={(e) => setAltro(e.target.value)}
            />
            <Button size="sm" variant="inchiostro" onClick={() => { const v = Number(altro.replace(",", ".")); if (v > 0) void incassaLavoro(lavoro.id, v); setAltro(""); setIncassaOpen(false); }}>
              Conferma
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function RigaSoldi({ calc }: { calc: { statoIncasso: string; incassato: number; daIncassare: number } }) {
  if (calc.statoIncasso === "pagato") {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-sm text-positivo">
        <Check className="h-3.5 w-3.5" /> {formatEuro(calc.incassato)} incassato
      </span>
    );
  }
  if (calc.statoIncasso === "parziale") {
    return (
      <span className="inline-flex flex-wrap items-center gap-x-2 font-mono text-sm">
        <span className="inline-flex items-center gap-1 text-positivo"><Check className="h-3.5 w-3.5" /> {formatEuro(calc.incassato)}</span>
        <span className="inline-flex items-center gap-1 text-rosso"><Clock className="h-3.5 w-3.5" /> {formatEuro(calc.daIncassare)} da incassare</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 font-mono text-sm text-rosso">
      <Clock className="h-3.5 w-3.5" /> {formatEuro(calc.daIncassare)} da incassare
    </span>
  );
}
