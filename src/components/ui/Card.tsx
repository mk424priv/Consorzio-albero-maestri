import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Tono = personalita' della superficie (canone 01 §2): passato caldo/posato,
 *  futuro freddo/galleggiante, soldi scuro/inciso. */
type Tono = "alta" | "piana" | "svolto" | "programmato" | "incasso";

const toni: Record<Tono, string> = {
  alta: "bg-carta-alta text-inchiostro rounded-carta shadow-carta",
  piana: "bg-carta-bassa text-inchiostro rounded-carta",
  svolto: "bg-carta-svolto text-inchiostro rounded-quietanza shadow-svolto",
  programmato:
    "bg-carta-programmato text-inchiostro rounded-carta border border-dashed border-inchiostro-debole/50 shadow-programmato reticolo",
  incasso: "bg-carta-incasso text-inchiostro-chiaro rounded-carta shadow-cassa",
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
