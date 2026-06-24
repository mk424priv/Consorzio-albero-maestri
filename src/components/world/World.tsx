import { useLocation } from "react-router-dom";
import { MeshGradient } from "./MeshGradient";

type Sezione = "agenda" | "soldi" | "ambra" | "grafite" | "ossidiana";

// Palette "da giardino" per schermo — la fascia WebGL in alto sfuma nel nero.
const PALETTE: Record<Sezione, [string, string, string, string]> = {
  agenda: ["#0a58ff", "#1b9cff", "#0a2a6b", "#00d15e"], // cielo / alba
  soldi: ["#00d15e", "#7bff3a", "#0a5e40", "#0a58ff"], // linfa / verde
  ambra: ["#ff7a1a", "#ff3b30", "#7a3b0e", "#ffb03a"], // terra / terracotta
  grafite: ["#0a58ff", "#00d15e", "#4b0082", "#ff3b30"], // dati / brand
  ossidiana: ["#0a58ff", "#1a1147", "#0a2a6b", "#00d15e"], // crea / notte
};

function sezione(path: string): Sezione {
  if (path.startsWith("/soldi")) return "soldi";
  if (path.startsWith("/dashboard")) return "grafite";
  if (path.startsWith("/anagrafiche") || path.startsWith("/cliente") || path.startsWith("/operaio")) return "ambra";
  if (path.startsWith("/nuovo") || path.startsWith("/impostazioni") || path.startsWith("/lavoro")) return "ossidiana";
  return "agenda";
}

/** Sfondo per schermo: fascia mesh WebGL in alto (palette di sezione) → nero. */
export function World() {
  const { pathname } = useLocation();
  const colors = PALETTE[sezione(pathname)];
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 bg-fondo">
      <div className="absolute inset-x-0 top-0 h-[44vh]">
        <MeshGradient colors={colors} />
        <div className="absolute inset-0 bg-gradient-to-b from-fondo/30 via-fondo/55 to-fondo" />
      </div>
    </div>
  );
}
