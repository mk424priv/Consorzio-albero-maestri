// Mattoni di input "gamificati": selezione a tessere, scelta a chip con
// avatar, stepper, importo grande, date rapide. Interazioni STABILI
// (niente scale al tocco): solo colore/ombra/translate.
import type { ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar } from "./primitives";

const numVal = (s: string): number => {
  const n = Number(String(s).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

// classi "selezionato" per tinta entità (stringhe letterali → Tailwind le genera)
export type Tinta =
  | "cliente" | "operatore" | "lavoro" | "preventivo"
  | "entrata" | "uscita" | "spesa" | "patrimonio" | "brand";

const SEL: Record<Tinta, string> = {
  cliente: "border-cliente-300 bg-cliente-50 text-cliente-700 ring-2 ring-cliente-100",
  operatore: "border-operatore-300 bg-operatore-50 text-operatore-700 ring-2 ring-operatore-100",
  lavoro: "border-lavoro-300 bg-lavoro-50 text-lavoro-700 ring-2 ring-lavoro-100",
  preventivo: "border-preventivo-300 bg-preventivo-50 text-preventivo-700 ring-2 ring-preventivo-100",
  entrata: "border-entrata-300 bg-entrata-50 text-entrata-700 ring-2 ring-entrata-100",
  uscita: "border-uscita-300 bg-uscita-50 text-uscita-700 ring-2 ring-uscita-100",
  spesa: "border-spesa-300 bg-spesa-50 text-spesa-700 ring-2 ring-spesa-100",
  patrimonio: "border-patrimonio-300 bg-patrimonio-50 text-patrimonio-700 ring-2 ring-patrimonio-100",
  brand: "border-brand-300 bg-brand-50 text-brand-600 ring-2 ring-brand-100",
};
const GRAD: Record<Tinta, string> = {
  cliente: "bg-gradient-to-br from-cliente-500 to-brand-700",
  operatore: "bg-gradient-to-br from-operatore-500 to-operatore-700",
  lavoro: "bg-gradient-to-br from-lavoro-500 to-lavoro-700",
  preventivo: "bg-gradient-to-br from-preventivo-500 to-preventivo-700",
  entrata: "bg-gradient-to-br from-entrata-500 to-entrata-700",
  uscita: "bg-gradient-to-br from-uscita-500 to-uscita-700",
  spesa: "bg-gradient-to-br from-spesa-500 to-spesa-700",
  patrimonio: "bg-gradient-to-br from-patrimonio-500 to-patrimonio-700",
  brand: "bg-gradient-to-br from-brand-400 to-brand-600",
};

/* ----------------------------- TileSelect ----------------------------- */
export interface Tile {
  value: string;
  label: string;
  icona?: ReactNode;
  hint?: string;
}
export function TileSelect({
  value,
  onChange,
  options,
  tinta = "brand",
  cols = 2,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Tile[];
  tinta?: Tinta;
  cols?: 2 | 3 | 4;
}) {
  const grid = cols === 4 ? "grid-cols-4" : cols === 3 ? "grid-cols-3" : "grid-cols-2";
  return (
    <div className={cn("grid gap-2", grid)}>
      {options.map((o) => {
        const sel = o.value === value;
        return (
          <button
            type="button"
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 rounded-[14px] border px-2 py-3 text-center transition-colors duration-150",
              sel ? SEL[tinta] : "border-line bg-surface text-ink-soft hover:border-line-strong hover:bg-surface-2",
            )}
          >
            {o.icona && <span className={cn("transition-colors", sel ? "" : "text-muted")}>{o.icona}</span>}
            <span className="text-[0.8rem] font-bold leading-tight">{o.label}</span>
            {o.hint && <span className="text-[0.66rem] font-medium opacity-70">{o.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ----------------------------- ChipPicker ----------------------------- */
export interface ItemChip {
  id: string;
  nome: string;
}
export function ChipPicker({
  items,
  value,
  onChange,
  tinta = "brand",
  vuoto = "Niente da scegliere.",
  consentiNessuno,
}: {
  items: ItemChip[];
  value: string;
  onChange: (id: string) => void;
  tinta?: Tinta;
  vuoto?: string;
  consentiNessuno?: boolean;
}) {
  if (items.length === 0) return <p className="text-[0.8rem] text-muted">{vuoto}</p>;
  return (
    <div className="-mx-1 flex max-h-44 flex-wrap gap-2 overflow-y-auto px-1 py-0.5">
      {items.map((it) => {
        const sel = it.id === value;
        return (
          <button
            type="button"
            key={it.id}
            onClick={() => onChange(consentiNessuno && sel ? "" : it.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 transition-colors duration-150",
              sel ? SEL[tinta] : "border-line bg-surface text-ink-soft hover:border-line-strong",
            )}
          >
            <Avatar nome={it.nome} size="sm" grad={GRAD[tinta]} className="!h-6 !w-6 !text-[0.55rem]" />
            <span className="text-[0.8rem] font-semibold">{it.nome}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------- Stepper ------------------------------ */
export function Stepper({
  value,
  onChange,
  step = 0.5,
  unit = "h",
  presets = [1, 2, 4, 8],
  tinta = "operatore",
}: {
  value: string;
  onChange: (v: string) => void;
  step?: number;
  unit?: string;
  presets?: number[];
  tinta?: Tinta;
}) {
  const n = numVal(value);
  const fmt = (x: number) => (Number.isInteger(x) ? String(x) : String(x));
  const round = "grid h-12 w-12 place-items-center rounded-full border border-line-strong bg-surface text-ink transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 active:translate-y-px disabled:opacity-40";
  return (
    <div>
      <div className="flex items-center justify-center gap-5">
        <button type="button" aria-label="Meno" className={round} disabled={n <= 0} onClick={() => onChange(fmt(Math.max(0, Math.round((n - step) * 2) / 2)))}>
          <Minus size={20} />
        </button>
        <div className="min-w-[5.5rem] text-center">
          <div className="text-[2.6rem] font-extrabold leading-none tracking-tight text-ink tabular-nums">{fmt(n)}</div>
          <div className="mt-0.5 text-[0.72rem] font-bold uppercase tracking-wider text-muted">{unit === "h" ? "ore" : unit}</div>
        </div>
        <button type="button" aria-label="Più" className={round} onClick={() => onChange(fmt(Math.round((n + step) * 2) / 2))}>
          <Plus size={20} />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {presets.map((p) => {
          const sel = n === p;
          return (
            <button
              type="button"
              key={p}
              onClick={() => onChange(fmt(p))}
              className={cn(
                "rounded-full border px-3 py-1 text-[0.78rem] font-bold transition-colors",
                sel ? SEL[tinta] : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink",
              )}
            >
              {p}{unit}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------------- AmountField ---------------------------- */
export function AmountField({
  value,
  onChange,
  suggerimenti = [],
  tinta = "entrata",
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  suggerimenti?: { label: string; valore: number }[];
  tinta?: Tinta;
  autoFocus?: boolean;
}) {
  const attivo = numVal(value);
  return (
    <div>
      <div className="flex items-center justify-center gap-1.5 rounded-[18px] border border-line-strong bg-surface-2 py-5">
        <span className="text-2xl font-bold text-muted">€</span>
        <input
          inputMode="decimal"
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className="w-40 bg-transparent text-center text-[2.4rem] font-extrabold tracking-tight text-ink outline-none placeholder:text-line-strong"
        />
      </div>
      {suggerimenti.length > 0 && (
        <div className="mt-2.5 flex flex-wrap justify-center gap-2">
          {suggerimenti.map((s) => {
            const sel = attivo === s.valore && value !== "";
            return (
              <button
                type="button"
                key={s.label}
                onClick={() => onChange(String(s.valore))}
                className={cn(
                  "rounded-full border px-3 py-1 text-[0.78rem] font-bold transition-colors",
                  sel ? SEL[tinta] : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink",
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ QuickDate ----------------------------- */
const isoOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export function QuickDate({
  value,
  onChange,
  tinta = "brand",
}: {
  value: string;
  onChange: (v: string) => void;
  tinta?: Tinta;
}) {
  const oggi = isoOf(new Date());
  const domani = isoOf(new Date(Date.now() + 86_400_000));
  const chip = (label: string, v: string) => {
    const sel = value === v;
    return (
      <button
        type="button"
        onClick={() => onChange(v)}
        className={cn(
          "rounded-full border px-3 py-1.5 text-[0.78rem] font-bold transition-colors",
          sel ? SEL[tinta] : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink",
        )}
      >
        {label}
      </button>
    );
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chip("Oggi", oggi)}
      {chip("Domani", domani)}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-full border border-line-strong bg-surface px-3 text-[0.8rem] text-ink outline-none transition-colors hover:border-brand-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
      />
    </div>
  );
}
