import type { ReactNode } from "react";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/cn";

export interface VoceMenu {
  label: string;
  icona?: ReactNode;
  onClick: () => void;
  pericolo?: boolean;
  separa?: boolean; // separatore prima di questa voce
}

export function Menu({
  trigger,
  voci,
  align = "end",
}: {
  trigger: ReactNode;
  voci: VoceMenu[];
  align?: "start" | "center" | "end";
}) {
  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>{trigger}</Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          align={align}
          sideOffset={6}
          className="z-[60] min-w-[11rem] origin-[var(--radix-dropdown-menu-content-transform-origin)] overflow-hidden rounded-[14px] border border-line bg-surface p-1.5 shadow-[var(--shadow-lg)] data-[state=open]:animate-[am-scale-in_0.16s_ease]"
        >
          {voci.map((v, i) => (
            <div key={i}>
              {v.separa && <div className="my-1 h-px bg-line" />}
              <Dropdown.Item
                onSelect={(e) => {
                  e.preventDefault();
                  v.onClick();
                }}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-sm font-medium outline-none transition-colors",
                  v.pericolo
                    ? "text-danger data-[highlighted]:bg-danger-soft"
                    : "text-ink-soft data-[highlighted]:bg-brand-50 data-[highlighted]:text-brand-600",
                )}
              >
                {v.icona && <span className="shrink-0">{v.icona}</span>}
                {v.label}
              </Dropdown.Item>
            </div>
          ))}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
