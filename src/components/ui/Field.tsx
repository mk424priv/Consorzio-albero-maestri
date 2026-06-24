import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  suffix?: ReactNode;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, hint, suffix, className, id, ...props }, ref) => {
    const auto = useId();
    const fieldId = id ?? auto;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={fieldId} className="font-mono text-xs uppercase tracking-wider text-fumo-2">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <input
            ref={ref}
            id={fieldId}
            className={cn(
              "glass-bassa h-12 w-full rounded-pill px-4 font-sans text-bianco",
              "placeholder:text-fumo-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/60",
              suffix ? "pr-12" : "",
              className,
            )}
            {...props}
          />
          {suffix && <span className="absolute right-4 font-mono text-sm text-fumo">{suffix}</span>}
        </div>
        {hint && <span className="text-xs text-fumo-2">{hint}</span>}
      </div>
    );
  },
);
Field.displayName = "Field";
