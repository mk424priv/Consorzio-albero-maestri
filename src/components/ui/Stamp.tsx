import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Etichetta-chip di stato (es. "svolto"), pulita su vetro. */
type StampColor = "ottone" | "lichene" | "critico" | "inchiostro";

const colors: Record<StampColor, string> = {
  ottone: "text-lime",
  lichene: "text-fumo",
  critico: "text-critico",
  inchiostro: "text-fumo-2",
};

export interface StampProps extends HTMLAttributes<HTMLSpanElement> {
  color?: StampColor;
}

export function Stamp({ children, color = "ottone", className, ...props }: StampProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill bg-white/8 px-2.5 py-0.5 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.15em]",
        colors[color],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
