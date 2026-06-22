import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";
import { tap, tapSoft } from "@/lib/motion";
import {
  TONO_CLASSI,
  STATO_PAGAMENTO_TONO,
  STATO_LAVORO_TONO,
  STATO_COMPENSO_TONO,
  STATO_ATTREZZO_TONO,
  type Tono,
} from "@/lib/entita";
import { etichetta } from "@/lib/dominio";
import { euro } from "@/lib/format";

/* ------------------------------- Button ------------------------------- */
type Variante = "primary" | "soft" | "ghost" | "outline" | "danger";
type Dim = "sm" | "md" | "lg" | "icon";

const VAR: Record<Variante, string> = {
  primary:
    "bg-gradient-to-b from-brand-400 to-brand-500 text-white shadow-[var(--shadow-glow)] hover:from-brand-400 hover:to-brand-600 border border-brand-500/60",
  soft: "bg-brand-50 text-brand-600 hover:bg-brand-100 border border-transparent",
  ghost: "bg-transparent text-ink-soft hover:bg-brand-50 hover:text-brand-600 border border-transparent",
  outline: "bg-surface text-ink hover:bg-surface-2 border border-line-strong",
  danger: "bg-danger-soft text-danger hover:brightness-95 border border-transparent",
};
const DIM: Record<Dim, string> = {
  sm: "h-9 px-3 text-[0.8rem] rounded-[10px] gap-1.5",
  md: "h-11 px-4 text-sm rounded-[12px] gap-2",
  lg: "h-12 px-5 text-[0.95rem] rounded-[14px] gap-2",
  icon: "h-10 w-10 rounded-[12px] justify-center",
};

