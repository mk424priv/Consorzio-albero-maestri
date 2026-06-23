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
          <label
            htmlFor={fieldId}
            className="font-mono text-xs uppercase tracking-wider text-inchiostro-debole"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <input
            ref={ref}
            id={fieldId}
            className={cn(
              "h-11 w-full rounded-targhetta border border-carta-ombra bg-carta-alta px-3 font-sans text-inchiostro",
              "placeholder:text-inchiostro-debole/70",
              "focus-visible:border-ottone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ottone/30",
              suffix ? "pr-10" : "",
              className,
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 font-mono text-sm text-inchiostro-debole">
              {suffix}
            </span>
          )}
        </div>
        {hint && <span className="text-xs text-inchiostro-debole">{hint}</span>}
      </div>
    );
  },
);
Field.displayName = "Field";
