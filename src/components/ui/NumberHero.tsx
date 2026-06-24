import NumberFlow from "@number-flow/react";
import { cn } from "@/lib/cn";

/** Numero-eroe con transizione animata (canone 04 §5). */
export function NumberHero({ value, euro = false, className }: { value: number; euro?: boolean; className?: string }) {
  return (
    <span className={cn("font-display font-semibold tabular-nums text-bianco", className)}>
      <NumberFlow
        value={value}
        locales="it-IT"
        format={euro ? { style: "currency", currency: "EUR", maximumFractionDigits: 2 } : { maximumFractionDigits: 2 }}
      />
    </span>
  );
}
