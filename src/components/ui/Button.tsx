import { forwardRef, useState, type ButtonHTMLAttributes, type PointerEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";

type Variant = "ottone" | "inchiostro" | "fantasma" | "tenue" | "critico";
type Size = "sm" | "md" | "lg" | "icona";

const base =
  "relative overflow-hidden inline-flex items-center justify-center gap-2 font-sans font-medium select-none " +
  "transition-transform active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/60";

// I nomi delle variant restano stabili (compat con le pagine); cambia solo lo stile.
const variants: Record<Variant, string> = {
  ottone: "bg-lime text-fondo shadow-flottante hover:bg-lime-scuro", // primary = lime
  inchiostro: "glass-alta text-bianco",
  fantasma: "text-bianco hover:bg-white/10",
  tenue: "glass-bassa text-bianco",
  critico: "bg-critico/15 text-critico hover:bg-critico/25",
};

const sizes: Record<Size, string> = {
  sm: "h-9 rounded-pill px-4 text-sm",
  md: "h-11 rounded-pill px-5 text-sm",
  lg: "h-14 rounded-pill px-7 text-base",
  icona: "h-11 w-11 rounded-pill",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "ottone", size = "md", type = "button", onPointerDown, children, ...props }, ref) => {
    const [ripples, setRipples] = useState<Ripple[]>([]);
    const scuro = variant === "ottone";

    const spawn = (e: PointerEvent<HTMLButtonElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      const id = e.timeStamp;
      setRipples((rs) => [...rs, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
      window.setTimeout(() => setRipples((rs) => rs.filter((x) => x.id !== id)), 550);
      onPointerDown?.(e);
    };

    return (
      <button
        ref={ref}
        type={type}
        onPointerDown={spawn}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        <AnimatePresence>
          {ripples.map((r) => (
            <motion.span
              key={r.id}
              initial={{ opacity: 0.5, scale: 0 }}
              animate={{ opacity: 0, scale: 4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className={cn("pointer-events-none absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full", scuro ? "bg-fondo/30" : "bg-white/40")}
              style={{ left: r.x, top: r.y }}
            />
          ))}
        </AnimatePresence>
        <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      </button>
    );
  },
);
Button.displayName = "Button";
