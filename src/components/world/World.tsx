import { useLocation } from "react-router-dom";

type Sezione = "agenda" | "soldi" | "ambra" | "grafite" | "ossidiana";

// Tema "Luce": canvas chiara + alone pastello FIOCO di sezione in alto. Card bianche sopra.
const GLOW: Record<Sezione, string> = {
  agenda: "rgba(59,110,245,0.12)",
  soldi: "rgba(27,181,116,0.12)",
  ambra: "rgba(245,147,58,0.13)",
  grafite: "rgba(106,91,216,0.10)",
  ossidiana: "rgba(59,110,245,0.10)",
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
      style={{ background: `radial-gradient(130% 55% at 50% -8%, ${g} 0%, transparent 58%), var(--color-fondo)` }}
    />
  );
}
