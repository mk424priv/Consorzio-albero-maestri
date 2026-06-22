import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// Tabella stile Notion: header sticky tenue, righe con hover, scroll orizz.
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-sm)]", className)}>
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({ className, children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...props}
      className={cn(
        "border-b border-line bg-surface-2 px-3.5 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-[0.05em] text-muted first:rounded-tl-[var(--radius-lg)] last:rounded-tr-[var(--radius-lg)]",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ className, children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td {...props} className={cn("border-b border-line px-3.5 py-3 align-middle", className)}>
      {children}
    </td>
  );
}

export function Tr({
  className,
  children,
  onClick,
}: {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "group transition-colors last:[&>td]:border-b-0 hover:bg-brand-50/50",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {children}
    </tr>
  );
}
