import { useLocation } from "react-router-dom";
import { ShaderWorld } from "./ShaderWorld";

export type Mondo = "agenda" | "soldi" | "ambra" | "grafite" | "ossidiana";

// Gradiente a strati: glow radiale acceso + base profonda = contrasto e profondità.
export const MONDI: Record<Mondo, { a: string; b: string; css: string }> = {
  agenda: {
    a: "#0b1330",
    b: "#3358d8",
    css: "radial-gradient(130% 90% at 82% 4%, #3a63f0 0%, rgba(58,99,240,0) 52%), radial-gradient(120% 80% at 0% 100%, #1b2a6b 0%, rgba(27,42,107,0) 50%), linear-gradient(160deg, #0a1230, #070b1c)",
  },
  soldi: {
    a: "#052018",
    b: "#11a06a",
    css: "radial-gradient(130% 90% at 80% 2%, #1bd089 0%, rgba(27,208,137,0) 52%), radial-gradient(120% 80% at 0% 100%, #0a5e40 0%, rgba(10,94,64,0) 50%), linear-gradient(160deg, #062018, #04130d)",
  },
  ambra: {
    a: "#2a1206",
    b: "#e0702a",
    css: "radial-gradient(130% 90% at 82% 2%, #ff8c3a 0%, rgba(255,140,58,0) 52%), radial-gradient(120% 80% at 0% 100%, #93420f 0%, rgba(147,66,15,0) 50%), linear-gradient(160deg, #2a1206, #170a04)",
  },
  grafite: {
    a: "#08090d",
    b: "#23242e",
    css: "radial-gradient(130% 90% at 80% 2%, #34374a 0%, rgba(52,55,74,0) 55%), linear-gradient(160deg, #131420, #06070b)",
  },
  ossidiana: {
    a: "#070810",
    b: "#181a26",
    css: "radial-gradient(130% 90% at 82% 2%, #2a2d44 0%, rgba(42,45,68,0) 55%), linear-gradient(160deg, #0c0e1a, #050610)",
  },
};

export function mondoFromPath(path: string): Mondo {
  if (path.startsWith("/soldi")) return "soldi";
  if (path.startsWith("/dashboard")) return "grafite";
  if (path.startsWith("/anagrafiche") || path.startsWith("/cliente") || path.startsWith("/operaio")) return "ambra";
  if (path.startsWith("/nuovo") || path.startsWith("/impostazioni") || path.startsWith("/lavoro")) return "ossidiana";
  return "agenda";
}

/** Sfondo vivo per sezione: gradiente animato (sempre) + shader WebGL sopra (se disponibile). */
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
