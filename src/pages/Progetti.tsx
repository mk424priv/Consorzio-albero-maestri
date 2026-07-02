import { useState } from "react";
import { Link } from "react-router-dom";
import NumberFlow from "@number-flow/react";
import { Boxes, Plus } from "lucide-react";
import { totaleCosti } from "@/lib/costi";
import { ORDINE_STATI, STATI_PROGETTO, TIPI_PROGETTO } from "@/lib/dominio";
import type { StatoProgetto } from "@/lib/types";
import { useStore } from "@/store/useStore";
import { Btn, Chip, Etichetta, PannelloAnimato, Vuoto } from "@/components/ui";

const EURO = { style: "currency", currency: "EUR", maximumFractionDigits: 0 } as const;

/** Archivio progetti con filtro per stato. */
export function Progetti() {
  const progetti = useStore((s) => s.progetti);
  const [filtro, setFiltro] = useState<StatoProgetto | "tutti">("tutti");

  const visibili = filtro === "tutti" ? progetti : progetti.filter((p) => p.stato === filtro);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Chip attivo={filtro === "tutti"} onClick={() => setFiltro("tutti")}>
          TUTTI ({progetti.length})
        </Chip>
        {ORDINE_STATI.map((s) => (
          <Chip key={s} attivo={filtro === s} onClick={() => setFiltro(s)}>
            {STATI_PROGETTO[s].label}
          </Chip>
        ))}
        <Link to="/crea" className="ml-auto">
          <Btn variante="neon"><Plus className="size-4" /> Nuovo</Btn>
        </Link>
      </div>

      {visibili.length === 0 ? (
        <PannelloAnimato>
          <Vuoto icona="▦" titolo="Nessun progetto qui." sub="Cambia filtro o creane uno nuovo." />
        </PannelloAnimato>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visibili.map((p, i) => (
            <PannelloAnimato key={p.id} delay={i * 0.04} className="group transition-all hover:glow-ring">
              <Link to={`/progetti/${p.id}`} className="block p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-2xl">{TIPI_PROGETTO[p.tipo].icona}</span>
                  <Etichetta colore={STATI_PROGETTO[p.stato].colore}>
                    {STATI_PROGETTO[p.stato].label}
                  </Etichetta>
                </div>
                <div className="mt-2 truncate text-base font-bold text-ice group-hover:text-neon">
                  {p.nome}
                </div>
                <div className="text-[10px] tracking-wider text-ghost">
                  {TIPI_PROGETTO[p.tipo].label}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="font-semibold text-neon-dim">
                    <NumberFlow value={totaleCosti(p.costi)} format={EURO} locales="it-IT" />
                    <span className="ml-1 text-faint">· {p.costi.length} voci</span>
                  </span>
                  {p.scena && (
                    <span className="flex items-center gap-1 text-cyan">
                      <Boxes className="size-3.5" /> 3D
                    </span>
                  )}
                </div>
              </Link>
            </PannelloAnimato>
          ))}
        </div>
      )}
    </div>
  );
}
