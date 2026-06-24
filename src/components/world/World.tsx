import { useLocation } from "react-router-dom";

type Sezione = "agenda" | "soldi" | "ambra" | "grafite" | "ossidiana";

// Glow di sezione FIOCO in alto su tela quasi-nera (neo-banking). Card solide sopra.
const GLOW: Record<Sezione, string> = {
  agenda: "rgba(10,88,255,0.16)",
  soldi: "rgba(0,209,94,0.14)",
  ambra: "rgba(255,159,10,0.14)",
  grafite: "rgba(255,255,255,0.05)",
  ossidiana: "rgba(10,88,255,0.10)",
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
  const g = GLOW[sezione(pathname)];
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 transition-[background] duration-700"
      style={{ background: `radial-gradient(120% 55% at 50% -8%, ${g} 0%, transparent 55%), #050505` }}
    />
  );
}
