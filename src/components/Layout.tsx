import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  Fuel,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  Sprout,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import { useStore } from "@/store/store";
import { useToast } from "@/store/toast";

const VOCI = [
  { to: "/", label: "Cruscotto", Icona: LayoutDashboard, end: true },
  { to: "/calendario", label: "Calendario", Icona: CalendarDays },
  { to: "/clienti", label: "Clienti", Icona: Sprout },
  { to: "/preventivi", label: "Preventivi", Icona: ReceiptText },
  { to: "/ore", label: "Ore", Icona: Clock },
  { to: "/pagamenti", label: "Pagamenti", Icona: Wallet },
  { to: "/storico", label: "Storico", Icona: History },
  { to: "/officina", label: "Officina", Icona: Wrench },
  { to: "/spese", label: "Spese", Icona: Fuel },
];

function Logo() {
  return (
    <div className="flex items-center gap-3 px-2">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-b from-brand-400 to-brand-500 text-xl shadow-[var(--shadow-glow)]">
        🌳
      </span>
      <div className="leading-tight">
        <div className="font-bold text-ink">Albero Maestri</div>
        <div className="text-xs text-muted">Centro di Comando</div>
      </div>
    </div>
  );
}

function Menù({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {VOCI.map(({ to, label, Icona, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              isActive
                ? "bg-brand-50 text-brand-600"
                : "text-ink-soft hover:bg-brand-50/60 hover:text-brand-600",
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={clsx(
                  "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-500 transition-all",
                  isActive ? "opacity-100" : "opacity-0",
                )}
              />
              <Icona size={18} className={clsx(isActive ? "text-brand-500" : "text-muted group-hover:text-brand-500")} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export function Layout() {
  const [drawer, setDrawer] = useState(false);
  const logout = useStore((s) => s.logout);
  const mostra = useToast((s) => s.mostra);
  const navigate = useNavigate();
  const location = useLocation();

  function esci() {
    logout();
    mostra("Sei uscito. A presto!", "info");
    navigate("/login");
  }

  // chiave per rianimare il contenuto a ogni cambio pagina
  const sezione = location.pathname.split("/")[1] || "home";

  return (
    <div className="flex min-h-screen">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-surface/80 p-4 backdrop-blur md:flex">
        <div className="mb-7 mt-1">
          <Logo />
        </div>
        <Menù />
        <button
          onClick={esci}
          className="btn btn-ghost mt-auto justify-start gap-3 px-3 text-ink-soft"
        >
          <LogOut size={18} className="text-muted" />
          Esci
        </button>
      </aside>

      {/* Drawer mobile */}
      {drawer && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="anim-fade absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={() => setDrawer(false)} />
          <aside className="anim-slide-in absolute left-0 top-0 flex h-full w-72 flex-col border-r border-line bg-surface p-4">
            <div className="mb-6 mt-1 flex items-center justify-between">
              <Logo />
              <button onClick={() => setDrawer(false)} className="rounded-xl p-2 text-muted hover:bg-canvas" aria-label="Chiudi">
                <X size={18} />
              </button>
            </div>
            <Menù onNavigate={() => setDrawer(false)} />
            <button onClick={esci} className="btn btn-ghost mt-auto justify-start gap-3 px-3 text-ink-soft">
              <LogOut size={18} className="text-muted" />
              Esci
            </button>
          </aside>
        </div>
      )}

      {/* Contenuto */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-surface/85 px-4 py-3 backdrop-blur md:hidden">
          <button onClick={() => setDrawer(true)} className="rounded-xl p-2 text-ink hover:bg-canvas" aria-label="Menu">
            <Menu size={20} />
          </button>
          <span className="text-lg">🌳</span>
          <span className="font-bold">Albero Maestri</span>
        </header>

        <main key={sezione} className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
