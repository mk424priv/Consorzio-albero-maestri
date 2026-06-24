import { motion } from "framer-motion";
import { CalendarDays, Users, Wallet } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/cn";

// Tab-bar di vetro flottante (Revolut). Solo i blocchi principali.
const items = [
  { to: "/", label: "Agenda", Icon: CalendarDays, end: true },
  { to: "/soldi", label: "Soldi", Icon: Wallet, end: false },
  { to: "/anagrafiche", label: "Rubrica", Icon: Users, end: false },
];

export function BottomNav() {
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center pb-[calc(0.7rem+env(safe-area-inset-bottom))]">
      <div className="glass-alta pointer-events-auto flex items-center gap-1 rounded-pill p-1.5">
        {items.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end}>
            {({ isActive }) => (
              <span
                className={cn(
                  "relative z-0 flex items-center gap-1.5 rounded-pill px-4 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "text-fondo" : "text-fumo",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="navpill"
                    className="absolute inset-0 -z-10 rounded-pill bg-lime"
                    transition={{ type: "spring", stiffness: 340, damping: 32 }}
                  />
                )}
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} />
                {isActive && <span>{label}</span>}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
