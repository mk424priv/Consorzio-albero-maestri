import { useLocation } from "react-router-dom";
import { ShaderWorld } from "./ShaderWorld";

export type Mondo = "agenda" | "soldi" | "ambra" | "grafite" | "ossidiana";

export const MONDI: Record<Mondo, { a: string; b: string; css: string }> = {
  agenda: { a: "#0e1430", b: "#2a44a8", css: "linear-gradient(160deg,#0e1430,#1a2a6b 55%,#2a44a8)" },
  soldi: { a: "#06231a", b: "#0d6044", css: "linear-gradient(160deg,#06231a,#0a4a34 55%,#0d6044)" },
  ambra: { a: "#2a1606", b: "#9c440d", css: "linear-gradient(160deg,#2a1606,#6e3009 55%,#9c440d)" },
  grafite: { a: "#0b0b0e", b: "#1c1c24", css: "linear-gradient(160deg,#0b0b0e,#141419 55%,#1c1c24)" },
  ossidiana: { a: "#0a0b0f", b: "#15161d", css: "linear-gradient(160deg,#0a0b0f,#101118 55%,#15161d)" },
};

export function mondoFromPath(path: string): Mondo {
  if (path.startsWith("/soldi")) return "soldi";
  if (path.startsWith("/dashboard")) return "grafite";
  if (path.startsWith("/anagrafiche") || path.startsWith("/cliente") || path.startsWith("/operaio")) return "ambra";
  if (path.startsWith("/nuovo") || path.startsWith("/impostazioni") || path.startsWith("/lavoro")) return "ossidiana";
  return "agenda";
}

/** Sfondo vivo per sezione: gradiente CSS (fallback) + shader WebGL sopra. */
export function World() {
  const { pathname } = useLocation();
  const m = MONDI[mondoFromPath(pathname)];
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 -z-20 transition-[background-image] duration-1000 ease-out"
        style={{ backgroundImage: m.css }}
      />
      <ShaderWorld colorA={m.a} colorB={m.b} />
    </>
  );
}
