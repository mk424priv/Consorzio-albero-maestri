// Componenti statistici "individuali": ogni dato ha la sua forma e gerarchia.
// StatCard (accento per entità), RingStat (anello %), Barra (progresso).
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { ENTITA, type ChiaveEntita } from "@/lib/entita";

const clamp01 = (n: number) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));

/* ------------------------------ Barra ------------------------------- */
export function Barra({
  ratio,
  accent = "entrata",
  className,
}: {
  ratio: number;
  accent?: ChiaveEntita;
  className?: string;
}) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-surface-2", className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clamp01(ratio) * 100}%` }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={cn("h-full rounded-full", ENTITA[accent].dot)}
      />
    </div>
  );
}

/* ----------------------------- StatCard ----------------------------- */
// Scheda statistica con accento di entità, icona e (opzionale) progresso.
export function StatCard({
  accent = "entrata",
  label,
  valore,
  nota,
  icona,
  ratio,
  grande,
  className,
  children,
}: {
  accent?: ChiaveEntita;
  label: string;
  valore: string;
  nota?: string;
  icona?: ReactNode;
  ratio?: number;
  grande?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const meta = ENTITA[accent];
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface p-3.5 shadow-[var(--shadow-sm)]",
        className,
      )}
    >
      {/* striscia d'accento a sinistra */}
      <span className={cn("absolute inset-y-0 left-0 w-1", meta.dot)} />
      <div className="flex items-start justify-between gap-2">
        <span className="text-[0.68rem] font-bold uppercase tracking-wide text-muted">{label}</span>
        {icona && <span className={cn("grid h-7 w-7 place-items-center rounded-[9px]", meta.soft)}>{icona}</span>}
      </div>
      <div className={cn("mt-1 font-extrabold leading-none tracking-tight text-ink", grande ? "text-[1.6rem]" : "text-[1.2rem]")}>{valore}</div>
      {nota && <div className="mt-1 text-[0.68rem] text-muted">{nota}</div>}
      {typeof ratio === "number" && <Barra ratio={ratio} accent={accent} className="mt-2.5" />}
      {children}
    </div>
  );
}

/* ----------------------------- RingStat ----------------------------- */
// Anello percentuale (SVG) con etichetta e valore: dato "primario".
export function RingStat({
  ratio,
  accent = "entrata",
  label,
  valore,
  sub,
  className,
}: {
  ratio: number;
  accent?: ChiaveEntita;
  label: string;
  valore: string;
  sub?: string;
  className?: string;
}) {
  const meta = ENTITA[accent];
  const R = 26;
  const C = 2 * Math.PI * R;
  const r = clamp01(ratio);
  return (
    <div className={cn("flex items-center gap-3.5 rounded-[var(--radius-md)] border border-line bg-surface p-3.5 shadow-[var(--shadow-sm)]", className)}>
      <div className="relative grid h-16 w-16 shrink-0 place-items-center">
        <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
          <circle cx="32" cy="32" r={R} fill="none" strokeWidth="6" className="text-line" stroke="currentColor" />
          <motion.circle
            cx="32" cy="32" r={R} fill="none" strokeWidth="6" strokeLinecap="round"
            className={meta.text} stroke="currentColor" strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C * (1 - r) }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <span className="absolute text-[0.78rem] font-extrabold text-ink">{Math.round(r * 100)}%</span>
      </div>
      <div className="min-w-0">
        <div className="text-[0.68rem] font-bold uppercase tracking-wide text-muted">{label}</div>
        <div className="text-[1.3rem] font-extrabold leading-none tracking-tight text-ink">{valore}</div>
        {sub && <div className="mt-0.5 text-[0.7rem] text-muted">{sub}</div>}
      </div>
    </div>
  );
}
