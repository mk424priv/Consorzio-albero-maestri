import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface VoceTab {
  k: string;
  label: string;
  icona?: ReactNode;
}

// Segmented control animato (indicatore che scorre). Scrollabile su mobile.
export function Segmented({
  voci,
  attivo,
  onChange,
  className,
  layoutId = "seg",
}: {
  voci: VoceTab[];
  attivo: string;
  onChange: (k: string) => void;
  className?: string;
  layoutId?: string;
}) {
  return (
    <div
      className={cn(
        "no-scrollbar flex gap-1 overflow-x-auto rounded-[14px] border border-line bg-surface-2 p-1",
        className,
      )}
    >
      {voci.map((v) => {
        const sel = v.k === attivo;
        return (
          <button
            key={v.k}
            onClick={() => onChange(v.k)}
            className={cn(
              "relative inline-flex shrink-0 items-center gap-1.5 rounded-[10px] px-3.5 py-2 text-sm font-semibold transition-colors",
              sel ? "text-brand-600" : "text-muted hover:text-ink",
            )}
          >
            {sel && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-[10px] bg-surface shadow-[var(--shadow-sm)] ring-1 ring-line"
                transition={{ type: "spring", stiffness: 520, damping: 38 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {v.icona}
              {v.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Chip filtro (per filtri di lista)
export function FilterChip({
  attivo,
  onClick,
  children,
}: {
  attivo: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.8rem] font-semibold transition-colors",
        attivo
          ? "border-brand-200 bg-brand-50 text-brand-600"
          : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
