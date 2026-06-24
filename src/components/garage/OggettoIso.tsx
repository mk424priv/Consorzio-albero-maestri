import type { CSSProperties } from "react";
import { formatData, formatEuro } from "@/lib/format";
import type { Attrezzo, CategoriaAttrezzo } from "@/lib/types";

const COLORE: Record<CategoriaAttrezzo, string> = {
  auto: "#3b6ef5",
  motore: "#f5603a",
  elettrico: "#1bb574",
  manuale: "#6a5bd8",
};

/** Cubetto isometrico CSS (3 facce), leggero per le liste. */
function IsoCube({ size = 42, color }: { size?: number; color: string }) {
  const h = size / 2;
  const face: CSSProperties = { position: "absolute", width: size, height: size, borderRadius: 4 };
  return (
    <div style={{ width: size, height: size, perspective: 260, transform: "translateZ(0)" }}>
      <div style={{ position: "relative", width: size, height: size, transformStyle: "preserve-3d", transform: "rotateX(-24deg) rotateY(36deg)" }}>
        <div style={{ ...face, background: color, transform: `translateZ(${h}px)` }} />
        <div style={{ ...face, background: color, transform: `rotateX(90deg) translateZ(${h}px)`, filter: "brightness(1.22)" }} />
        <div style={{ ...face, background: color, transform: `rotateY(90deg) translateZ(${h}px)`, filter: "brightness(0.78)" }} />
      </div>
    </div>
  );
}

export function OggettoIso({ attrezzo, onClick }: { attrezzo: Attrezzo; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-4 rounded-vetro bg-superficie p-3.5 text-left shadow-card transition-transform active:scale-[0.99]">
      <div className="grid h-14 w-14 shrink-0 place-items-center">
        <IsoCube color={COLORE[attrezzo.categoria]} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[15px] font-semibold">{attrezzo.nome}</span>
        {attrezzo.caratteristiche && <span className="truncate text-xs text-fumo">{attrezzo.caratteristiche}</span>}
        <span className="mt-0.5 font-mono text-[11px] text-fumo-2">acquisto {attrezzo.dataAcquisto ? formatData(attrezzo.dataAcquisto) : "—"}</span>
      </div>
      {attrezzo.prezzo != null && <span className="shrink-0 text-base font-bold tracking-tight">{formatEuro(attrezzo.prezzo)}</span>}
    </button>
  );
}
