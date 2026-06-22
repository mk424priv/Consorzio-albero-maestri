// Libreria di componenti UI — i mattoni stilizzati dell'interfaccia.
import { Link } from "react-router-dom";
import { clsx } from "clsx";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { etichetta, type StatoPagamento } from "@/lib/dominio";
import { euro } from "@/lib/format";

/* ----------------------------- Button ----------------------------- */
type Variante = "primary" | "default" | "ghost" | "danger";
type Dim = "sm" | "md" | "icon";

const varianteCls: Record<Variante, string> = {
  primary: "btn-primary",
  default: "",
  ghost: "btn-ghost",
  danger: "btn-danger",
};
const dimCls: Record<Dim, string> = { sm: "btn-sm", md: "", icon: "btn-icon" };

export function Button({
  variante = "default",
  dim = "md",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; dim?: Dim }) {
  return (
    <button className={clsx("btn", varianteCls[variante], dimCls[dim], className)} {...props}>
      {children}
    </button>
  );
}

export function LinkButton({
  to,
  variante = "default",
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
    <Link to={to} className={clsx("btn", varianteCls[variante], dimCls[dim], className)}>
      {children}
    </Link>
  );
}

/* ----------------------------- Card ----------------------------- */
export function Card({
  className,
  hover,
  children,
}: {
  className?: string;
  hover?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={clsx("am-card", hover && "am-card-hover", className)}>{children}</div>
  );
}

/* ----------------------------- Campi ----------------------------- */
export function Field({
  label,
  hint,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && <label className="field-label">{label}</label>}
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx("field", props.className)} />;
}
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={clsx("field", props.className)} />;
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={clsx("field", props.className)} />;
}

/* ----------------------------- Intestazione pagina ----------------------------- */
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
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4 anim-fade-up">
      <div className="flex items-center gap-3.5">
        {icona && (
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-b from-brand-400 to-brand-500 text-white shadow-[var(--shadow-glow)]">
            {icona}
          </span>
        )}
        <div>
          <h1 className="text-2xl font-bold text-ink">{titolo}</h1>
          {sottotitolo && <p className="mt-0.5 text-sm text-muted">{sottotitolo}</p>}
        </div>
      </div>
      {azione && <div className="flex flex-wrap items-center gap-2">{azione}</div>}
    </div>
  );
}

/* ----------------------------- Stat card ----------------------------- */
type Tono = "positivo" | "negativo" | "neutro" | "brand";
const tonoTesto: Record<Tono, string> = {
  positivo: "text-success",
  negativo: "text-danger",
  neutro: "text-ink",
  brand: "text-brand-500",
};
const tonoChip: Record<Tono, string> = {
  positivo: "bg-success-soft text-success",
  negativo: "bg-danger-soft text-danger",
  neutro: "bg-[#eef1ea] text-muted",
  brand: "bg-brand-50 text-brand-500",
};

export function Stat({
  etichetta: label,
  valore,
  tono = "neutro",
  nota,
  icona,
}: {
  etichetta: string;
  valore: string;
  tono?: Tono;
  nota?: string;
  icona?: ReactNode;
}) {
  return (
    <Card hover className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</div>
        {icona && (
          <span className={clsx("grid h-8 w-8 place-items-center rounded-xl", tonoChip[tono])}>
            {icona}
          </span>
        )}
      </div>
      <div className={clsx("mt-2 text-[1.7rem] font-bold leading-none tracking-tight", tonoTesto[tono])}>
        {valore}
      </div>
      {nota && <div className="mt-1.5 text-xs text-muted">{nota}</div>}
    </Card>
  );
}

/* ----------------------------- Badge ----------------------------- */
export function Badge({
  tono = "muted",
  className,
  children,
}: {
  tono?: "success" | "warn" | "danger" | "info" | "muted" | "brand";
  className?: string;
  children: ReactNode;
}) {
  return <span className={clsx("badge", `badge-${tono}`, className)}>{children}</span>;
}

export function BadgePagamento({ stato }: { stato: StatoPagamento }) {
  const tono = stato === "pagato" ? "success" : stato === "in_ritardo" ? "danger" : "warn";
  return <Badge tono={tono}>{etichetta(stato)}</Badge>;
}

export function BadgeLavoro({ stato }: { stato: string }) {
  const tono = stato === "fatto" ? "success" : stato === "in_corso" ? "warn" : "muted";
  return <Badge tono={tono}>{etichetta(stato)}</Badge>;
}

/* ----------------------------- Varie ----------------------------- */
export function EmptyState({
  icona,
  titolo,
  testo,
  azione,
}: {
  icona?: ReactNode;
  titolo?: string;
  testo: string;
  azione?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center anim-fade">
      {icona && (
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-400">
          {icona}
        </span>
      )}
      {titolo && <div className="font-semibold text-ink">{titolo}</div>}
      <p className="max-w-sm text-sm text-muted">{testo}</p>
      {azione}
    </Card>
  );
}

export function CodiceCliente({ codice }: { codice: string }) {
  return <span className="codice">{codice}</span>;
}

export function LinkCliente({ id, nome }: { id: string; nome: string }) {
  return (
    <Link to={`/clienti/${id}`} className="link-brand">
      {nome}
    </Link>
  );
}

export function Soldi({ n, forte }: { n: number; forte?: boolean }) {
  return <span className={forte ? "font-semibold" : undefined}>{euro(n)}</span>;
}
