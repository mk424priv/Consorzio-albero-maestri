import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Timbro inclinato (es. "SVOLTO"), come un'impronta di gomma sull'inchiostro. */
type StampColor = "ottone" | "lichene" | "critico" | "inchiostro";

const colors: Record<StampColor, string> = {
  ottone: "border-ottone/60 text-ottone",
  lichene: "border-lichene/60 text-lichene",
  critico: "border-critico/60 text-critico",
  inchiostro: "border-inchiostro/50 text-inchiostro-medio",
};

export interface StampProps extends HTMLAttributes<HTMLSpanElement> {
  color?: StampColor;
}

export function Stamp({ children, color = "ottone", className, ...props }: StampProps) {
  return (
    <span
      className={cn(
        "inline-block -rotate-6 rounded-quietanza border-2 px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-widest opacity-80",
        colors[color],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
