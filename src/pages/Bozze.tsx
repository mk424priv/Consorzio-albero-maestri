import { Link } from "react-router-dom";
import { Boxes } from "lucide-react";
import { AMBIENTI_3D, TIPI_PROGETTO } from "@/lib/dominio";
import { useStore } from "@/store/useStore";
import { PannelloAnimato, TitoloSezione, Vuoto } from "@/components/ui";

/** Elenco delle bozze 3D esistenti, un tap per entrare nell'editor. */
export function Bozze() {
  const progetti = useStore((s) => s.progetti);
  const conScena = progetti.filter((p) => p.scena);

  return (
    <div className="space-y-4">
      <TitoloSezione sub="Gli spazi 3D dei tuoi progetti. Si creano dal progetto o dalla sezione CREA.">
        BOZZE 3D
      </TitoloSezione>
      {conScena.length === 0 ? (
        <PannelloAnimato>
          <Vuoto
            icona="▦"
            titolo="Nessuna bozza 3D."
            sub="Crea un progetto con bozza 3D, o aggiungila da un progetto esistente."
          />
        </PannelloAnimato>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {conScena.map((p, i) => (
            <PannelloAnimato key={p.id} delay={i * 0.05} className="transition-all hover:glow-ring">
              <Link to={`/progetti/${p.id}/bozza`} className="flex items-center gap-3 p-4">
                <Boxes className="size-6 text-cyan" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-ice">{p.nome}</div>
                  <div className="text-[10px] tracking-wider text-ghost">
                    {AMBIENTI_3D[p.scena!.ambiente].label.toUpperCase()} · {p.scena!.oggetti.length}{" "}
                    OGGETTI · {TIPI_PROGETTO[p.tipo].label.toUpperCase()}
                  </div>
                </div>
                <span className="text-neon">→</span>
              </Link>
            </PannelloAnimato>
          ))}
        </div>
      )}
    </div>
  );
}
