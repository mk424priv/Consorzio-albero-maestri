import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Codice parlante: gettone di vetro con accento lime, mono. */
export interface CodiceProps extends HTMLAttributes<HTMLSpanElement> {
  value: string;
  grande?: boolean;
}

export function Codice({ value, grande = false, className, ...props }: CodiceProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill bg-lime/12 font-mono font-medium tracking-wider text-lime",
        grande ? "px-4 py-1.5 text-xl" : "px-2.5 py-0.5 text-sm",
        className,
      )}
      {...props}
    >
      {value}
    </span>
  );
}
