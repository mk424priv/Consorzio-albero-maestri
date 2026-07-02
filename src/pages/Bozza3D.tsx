import { Link, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { AMBIENTI_3D } from "@/lib/dominio";
import { useStore } from "@/store/useStore";
import { Editor3D } from "@/components/editor3d/Editor3D";
import { Vuoto } from "@/components/ui";

/** Editor 3D a tutta pagina per la bozza di un progetto. Salvataggio automatico. */
export function Bozza3D() {
  const { id } = useParams<{ id: string }>();
  const progetto = useStore((s) => s.progetti.find((p) => p.id === id));
  const aggiornaProgetto = useStore((s) => s.aggiornaProgetto);

  if (!progetto?.scena) {
    return <Vuoto icona="∅" titolo="Bozza non trovata." sub="Il progetto non ha una scena 3D." />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Link to={`/progetti/${progetto.id}`} className="text-ghost transition-colors hover:text-neon">
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-ice">
            {progetto.nome} <span className="text-neon glow">/ bozza 3D</span>
          </h1>
          <div className="text-[10px] tracking-widest text-ghost">
            {AMBIENTI_3D[progetto.scena.ambiente].label.toUpperCase()} ·{" "}
            {progetto.scena.larghezza}×{progetto.scena.profondita} m · SALVATAGGIO AUTOMATICO
          </div>
        </div>
      </div>

      <Editor3D
        scena={progetto.scena}
        onChange={(scena) => void aggiornaProgetto(progetto.id, { scena })}
        className="h-[calc(100dvh-16rem)] min-h-96"
      />
    </div>
  );
}
