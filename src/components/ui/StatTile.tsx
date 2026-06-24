import type { ReactNode } from "react";

type Tono = "neutro" | "verde" | "rosso" | "blu";

export function StatTile({ etichetta, children, tono = "neutro", onClick }: { etichetta: string; children: ReactNode; tono?: Tono; onClick?: () => void }) {
  const c = { neutro: "text-bianco", verde: "text-verde", rosso: "text-rosso", blu: "text-blu" }[tono];
  const cls = "flex flex-col gap-1 rounded-vetro bg-superficie p-4 text-left";
  const inner = (
    <>
      <span className="font-mono text-[10px] uppercase tracking-label text-fumo-2">{etichetta}</span>
      <span className={`text-xl font-bold tracking-tight ${c}`}>{children}</span>
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${cls} transition-transform active:scale-[0.98]`}>
        {inner}
      </button>
    );
  }
  return <div className={cls}>{inner}</div>;
}
