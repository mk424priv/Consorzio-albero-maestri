import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "ottone" | "inchiostro" | "fantasma" | "tenue" | "critico";
type Size = "sm" | "md" | "lg" | "icona";

const base =
  "inline-flex items-center justify-center gap-2 font-sans font-medium select-none " +
  "transition-[background-color,transform] active:translate-y-px " +
  "disabled:opacity-50 disabled:pointer-events-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ottone/50 focus-visible:ring-offset-1 focus-visible:ring-offset-carta";

const variants: Record<Variant, string> = {
  ottone: "bg-ottone text-carta-alta shadow-carta hover:bg-ottone-scuro",
  inchiostro: "bg-inchiostro text-carta-alta shadow-carta hover:bg-inchiostro-medio",
  fantasma: "bg-transparent text-inchiostro hover:bg-carta-bassa",
  tenue: "bg-carta-bassa text-inchiostro-medio hover:bg-carta-ombra",
  critico: "bg-critico/12 text-critico hover:bg-critico/20",
};

const sizes: Record<Size, string> = {
  sm: "h-9 rounded-targhetta px-3 text-sm",
  md: "h-11 rounded-targhetta px-4 text-sm",
  lg: "h-14 rounded-carta px-6 text-base",
  icona: "h-11 w-11 rounded-targhetta",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "ottone", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
