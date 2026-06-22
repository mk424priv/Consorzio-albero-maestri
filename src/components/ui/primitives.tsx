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
type Variante = "primary" | "soft" | "ghost" | "outline" | "danger" | "glass";
type Dim = "sm" | "md" | "lg" | "icon";

const VAR: Record<Variante, string> = {
  primary:
    "bg-gradient-to-b from-brand-400 to-brand-500 text-white shadow-[var(--shadow-glow)] hover:from-brand-400 hover:to-brand-600 border border-brand-500/60",
  soft: "bg-brand-50 text-brand-600 hover:bg-brand-100 border border-transparent",
  ghost: "bg-transparent text-ink-soft hover:bg-brand-50 hover:text-brand-600 border border-transparent",
  outline: "bg-surface text-ink hover:bg-surface-2 border border-line-strong",
  danger: "bg-danger-soft text-danger hover:brightness-95 border border-transparent",
  glass: "bg-white/15 text-white hover:bg-white/25 border border-white/25 backdrop-blur",
};
const DIM: Record<Dim, string> = {
  sm: "h-8 px-2.5 text-[0.78rem] rounded-[9px] gap-1.5",
  md: "h-10 px-3.5 text-[0.82rem] rounded-[10px] gap-1.5",
  lg: "h-11 px-5 text-sm rounded-[12px] gap-2",
  icon: "h-9 w-9 rounded-[10px] justify-center",
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
    sm: "h-7 w-7 text-[0.62rem]",
    md: "h-9 w-9 text-[0.7rem]",
    lg: "h-11 w-11 text-[0.8rem]",
    xl: "h-14 w-14 text-base",
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
        <span className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted">{label}</span>
        {icona && <span className={cn("grid h-7 w-7 place-items-center rounded-[8px]", TONO_CLASSI[tono])}>{icona}</span>}
      </div>
      <div className="mt-1 text-[1.2rem] font-extrabold leading-none tracking-tight text-ink">{valore}</div>
      {nota && <div className="mt-1 text-[0.68rem] text-muted">{nota}</div>}
    </>
  );
  const cls = "rounded-[var(--radius-md)] border border-line bg-surface p-3 text-left shadow-[var(--shadow-sm)]";
  return onClick ? (
    <motion.button whileTap={tapSoft} onClick={onClick} className={cn(cls, "transition-shadow hover:shadow-[var(--shadow-md)]")}>
      {body}
    </motion.button>
  ) : (
    <div className={cls}>{body}</div>
  );
}

// Tile statistica dentro un PageHero (sfondo colorato).
export function HeroStat({
  label,
  valore,
  nota,
  onClick,
}: {
  label: string;
  valore: string;
  nota?: string;
  onClick?: () => void;
}) {
  const body = (
    <>
      <div className="text-[0.6rem] font-bold uppercase tracking-wide text-white/65">{label}</div>
      <div className="mt-0.5 text-[1.02rem] font-extrabold leading-none text-white">{valore}</div>
      {nota && <div className="mt-0.5 text-[0.62rem] text-white/65">{nota}</div>}
    </>
  );
  const cls = "rounded-[13px] border border-white/15 bg-white/12 px-3 py-2.5 text-left backdrop-blur";
  return onClick ? (
    <motion.button whileTap={tapSoft} onClick={onClick} className={cn(cls, "transition-colors hover:bg-white/20")}>
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
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {icona && (
          <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-[var(--shadow-glow)]">
            {icona}
          </span>
        )}
        <div>
          <h1 className="text-[1.3rem] font-extrabold leading-tight text-ink">{titolo}</h1>
          {sottotitolo && <p className="mt-0.5 text-[0.82rem] text-muted">{sottotitolo}</p>}
        </div>
      </div>
      {azione && <div className="flex flex-wrap items-center gap-2">{azione}</div>}
    </div>
  );
}

// Hero a tutta larghezza con tinta della pagina: dà identità a ogni schermata.
export function PageHero({
  grad,
  eyebrow,
  titolo,
  sottotitolo,
  icona,
  azione,
  children,
}: {
  grad: string;
  eyebrow?: string;
  titolo: string;
  sottotitolo?: string;
  icona?: ReactNode;
  azione?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn("relative mb-5 overflow-hidden rounded-[var(--radius-xl)] p-5 text-white shadow-[var(--shadow-md)]", grad)}
    >
      <div className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-black/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {icona && <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-white/15 backdrop-blur">{icona}</span>}
          <div className="min-w-0">
            {eyebrow && <div className="text-[0.66rem] font-bold uppercase tracking-[0.12em] text-white/70">{eyebrow}</div>}
            <h1 className="text-xl font-extrabold leading-tight">{titolo}</h1>
            {sottotitolo && <p className="mt-0.5 text-[0.82rem] text-white/85">{sottotitolo}</p>}
          </div>
        </div>
        {azione && <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{azione}</div>}
      </div>
      {children && <div className="relative mt-4">{children}</div>}
    </motion.div>
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
