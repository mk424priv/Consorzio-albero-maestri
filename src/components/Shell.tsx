import { NavLink, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { clsx } from "clsx";
import {
  Boxes,
  FolderKanban,
  LayoutDashboard,
  Plug,
  Plus,
} from "lucide-react";
import { MatrixRain } from "./MatrixRain";

const VOCI = [
  { to: "/", label: "CONTROLLO", icona: LayoutDashboard, end: true },
  { to: "/progetti", label: "PROGETTI", icona: FolderKanban },
  { to: "/crea", label: "CREA", icona: Plus },
  { to: "/bozze", label: "BOZZE 3D", icona: Boxes },
  { to: "/integrazioni", label: "MODULI", icona: Plug },
];

function Orologio() {
  return (
    <div className="hidden text-right text-[10px] leading-tight text-ghost sm:block">
      <div className="text-neon animate-pulse-neon">● ONLINE</div>
      <div>LOCAL-FIRST / IndexedDB</div>
    </div>
  );
}

/** Guscio "centro di controllo": HUD in alto, nav vetro, pioggia Matrix sotto. */
export function Shell() {
  const location = useLocation();

  return (
    <div className="min-h-dvh scanlines">
      <MatrixRain />

      {/* HUD superiore */}
      <header className="glass-strong sticky top-0 z-40 border-x-0 border-t-0">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-3">
            <img src="/nexus.svg" alt="" className="size-8 animate-flicker" />
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-[0.3em] text-ice">
                NEXUS<span className="text-neon glow">_</span>
              </div>
              <div className="text-[10px] tracking-widest text-ghost">
                CENTRO DI CONTROLLO PROGETTI
              </div>
            </div>
          </NavLink>
          <Orologio />
        </div>

        {/* nav */}
        <nav className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 pb-2">
          {VOCI.map(({ to, label, icona: Icona, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs tracking-widest transition-all duration-200",
                  isActive
                    ? "bg-neon/10 text-neon glow-ring"
                    : "text-ghost hover:bg-ice/5 hover:text-ice",
                )
              }
            >
              <Icona className="size-3.5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* contenuto con transizione di pagina */}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="mx-auto max-w-6xl px-4 py-6 pb-24"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
