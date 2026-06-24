import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/*
  Riga-storia canonica (canone 08): [cerchio-icona colore categoria] titolo + meta …
  [importo colore stato] [extra]. Colore = velatura+icona+importo, NIENTE bordi/strisce.
  La varietà viene dal PESO (enfasi/normale/quieto), non da cornici.
*/

export type RigaTono = "neutro" | "blu" | "verde" | "rosso" | "ambra" | "viola" | "ciano";
export type RigaPeso = "enfasi" | "normale" | "quieto";

const ICONA: Record<RigaTono, string> = {
  neutro: "bg-superficie-bassa text-fumo",
  blu: "bg-blu/12 text-blu",
  verde: "bg-verde/12 text-verde",
  rosso: "bg-rosso/12 text-rosso",
  ambra: "bg-attenzione/12 text-attenzione",
  viola: "bg-viola/12 text-viola",
  ciano: "bg-ciano/12 text-ciano",
};
const IMPORTO: Record<RigaTono, string> = {
  neutro: "text-bianco",
  blu: "text-blu",
  verde: "text-verde",
  rosso: "text-rosso",
  ambra: "text-attenzione",
  viola: "text-viola",
  ciano: "text-ciano",
};

export interface RigaStoriaProps {
  icona?: LucideIcon;
  avatar?: ReactNode;
  tonoIcona?: RigaTono;
  titolo: ReactNode;
  meta?: ReactNode;
  importo?: ReactNode;
  importoTono?: RigaTono;
  destra?: ReactNode;
  peso?: RigaPeso;
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
}

export function RigaStoria({
  icona: Icon,
  avatar,
  tonoIcona = "neutro",
  titolo,
  meta,
  importo,
  importoTono = "neutro",
  destra,
  peso = "normale",
  onClick,
  className,
  children,
}: RigaStoriaProps) {
  const pad = peso === "quieto" ? "px-3.5 py-2.5" : "px-3.5 py-3";
  const size = peso === "enfasi" ? "text-lg" : peso === "quieto" ? "text-sm" : "text-base";
  const interactive = onClick
    ? { role: "button" as const, tabIndex: 0, onClick, onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } }
    : {};
  return (
    <div
      {...interactive}
      className={cn("flex w-full items-center gap-3 rounded-vetro bg-superficie text-left shadow-card", pad, onClick && "cursor-pointer transition-transform active:scale-[0.99]", className)}
    >
      {avatar ?? (Icon && <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", ICONA[tonoIcona])}><Icon className="h-[18px] w-[18px]" /></span>)}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] font-semibold leading-tight">{titolo}</span>
        {meta && <span className="truncate text-[12px] text-fumo-2">{meta}</span>}
        {children}
      </span>
      {(importo != null || destra) && (
        <span className="flex shrink-0 flex-col items-end gap-1">
          {destra}
          {importo != null && <span className={cn("font-bold tracking-tight tabular-nums", size, IMPORTO[importoTono])}>{importo}</span>}
        </span>
      )}
    </div>
  );
}
