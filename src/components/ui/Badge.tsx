import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Stato = "positivo" | "attenzione" | "critico" | "lichene" | "ottone" | "neutro";

const stati: Record<Stato, string> = {
  positivo: "bg-positivo/15 text-positivo",
  attenzione: "bg-attenzione/15 text-attenzione",
  critico: "bg-critico/15 text-critico",
  lichene: "bg-lichene/15 text-lichene",
  ottone: "bg-ottone/15 text-ottone-scuro",
  neutro: "bg-carta-ombra text-inchiostro-medio",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  stato?: Stato;
}

export function Badge({ stato = "neutro", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-xs",
        stati[stato],
        className,
      )}
      {...props}
    />
  );
}
