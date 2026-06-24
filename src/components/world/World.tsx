import { useLocation } from "react-router-dom";
import { ShaderWorld } from "./ShaderWorld";

export type Mondo = "agenda" | "soldi" | "ambra" | "grafite" | "ossidiana";

// Tela quasi-nera + glow di sezione FIOCO in alto. Le card sono solide sopra.
export const MONDI: Record<Mondo, { a: string; b: string; css: string }> = {
  agenda: { a: "#0c1230", b: "#1b2a6b", css: "radial-gradient(120% 70% at 50% -12%, rgba(44,64,150,0.5) 0%, rgba(44,64,150,0) 60%), #08080a" },
  soldi: { a: "#06231a", b: "#0c5a3e", css: "radial-gradient(120% 70% at 50% -12%, rgba(20,128,86,0.46) 0%, rgba(20,128,86,0) 60%), #08080a" },
  ambra: { a: "#2a1206", b: "#7a3b0e", css: "radial-gradient(120% 70% at 50% -12%, rgba(160,86,32,0.46) 0%, rgba(160,86,32,0) 60%), #08080a" },
  grafite: { a: "#0c0c10", b: "#1a1a20", css: "radial-gradient(120% 70% at 50% -12%, rgba(64,64,80,0.4) 0%, rgba(64,64,80,0) 60%), #08080a" },
  ossidiana: { a: "#0a0a10", b: "#15151d", css: "radial-gradient(120% 70% at 50% -12%, rgba(44,44,66,0.36) 0%, rgba(44,44,66,0) 60%), #08080a" },
};

export function mondoFromPath(path: string): Mondo {
  if (path.startsWith("/soldi")) return "soldi";
  if (path.startsWith("/dashboard")) return "grafite";
  if (path.startsWith("/anagrafiche") || path.startsWith("/cliente") || path.startsWith("/operaio")) return "ambra";
  if (path.startsWith("/nuovo") || path.startsWith("/impostazioni") || path.startsWith("/lavoro")) return "ossidiana";
  return "agenda";
}

/** Sfondo: glow di sezione fioco e animato + shader sottilissimo sopra (ambient). */
export function World() {
  const { pathname } = useLocation();
  const m = MONDI[mondoFromPath(pathname)];
  return (
    <>
      <div
        className="mondo-anim pointer-events-none fixed inset-0 -z-20 transition-[background-image] duration-1000 ease-out"
        style={{ backgroundImage: m.css }}
      />
      <ShaderWorld colorA={m.a} colorB={m.b} />
    </>
  );
}
