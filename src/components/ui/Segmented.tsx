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
  layoutId?: string;
  className?: string;
}

/** Capsula di vetro con pillola lime che scivola. */
export function Segmented<T extends string>({
  options,
  value,
  onValueChange,
  layoutId = "segmented",
  className,
}: SegmentedProps<T>) {
  return (
    <div role="radiogroup" className={cn("glass-bassa inline-flex rounded-pill p-1", className)}>
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
              "relative z-0 flex-1 rounded-pill px-3 py-2 text-center text-sm font-medium transition-colors",
              active ? "text-fondo" : "text-fumo hover:text-bianco",
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 -z-10 rounded-pill bg-lime"
                transition={{ type: "spring", stiffness: 340, damping: 32 }}
              />
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
