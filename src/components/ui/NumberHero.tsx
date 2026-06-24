import NumberFlow from "@number-flow/react";
import { cn } from "@/lib/cn";

type Tono = "bianco" | "verde" | "rosso" | "blu";

/** Numero-eroe con transizione animata (NumberFlow). */
export function NumberHero({ value, euro = false, tono = "bianco", className }: { value: number; euro?: boolean; tono?: Tono; className?: string }) {
  const c = { bianco: "text-bianco", verde: "text-verde", rosso: "text-rosso", blu: "text-blu" }[tono];
  return (
    <span className={cn("font-display font-bold tracking-tight tabular-nums", c, className)}>
      <NumberFlow
        value={value}
        locales="it-IT"
        format={euro ? { style: "currency", currency: "EUR", maximumFractionDigits: 2 } : { maximumFractionDigits: 2 }}
      />
    </span>
  );
}
