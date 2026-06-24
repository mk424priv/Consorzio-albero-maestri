import type { ReactNode } from "react";

type Tono = "neutro" | "verde" | "rosso" | "blu";

export function SectionHeader({ titolo, conteggio, tono = "neutro", azione }: { titolo: string; conteggio?: number; tono?: Tono; azione?: ReactNode }) {
  const c = { neutro: "text-bianco", verde: "text-verde", rosso: "text-rosso", blu: "text-blu" }[tono];
  const badge = {
    neutro: "bg-superficie-alta text-fumo",
    verde: "bg-verde/10 text-verde",
    rosso: "bg-rosso/10 text-rosso",
    blu: "bg-blu/10 text-blu",
  }[tono];
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h2 className={`text-base font-semibold ${c}`}>{titolo}</h2>
        {conteggio != null && <span className={`rounded-pill px-2 py-0.5 text-xs font-medium ${badge}`}>{conteggio}</span>}
      </div>
      {azione}
    </div>
  );
}
