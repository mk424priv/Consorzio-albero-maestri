import { motion } from "framer-motion";
import { CalendarDays, LayoutDashboard, Users, Wallet, Warehouse } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/cn";

// Tab-bar flottante (neo-banking): icona-only inattivo, icona+label attivo (lime).
const items = [
  { to: "/", label: "Agenda", Icon: CalendarDays, end: true },
  { to: "/soldi", label: "Soldi", Icon: Wallet, end: false },
  { to: "/garage", label: "Garage", Icon: Warehouse, end: false },
  { to: "/dashboard", label: "Dati", Icon: LayoutDashboard, end: false },
  { to: "/anagrafiche", label: "Rubrica", Icon: Users, end: false },
];

export function BottomNav() {
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center pb-[calc(0.7rem+env(safe-area-inset-bottom))]">
      <div className="glass-alta pointer-events-auto flex items-center gap-1 rounded-pill p-1.5 shadow-flottante">
        {items.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end} aria-label={label}>
            {({ isActive }) => (
              <span
                className={cn(
                  "relative z-0 flex items-center gap-1.5 rounded-pill px-3.5 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "text-bianco" : "text-fumo-2",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="navpill"
                    className="absolute inset-0 -z-10 rounded-pill bg-superficie-3"
                    transition={{ type: "spring", stiffness: 340, damping: 32 }}
                  />
                )}
                <Icon className={cn("h-5 w-5", isActive && "text-lime")} strokeWidth={isActive ? 2.4 : 2} />
                {isActive && <span>{label}</span>}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
