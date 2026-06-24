import { motion } from "framer-motion";
import { Check, Clock, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { codiceCliente } from "@/lib/codice-parlante";
import { formatEuro, formatOre } from "@/lib/format";
import { calcoloLavoro, operatoreIo } from "@/lib/lavoro-calc";
import type { Lavoro } from "@/lib/types";
import { incassaLavoro, segnaSvolto } from "@/store/azioni";
import { useStore } from "@/store/store";
import { Badge, Button, Card, Codice, Stamp } from "./ui";

export function CardLavoro({ lavoro }: { lavoro: Lavoro }) {
  const dati = useStore((s) => s.dati);
  const navigate = useNavigate();
  const [incassaOpen, setIncassaOpen] = useState(false);
  const [altro, setAltro] = useState("");

  const calc = calcoloLavoro(dati, lavoro);
  const cliente = lavoro.clienteId ? dati.clienti.find((c) => c.id === lavoro.clienteId) : undefined;
  const ioId = operatoreIo(dati)?.id;
  const svolto = lavoro.fase === "fatto";

  // operai: "io" sempre primo
  const chips = [...calc.partecipanti].sort((a, b) =>
    a.collaboratoreId === ioId ? -1 : b.collaboratoreId === ioId ? 1 : 0,
  );
  const chipLabel = (id: string, nome: string) => (id === ioId ? "io" : nome);

  const apri = () => navigate(`/lavoro/${lavoro.id}`);

  return (
    <Card tono={svolto ? "svolto" : "programmato"} className="flex flex-col gap-0 px-3.5 py-3">
      {/* riga 1: codice + cliente + stato fase */}
      <button type="button" onClick={apri} className="flex items-start justify-between gap-2 text-left">
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            {cliente && <Codice value={codiceCliente(dati, cliente.id)} />}
            <span className="truncate text-sm font-medium text-bianco">
              {cliente ? `${cliente.nome} ${cliente.cognome ?? ""}`.trim() : "Senza cliente"}
            </span>
          </div>
          <span className="truncate font-display text-base text-bianco">{lavoro.titolo}</span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {svolto ? (
            <Stamp color="ottone">svolto</Stamp>
          ) : (
            <Stamp color="lichene">programmato</Stamp>
          )}
          {(lavoro.oraInizio || lavoro.oraFine) && (
            <span className="font-mono text-[0.65rem] text-fumo-2">
              {lavoro.oraInizio}{lavoro.oraFine ? `–${lavoro.oraFine}` : ""}
            </span>
          )}
        </div>
      </button>

      {/* perforazione */}
      <div className="my-2.5 border-t border-dashed border-white/10" />

      {/* riga 2: tre ancore — ore, incassato, da incassare */}
      <button type="button" onClick={apri} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-left">
        <span className="font-mono text-sm tabular-nums text-fumo">{formatOre(calc.oreTotali)}</span>
        {svolto ? (
          <RigaSoldi calc={calc} />
        ) : (
          <span className="font-mono text-sm text-fumo-2">
            {lavoro.modo === "preventivo" && lavoro.prezzo
              ? `${formatEuro(lavoro.prezzo)} previsto`
              : "da svolgere"}
          </span>
        )}
      </button>

      {/* chip operai */}
      {chips.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {chips.slice(0, 3).map((p) => (
            <button
              key={p.collaboratoreId}
              type="button"
              onClick={() => navigate(`/operaio/${p.collaboratoreId}`)}
              className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[0.65rem] text-fumo"
            >
              ⬡ {chipLabel(p.collaboratoreId, p.nome)}
            </button>
          ))}
          {chips.length > 3 && (
            <span className="font-mono text-[0.65rem] text-fumo-2">+{chips.length - 3}</span>
          )}
        </div>
      )}

      {/* azione principale */}
      <div className="mt-3 flex items-center justify-between gap-2">
        {svolto ? (
          calc.statoIncasso === "pagato" ? (
            <Badge stato="positivo">
              <Check className="h-3 w-3" /> saldato
            </Badge>
          ) : (
            <Button size="sm" variant="ottone" onClick={() => setIncassaOpen((v) => !v)}>
              Incassa
            </Button>
          )
        ) : (
          <Button size="sm" variant="inchiostro" onClick={() => void segnaSvolto(lavoro.id)}>
            Segna svolto
          </Button>
        )}
        <Button size="icona" variant="fantasma" onClick={apri} aria-label="Apri lavoro" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* pannello incasso inline */}
      {svolto && incassaOpen && calc.statoIncasso !== "pagato" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 overflow-hidden rounded-2xl bg-white/[0.08] p-3"
        >
          <p className="font-mono text-xs text-fumo-2">
            Da incassare: <span className="text-attenzione">{formatEuro(calc.daIncassare)}</span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                void incassaLavoro(lavoro.id, calc.daIncassare);
                setIncassaOpen(false);
              }}
            >
              Tutto {formatEuro(calc.daIncassare)}
            </Button>
            <input
              className="h-9 w-24 rounded-2xl border border-white/15 bg-white/[0.08] px-2 font-sans text-sm text-bianco placeholder:text-fumo-2 focus-visible:border-lime focus-visible:outline-none"
              placeholder="altro…"
              inputMode="decimal"
              value={altro}
              onChange={(e) => setAltro(e.target.value)}
            />
            <Button
              size="sm"
              variant="tenue"
              onClick={() => {
                const v = Number(altro.replace(",", "."));
                if (v > 0) void incassaLavoro(lavoro.id, v);
                setAltro("");
                setIncassaOpen(false);
              }}
            >
              Conferma
            </Button>
          </div>
        </motion.div>
      )}
    </Card>
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
        <span className="inline-flex items-center gap-1 text-positivo">
          <Check className="h-3.5 w-3.5" /> {formatEuro(calc.incassato)}
        </span>
        <span className="inline-flex items-center gap-1 text-attenzione">
          <Clock className="h-3.5 w-3.5" /> {formatEuro(calc.daIncassare)} da incassare
        </span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 font-mono text-sm text-attenzione">
      <Clock className="h-3.5 w-3.5" /> {formatEuro(calc.daIncassare)} da incassare
    </span>
  );
}
