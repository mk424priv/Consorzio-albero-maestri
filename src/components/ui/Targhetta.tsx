import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** L'oggetto-eroe: targhetta di ottone con il giorno (canone 01 §1, 02 §5.5).
 *  Accompagna l'Agenda e si appiccica in alto allo scroll. */
export interface TarghettaProps extends HTMLAttributes<HTMLDivElement> {
  giorno: number | string;
  mese?: string;
  giornoSettimana?: string;
}

export function Targhetta({
  giorno,
  mese,
  giornoSettimana,
  className,
  ...props
}: TarghettaProps) {
  return (
    <div
      className={cn(
        "inline-flex select-none flex-col items-center rounded-targhetta px-3 py-1.5 text-carta-alta shadow-targhetta",
        className,
      )}
      style={{
        backgroundImage:
          "linear-gradient(to bottom, var(--color-ottone-chiaro), var(--color-ottone))",
      }}
      {...props}
    >
      {giornoSettimana && (
        <span className="font-mono text-[0.6rem] uppercase tracking-widest opacity-90">
          {giornoSettimana}
        </span>
      )}
      <span className="font-display text-xl font-semibold leading-none tabular-nums">
        {giorno}
      </span>
      {mese && (
        <span className="font-mono text-[0.6rem] uppercase tracking-widest opacity-90">
          {mese}
        </span>
      )}
    </div>
  );
}
