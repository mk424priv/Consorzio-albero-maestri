import { MeshGradient } from "./MeshGradient";

const PALETTE = {
  brand: ["#0a58ff", "#00d15e", "#4b0082", "#ff3b30"],
  cielo: ["#0a58ff", "#1b9cff", "#0a2a6b", "#00d15e"],
  linfa: ["#00d15e", "#7bff3a", "#0a5e40", "#0a58ff"],
  terra: ["#ff7a1a", "#ff3b30", "#7a3b0e", "#ffb03a"],
  verde: ["#00d15e", "#0a58ff", "#0a3a2a", "#00d15e"],
  blu: ["#0a58ff", "#4b0082", "#0a2a6b", "#0a58ff"],
  rosso: ["#ff3b30", "#4b0082", "#2a0a0a", "#ff3b30"],
  notte: ["#0a58ff", "#1a1147", "#050505", "#0a58ff"],
} as const;

export type MeshTono = keyof typeof PALETTE;

/** Striscia/header a mesh WebGL tonata. Va in un parent relativo. */
export function MeshStrip({ tono = "brand", className, overlay = true }: { tono?: MeshTono; className?: string; overlay?: boolean }) {
  return (
    <div className={className ?? "absolute inset-0"}>
      <MeshGradient colors={PALETTE[tono] as [string, string, string, string]} />
      {overlay && <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />}
    </div>
  );
}
