import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Codice parlante del cliente: timbro di ottone, mono, "numero d'inventario". */
export interface CodiceProps extends HTMLAttributes<HTMLSpanElement> {
  value: string;
  grande?: boolean;
}

export function Codice({ value, grande = false, className, ...props }: CodiceProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-targhetta border border-ottone/40 bg-ottone/10 font-mono font-medium tracking-wider text-ottone-scuro",
        grande ? "px-3 py-1 text-lg" : "px-2 py-0.5 text-sm",
        className,
      )}
      {...props}
    >
      {value}
    </span>
  );
}
