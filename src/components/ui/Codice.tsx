import type { HTMLAttributes, MouseEvent } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";

/** Codice parlante: gettone di vetro con accento lime, mono. `copiabile` → tap-to-copy. */
export interface CodiceProps extends HTMLAttributes<HTMLSpanElement> {
  value: string;
  grande?: boolean;
  copiabile?: boolean;
}

export function Codice({ value, grande = false, copiabile = false, className, onClick, ...props }: CodiceProps) {
  const handle = copiabile
    ? (e: MouseEvent<HTMLSpanElement>) => {
        e.stopPropagation();
        void navigator.clipboard?.writeText(value);
        toast.success("Codice copiato");
        onClick?.(e);
      }
    : onClick;
  return (
    <span
      role={copiabile ? "button" : undefined}
      tabIndex={copiabile ? 0 : undefined}
      onClick={handle}
      className={cn(
        "inline-flex items-center rounded-pill bg-lime/12 font-mono font-medium tracking-wider text-lime",
        grande ? "px-4 py-1.5 text-xl" : "px-2.5 py-0.5 text-sm",
        copiabile && "cursor-pointer active:scale-95",
        className,
      )}
      {...props}
    >
      {value}
    </span>
  );
}
