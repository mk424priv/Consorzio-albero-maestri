import { Link } from "react-router-dom";
import { Boxes, Plus, Trash2 } from "lucide-react";
import { AMBIENTI_3D } from "@/lib/dominio";
import { dataBreve } from "@/lib/format";
import { useStore } from "@/store/useStore";
import { Btn, PannelloAnimato, TitoloSezione, Vuoto } from "@/components/ui";

/** Home: elenco delle bozze 3D. Un tap apre l'editor. */
export function Bozze() {
  const bozze = useStore((s) => s.bozze);
  const eliminaBozza = useStore((s) => s.eliminaBozza);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <TitoloSezione sub="I tuoi spazi 3D: giardini, stanze, van, garage.">BOZZE 3D</TitoloSezione>
        <Link to="/crea">
          <Btn variante="neon"><Plus className="size-4" /> Nuova bozza</Btn>
        </Link>
      </div>

      {bozze.length === 0 ? (
        <PannelloAnimato>
          <Vuoto icona="▦" titolo="Nessuna bozza 3D." sub="Creane una dalla sezione CREA." />
        </PannelloAnimato>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {bozze.map((b, i) => (
            <PannelloAnimato key={b.id} delay={i * 0.05} className="transition-all hover:glow-ring">
              <div className="flex items-center gap-2 p-4">
                <Link to={`/bozze/${b.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <Boxes className="size-6 shrink-0 text-cyan" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-ice">{b.nome}</div>
                    <div className="text-[10px] tracking-wider text-ghost">
                      {AMBIENTI_3D[b.scena.ambiente].label.toUpperCase()} · {b.scena.oggetti.length} OGGETTI ·{" "}
                      {dataBreve(b.updatedAt)}
                    </div>
                  </div>
                </Link>
                <button
                  type="button"
                  title="Elimina bozza"
                  onClick={() => {
                    if (window.confirm(`Eliminare "${b.nome}"?`)) void eliminaBozza(b.id);
                  }}
                  className="shrink-0 cursor-pointer rounded-md p-1.5 text-faint transition-colors hover:text-danger"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </PannelloAnimato>
          ))}
        </div>
      )}
    </div>
  );
}
