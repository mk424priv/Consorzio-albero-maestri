import type { ReactNode } from "react";

type Tono = "neutro" | "verde" | "rosso" | "blu";

export function StatTile({ etichetta, children, tono = "neutro" }: { etichetta: string; children: ReactNode; tono?: Tono }) {
  const c = { neutro: "text-bianco", verde: "text-verde", rosso: "text-rosso", blu: "text-blu" }[tono];
  return (
    <div className="flex flex-col gap-1 rounded-vetro bg-superficie p-4">
      <span className="font-mono text-[10px] uppercase tracking-label text-fumo-2">{etichetta}</span>
      <span className={`text-xl font-bold tracking-tight ${c}`}>{children}</span>
    </div>
  );
}
