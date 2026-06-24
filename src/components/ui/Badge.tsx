import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Stato = "positivo" | "attenzione" | "critico" | "lichene" | "ottone" | "neutro";

const stati: Record<Stato, string> = {
  positivo: "bg-positivo/15 text-positivo",
  attenzione: "bg-attenzione/15 text-attenzione",
  critico: "bg-critico/15 text-critico",
  lichene: "bg-lime/15 text-lime",
  ottone: "bg-lime/15 text-lime",
  neutro: "bg-white/10 text-fumo",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  stato?: Stato;
}

export function Badge({ stato = "neutro", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 font-mono text-xs",
        stati[stato],
        className,
      )}
      {...props}
    />
  );
}