export function Button({
  variante = "outline",
  dim = "md",
  className,
  children,
  ...props
}: HTMLMotionProps<"button"> & { variante?: Variante; dim?: Dim }) {
  return (
    <motion.button
      whileTap={tap}
      className={cn(
        "inline-flex select-none items-center justify-center font-semibold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-55 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100",
        VAR[variante],
        DIM[dim],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function LinkButton({
  to,
  variante = "outline",
  dim = "md",
  className,
  children,
}: {
  to: string;
  variante?: Variante;
  dim?: Dim;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex select-none items-center justify-center font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100",
        VAR[variante],
        DIM[dim],
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function IconButton({
  className,
  children,
  label,
  ...props
}: HTMLMotionProps<"button"> & { label?: string }) {
  return (
    <motion.button
      whileTap={tap}
      aria-label={label}
      title={label}
      className={cn(
        "inline-grid h-9 w-9 place-items-center rounded-[11px] text-muted transition-colors hover:bg-brand-50 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100",
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/* -------------------------------- Card -------------------------------- */
export function Card({
  className,
  hover,
  children,
  ...props
}: HTMLMotionProps<"div"> & { hover?: boolean }) {
  return (
    <motion.div
      className={cn(
        "rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-sm)]",
        hover && "transition-shadow duration-200 hover:shadow-[var(--shadow-md)]",
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------- Avatar ------------------------------- */
export function Avatar({
  nome,
  grad = "bg-gradient-to-br from-cliente-500 to-brand-700",
  size = "md",
  className,
}: {
  nome: string;
  grad?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const ini = nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  const dims = {
    sm: "h-8 w-8 text-[0.7rem]",
    md: "h-10 w-10 text-xs",
    lg: "h-12 w-12 text-sm",
    xl: "h-16 w-16 text-lg",
  }[size];
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-[30%] font-bold text-white shadow-sm",
        grad,
        dims,
        className,
      )}
    >
      {ini || "?"}
    </span>
  );
}

/* -------------------------------- Badge ------------------------------- */
export function Badge({
  tono = "neutral",
  className,
  children,
}: {
  tono?: Tono;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[0.72rem] font-semibold leading-none",
        TONO_CLASSI[tono],
        className,
      )}
    >
      {children}
    </span>
  );
}

type Genere = "pagamento" | "lavoro" | "compenso" | "attrezzo";
const MAPPE: Record<Genere, Record<string, Tono>> = {
  pagamento: STATO_PAGAMENTO_TONO,
  lavoro: STATO_LAVORO_TONO,
  compenso: STATO_COMPENSO_TONO,
  attrezzo: STATO_ATTREZZO_TONO,
};
export function StatusBadge({ genere, valore }: { genere: Genere; valore: string }) {
  const tono = MAPPE[genere][valore] ?? "neutral";
  return (
    <Badge tono={tono}>
      <span className={cn("h-1.5 w-1.5 rounded-full", `bg-current`)} />
      {etichetta(valore)}
    </Badge>
  );
}

/* ------------------------------- Codice ------------------------------- */
export function Codice({ codice }: { codice: string }) {
  return <span className="codice text-[0.78rem]">{codice}</span>;
}

/* ------------------------------- Importo ------------------------------ */
export function Importo({
  n,
  segno,
  className,
}: {
  n: number;
  segno?: 1 | -1;
  className?: string;
}) {
  const colore = segno === 1 ? "text-entrata-600" : segno === -1 ? "text-spesa-600" : "";
  const prefix = segno === 1 ? "+ " : segno === -1 ? "− " : "";
  return <span className={cn("font-semibold tabular-nums", colore, className)}>{prefix}{euro(Math.abs(n))}</span>;
}

/* ------------------------------- Metric ------------------------------- */
export function Metric({
  label,
  valore,
  tono = "neutral",
  icona,
  nota,
  onClick,
}: {
  label: string;
  valore: string;
  tono?: Tono;
  icona?: ReactNode;
  nota?: string;
  onClick?: () => void;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[0.72rem] font-semibold uppercase tracking-wide text-muted">{label}</span>
        {icona && <span className={cn("grid h-7 w-7 place-items-center rounded-[9px]", TONO_CLASSI[tono])}>{icona}</span>}
      </div>
      <div className="mt-1.5 text-[1.45rem] font-extrabold leading-none tracking-tight text-ink">{valore}</div>
      {nota && <div className="mt-1 text-[0.72rem] text-muted">{nota}</div>}
    </>
  );
  const cls = "rounded-[var(--radius-md)] border border-line bg-surface p-3.5 text-left shadow-[var(--shadow-sm)]";
  return onClick ? (
    <motion.button whileTap={tapSoft} onClick={onClick} className={cn(cls, "transition-shadow hover:shadow-[var(--shadow-md)]")}>
      {body}
    </motion.button>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/* ----------------------------- EmptyState ----------------------------- */
export function EmptyState({
  icona,
  titolo,
  testo,
  azione,
  className,
}: {
  icona?: ReactNode;
  titolo?: string;
  testo: string;
  azione?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-line-strong bg-surface/60 p-10 text-center",
        className,
      )}
    >
      {icona && <span className="grid h-14 w-14 place-items-center rounded-[var(--radius-md)] bg-brand-50 text-brand-400">{icona}</span>}
      {titolo && <div className="font-bold text-ink">{titolo}</div>}
      <p className="max-w-xs text-sm text-muted">{testo}</p>
      {azione}
    </div>
  );
}

/* ------------------------------ Skeleton ------------------------------ */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

/* ---------------------------- Page / Section -------------------------- */
export function PageHeader({
  titolo,
  sottotitolo,
  icona,
  azione,
}: {
  titolo: string;
  sottotitolo?: string;
  icona?: ReactNode;
  azione?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-center gap-3">
        {icona && (
          <span className="grid h-11 w-11 place-items-center rounded-[var(--radius-md)] bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-[var(--shadow-glow)]">
            {icona}
          </span>
        )}
        <div>
          <h1 className="text-[1.55rem] font-extrabold leading-tight text-ink">{titolo}</h1>
          {sottotitolo && <p className="mt-0.5 text-sm text-muted">{sottotitolo}</p>}
        </div>
      </div>
      {azione && <div className="flex flex-wrap items-center gap-2">{azione}</div>}
    </div>
  );
}

export function SectionHeader({
  titolo,
  icona,
  azione,
  className,
}: {
  titolo: string;
  icona?: ReactNode;
  azione?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-2", className)}>
      <h2 className="flex items-center gap-2 text-[0.95rem] font-bold text-ink">
        {icona && <span className="text-brand-500">{icona}</span>}
        {titolo}
      </h2>
      {azione}
    </div>
  );
}
