import { CalendarDays, Users, Wallet } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/cn";

// Solo i blocchi principali (canone 02 §4.2). Dashboard NON e' qui: si apre
// dal blocco riepilogo. "Crea record" e' il FAB globale nel Layout.
const items = [
  { to: "/", label: "Agenda", Icon: CalendarDays, end: true },
  { to: "/soldi", label: "Soldi", Icon: Wallet, end: false },
  { to: "/anagrafiche", label: "Anagrafiche", Icon: Users, end: false },
];

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-carta-ombra bg-carta-alta/92 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-md items-stretch">
        {items.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 transition-colors",
                isActive ? "text-ottone-scuro" : "text-inchiostro-debole",
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn("h-5 w-5", isActive ? "stroke-[2.4]" : "stroke-2")} />
                <span className="font-mono text-[0.65rem]">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
