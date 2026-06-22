// Statistiche "vive": numeri animati, anelli, donut, sparkline, barre.
// Ogni dato può avere una forma diversa → gerarchia e personalità.
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { cn } from "@/lib/cn";
import { ENTITA, type ChiaveEntita } from "@/lib/entita";

const clamp01 = (n: number) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));

/* ---------------------- Numeri animati (NumberFlow) ------------------- */
export function Cifra({ valore, className }: { valore: number; className?: string }) {
  return (
    <NumberFlow
      value={valore}
      locales="it-IT"
      format={{ style: "currency", currency: "EUR", maximumFractionDigits: 2 }}
      className={className}
    />
  );
}
export function Conta({ valore, suffix, className }: { valore: number; suffix?: string; className?: string }) {
  return (
    <span className={className}>
      <NumberFlow value={valore} locales="it-IT" />
      {suffix}
    </span>
  );
}

/* ------------------------------ Barra ------------------------------- */
export function Barra({ ratio, accent = "entrata", className }: { ratio: number; accent?: ChiaveEntita; className?: string }) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-surface-2", className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clamp01(ratio) * 100}%` }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className={cn("h-full rounded-full", ENTITA[accent].dot)}
      />
    </div>
  );
}

/* ----------------------------- StatCard ----------------------------- */
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
  valore: ReactNode;
  nota?: string;
  icona?: ReactNode;
  ratio?: number;
  grande?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const meta = ENTITA[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn("relative overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface p-3.5 shadow-[var(--shadow-sm)]", className)}
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", meta.dot)} />
      <div className="flex items-start justify-between gap-2">
        <span className="text-[0.68rem] font-bold uppercase tracking-wide text-muted">{label}</span>
        {icona && <span className={cn("grid h-7 w-7 place-items-center rounded-[9px]", meta.soft)}>{icona}</span>}
      </div>
      <div className={cn("mt-1 font-extrabold leading-none tracking-tight text-ink", grande ? "text-[1.6rem]" : "text-[1.2rem]")}>{valore}</div>
      {nota && <div className="mt-1 text-[0.68rem] text-muted">{nota}</div>}
      {typeof ratio === "number" && <Barra ratio={ratio} accent={accent} className="mt-2.5" />}
      {children}
    </motion.div>
  );
}

/* ----------------------------- RingStat ----------------------------- */
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
  valore: ReactNode;
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
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
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

/* ------------------------------- Donut ------------------------------ */
export interface Segmento {
  valore: number;
  classe: string; // es. "text-entrata-500"
  label: string;
}
export function Donut({ segmenti, size = 92, centro }: { segmenti: Segmento[]; size?: number; centro?: ReactNode }) {
  const R = 36;
  const C = 2 * Math.PI * R;
  const totale = segmenti.reduce((a, s) => a + Math.max(0, s.valore), 0) || 1;
  let acc = 0;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 92 92" className="-rotate-90">
        <circle cx="46" cy="46" r={R} fill="none" strokeWidth="11" className="text-surface-2" stroke="currentColor" />
        {segmenti.map((s, i) => {
          const frac = Math.max(0, s.valore) / totale;
          const len = C * frac;
          const off = -acc * C;
          acc += frac;
          return (
            <motion.circle
              key={i}
              cx="46" cy="46" r={R} fill="none" strokeWidth="11" strokeLinecap="round"
              className={s.classe} stroke="currentColor"
              strokeDasharray={`${len} ${C}`}
              initial={{ strokeDashoffset: off + C }}
              animate={{ strokeDashoffset: off }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 }}
            />
          );
        })}
      </svg>
      {centro && <div className="absolute grid place-items-center text-center">{centro}</div>}
    </div>
  );
}

/* ----------------------------- Sparkline ---------------------------- */
export function Sparkline({
  valori,
  accent = "entrata",
  className,
  height = 40,
}: {
  valori: number[];
  accent?: ChiaveEntita;
  className?: string;
  height?: number;
}) {
  const meta = ENTITA[accent];
  const W = 100;
  const H = 32;
  if (valori.length < 2) return <div className={className} style={{ height }} />;
  const min = Math.min(...valori);
  const max = Math.max(...valori);
  const span = max - min || 1;
  const pts = valori.map((v, i) => {
    const x = (i / (valori.length - 1)) * W;
    const y = H - ((v - min) / span) * (H - 4) - 2;
    return [x, y] as const;
  });
  const linea = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${linea} L${W},${H} L0,${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={cn("w-full", className)} style={{ height }}>
      <path d={area} className={meta.text} fill="currentColor" opacity={0.12} />
      <motion.path
        d={linea} fill="none" className={meta.text} stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: "easeOut" }}
      />
    </svg>
  );
}
