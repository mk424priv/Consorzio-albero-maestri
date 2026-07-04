import { Link, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { AMBIENTI_3D } from "@/lib/dominio";
import { useStore } from "@/store/useStore";
import { Editor3D } from "@/components/editor3d/Editor3D";
import { Vuoto } from "@/components/ui";

/** Editor 3D a tutta pagina. Salvataggio automatico. */
export function Bozza3D() {
  const { id } = useParams<{ id: string }>();
  const bozza = useStore((s) => s.bozze.find((b) => b.id === id));
  const aggiornaBozza = useStore((s) => s.aggiornaBozza);

  if (!bozza) {
    return <Vuoto icona="∅" titolo="Bozza non trovata." sub="Forse è stata eliminata." />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Link to="/" className="text-ghost transition-colors hover:text-neon">
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-ice">
            {bozza.nome} <span className="text-neon glow">/ bozza 3D</span>
          </h1>
          <div className="text-[10px] tracking-widest text-ghost">
            {AMBIENTI_3D[bozza.scena.ambiente].label.toUpperCase()} ·{" "}
            {bozza.scena.larghezza}×{bozza.scena.profondita} m · SALVATAGGIO AUTOMATICO
          </div>
        </div>
      </div>

      <Editor3D
        scena={bozza.scena}
        onChange={(scena) => void aggiornaBozza(bozza.id, { scena })}
        className="h-[calc(100dvh-16rem)] min-h-96"
      />
    </div>
  );
}
