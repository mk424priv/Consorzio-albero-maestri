import { useLocation } from "react-router-dom";
import { MeshGradient } from "./MeshGradient";

type Sezione = "agenda" | "soldi" | "ambra" | "grafite" | "ossidiana";

// Palette "da giardino" per schermo. Lo sfondo riempie TUTTO lo schermo (niente linea):
// mesh a tutto schermo + velo scuro uniforme → tinta viva ma sobria ovunque.
const PALETTE: Record<Sezione, [string, string, string, string]> = {
  agenda: ["#0a58ff", "#1b9cff", "#0a2a6b", "#00d15e"],
  soldi: ["#00d15e", "#7bff3a", "#0a5e40", "#0a58ff"],
  ambra: ["#ff7a1a", "#ff3b30", "#7a3b0e", "#ffb03a"],
  grafite: ["#0a58ff", "#00d15e", "#4b0082", "#ff3b30"],
  ossidiana: ["#0a58ff", "#1a1147", "#0a2a6b", "#00d15e"],
};

function sezione(path: string): Sezione {
  if (path.startsWith("/soldi")) return "soldi";
  if (path.startsWith("/dashboard")) return "grafite";
  if (path.startsWith("/anagrafiche") || path.startsWith("/cliente") || path.startsWith("/operaio")) return "ambra";
  if (path.startsWith("/nuovo") || path.startsWith("/impostazioni") || path.startsWith("/lavoro")) return "ossidiana";
  return "agenda";
}

export function World() {
  const { pathname } = useLocation();
  const colors = PALETTE[sezione(pathname)];
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 bg-fondo">
      <MeshGradient colors={colors} />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(5,5,6,0.78) 0%, rgba(5,5,6,0.9) 100%)" }}
      />
    </div>
  );
}
