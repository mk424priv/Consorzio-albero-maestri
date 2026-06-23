import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
}

export interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onValueChange: (v: T) => void;
  /** layoutId univoco se ci sono piu' Segmented in pagina. */
  layoutId?: string;
  className?: string;
}

/** Controllo segmentato con pillola attiva che scivola (motion layoutId). */
export function Segmented<T extends string>({
  options,
  value,
  onValueChange,
  layoutId = "segmented",
  className,
}: SegmentedProps<T>) {
  return (
    <div role="radiogroup" className={cn("inline-flex rounded-targhetta bg-carta-bassa p-1", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onValueChange(o.value)}
            className={cn(
              "relative z-0 flex-1 rounded-[0.5rem] px-3 py-1.5 text-center font-sans text-sm font-medium transition-colors",
              active ? "text-inchiostro" : "text-inchiostro-debole hover:text-inchiostro-medio",
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 -z-10 rounded-[0.5rem] bg-carta-alta shadow-svolto"
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
              />
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
