import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Pillola di vetro con la data (oggetto-segnaposto dell'Agenda). */
export interface TarghettaProps extends HTMLAttributes<HTMLDivElement> {
  giorno: number | string;
  mese?: string;
  giornoSettimana?: string;
}

export function Targhetta({ giorno, mese, giornoSettimana, className, ...props }: TarghettaProps) {
  return (
    <div
      className={cn(
        "glass-alta inline-flex select-none items-baseline gap-1.5 rounded-bolla px-4 py-2 text-bianco",
        className,
      )}
      {...props}
    >
      {giornoSettimana && (
        <span className="font-mono text-[0.6rem] uppercase tracking-widest text-fumo">{giornoSettimana}</span>
      )}
      <span className="font-display text-2xl font-semibold leading-none tabular-nums">{giorno}</span>
      {mese && <span className="font-mono text-[0.6rem] uppercase tracking-widest text-fumo">{mese}</span>}
    </div>
  );
}
