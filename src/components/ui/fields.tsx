import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export const fieldCls =
  "w-full rounded-[11px] border border-line-strong bg-surface px-3 text-[0.85rem] text-ink transition-colors placeholder:text-muted/80 hover:border-brand-300 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100";

export function Field({
  label,
  hint,
  errore,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  errore?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && <label className="mb-1 block text-[0.74rem] font-semibold text-ink-soft">{label}</label>}
      {children}
      {errore ? (
        <p className="mt-1 text-[0.74rem] font-medium text-danger">{errore}</p>
      ) : (
        hint && <p className="mt-1 text-[0.72rem] text-muted">{hint}</p>
      )}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldCls, "h-10", props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(fieldCls, "py-2 leading-relaxed", props.className)} />;
}

/* ----------------------- Select custom (Radix) ----------------------- */
export interface OpzioneSelect {
  value: string;
  label: string;
  icona?: ReactNode;
}

const NONE = "∅"; // sentinella per il valore vuoto

export function Select({
  value,
  onChange,
  options,
  placeholder = "— scegli —",
  className,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: OpzioneSelect[];
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const hasEmpty = options.some((o) => o.value === "");
  const rootValue = value === "" ? (hasEmpty ? NONE : undefined) : value;

  return (
    <SelectPrimitive.Root value={rootValue} onValueChange={(v) => onChange(v === NONE ? "" : v)}>
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        className={cn(
          fieldCls,
          "inline-flex h-10 items-center justify-between gap-2 data-[placeholder]:text-muted",
          className,
        )}
      >
        <span className="truncate"><SelectPrimitive.Value placeholder={placeholder} /></span>
        <SelectPrimitive.Icon className="shrink-0 text-muted transition-transform data-[state=open]:rotate-180">
          <ChevronDown size={16} />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-[90] max-h-[18rem] min-w-[var(--radix-select-trigger-width)] origin-[var(--radix-select-content-transform-origin)] overflow-hidden rounded-[14px] border border-line bg-surface shadow-[var(--shadow-lg)] data-[state=open]:animate-[am-scale-in_0.16s_ease]"
        >
          <SelectPrimitive.Viewport className="p-1.5">
            {options.map((o) => (
              <SelectPrimitive.Item
                key={o.value || NONE}
                value={o.value === "" ? NONE : o.value}
                className="relative flex cursor-pointer select-none items-center gap-2 rounded-[9px] py-2 pl-2.5 pr-8 text-[0.85rem] font-medium text-ink-soft outline-none transition-colors data-[highlighted]:bg-brand-50 data-[highlighted]:text-brand-600 data-[state=checked]:font-semibold data-[state=checked]:text-brand-600"
              >
                {o.icona && <span className="shrink-0">{o.icona}</span>}
                <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-2.5 inline-flex">
                  <Check size={15} />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export function Switch({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5">
      <SwitchPrimitive.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="relative h-6 w-11 shrink-0 rounded-full bg-line-strong transition-colors data-[state=checked]:bg-brand-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
      >
        <SwitchPrimitive.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-[1.375rem]" />
      </SwitchPrimitive.Root>
      {label && <span className="text-sm font-medium text-ink-soft">{label}</span>}
    </label>
  );
}
