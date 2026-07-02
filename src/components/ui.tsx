import { clsx } from "clsx";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { motion } from "framer-motion";

/* Primitivi UI di NEXUS: vetro + neon, tutti sui token @theme. */

export function Pannello({
  children,
  className,
  strong,
}: {
  children: ReactNode;
  className?: string;
  strong?: boolean;
}) {
  return (
    <div className={clsx(strong ? "glass-strong" : "glass", "rounded-2xl", className)}>
      {children}
    </div>
  );
}

export function PannelloAnimato({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={clsx("glass rounded-2xl", className)}
    >
      {children}
    </motion.div>
  );
}

type VarianteBtn = "neon" | "ghost" | "danger";

export function Btn({
  variante = "ghost",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: VarianteBtn }) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium tracking-wide transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40",
        variante === "neon" &&
          "bg-neon/10 text-neon glow-ring hover:bg-neon/20",
        variante === "ghost" &&
          "border border-ice/10 bg-ice/5 text-ice hover:border-ice/25 hover:bg-ice/10",
        variante === "danger" &&
          "border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20",
        className,
      )}
    />
  );
}

export function Campo({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs tracking-widest text-ghost uppercase">{label}</span>}
      <input
        {...props}
        className={clsx(
          "w-full rounded-lg border border-ice/10 bg-void/60 px-3 py-2.5 text-sm text-ice outline-none transition-colors placeholder:text-faint focus:border-neon/50 focus:shadow-[0_0_14px_-6px_var(--color-neon)]",
          className,
        )}
      />
    </label>
  );
}

export function AreaTesto({
  label,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs tracking-widest text-ghost uppercase">{label}</span>}
      <textarea
        {...props}
        className={clsx(
          "w-full resize-none rounded-lg border border-ice/10 bg-void/60 px-3 py-2.5 text-sm text-ice outline-none transition-colors placeholder:text-faint focus:border-neon/50",
          className,
        )}
      />
    </label>
  );
}

export function Chip({
  attivo,
  children,
  onClick,
  className,
}: {
  attivo?: boolean;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "cursor-pointer rounded-lg border px-3 py-1.5 text-xs tracking-wide transition-all duration-200",
        attivo
          ? "border-neon/60 bg-neon/10 text-neon glow-ring"
          : "border-ice/10 bg-ice/5 text-ghost hover:border-ice/25 hover:text-ice",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Etichetta({ children, colore }: { children: ReactNode; colore?: string }) {
  return (
    <span
      className="rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.15em]"
      style={{
        color: colore ?? "var(--color-ghost)",
        borderColor: "color-mix(in srgb, currentColor 35%, transparent)",
        background: "color-mix(in srgb, currentColor 8%, transparent)",
      }}
    >
      {children}
    </span>
  );
}

export function TitoloSezione({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold tracking-tight text-ice">
        <span className="text-neon glow">§</span> {children}
      </h2>
      {sub && <p className="mt-0.5 text-xs text-ghost">{sub}</p>}
    </div>
  );
}

export function Vuoto({ icona, titolo, sub }: { icona: string; titolo: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-14 text-center">
      <div className="text-3xl opacity-60">{icona}</div>
      <div className="text-sm text-ghost">{titolo}</div>
      {sub && <div className="text-xs text-faint">{sub}</div>}
    </div>
  );
}
