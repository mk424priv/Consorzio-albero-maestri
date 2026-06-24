import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Tono = livello di vetro (gerarchia per profondità, niente bordi). */
type Tono = "alta" | "piana" | "svolto" | "programmato" | "incasso";

const toni: Record<Tono, string> = {
  alta: "glass rounded-vetro text-bianco",
  piana: "glass-bassa rounded-vetro text-bianco",
  svolto: "glass rounded-vetro text-bianco",
  programmato: "glass-bassa rounded-vetro text-bianco",
  incasso: "glass-scura rounded-vetro text-bianco",
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tono?: Tono;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, tono = "alta", ...props }, ref) => (
    <div ref={ref} className={cn("relative", toni[tono], className)} {...props} />
  ),
);
Card.displayName = "Card";
