import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CalendarDays,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Sprout,
  Trash2,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { tap } from "@/lib/motion";
import { useStore } from "@/store/store";
import { useUI } from "@/store/ui";
import { useToast } from "@/store/toast";
import { Menu } from "@/components/ui";
import { SheetHost } from "@/components/sheets";
import { ConfirmHost } from "@/components/ui";

interface Voce {
  to: string;
  label: string;
  Icona: LucideIcon;
  end?: boolean;
}
const NAV: Voce[] = [
  { to: "/", label: "Spazio", Icona: Sprout, end: true },
  { to: "/agenda", label: "Agenda", Icona: CalendarDays },
  { to: "/soldi", label: "Soldi", Icona: Wallet },
  { to: "/squadra", label: "Squadra", Icona: Users },
];

function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-[12px] bg-gradient-to-br from-brand-400 to-brand-600 text-lg shadow-[var(--shadow-glow)]">🌳</span>
      {!compact && (
        <div className="leading-tight">
          <div className="text-[0.95rem] font-extrabold text-ink">Albero Maestri</div>
          <div className="text-[0.7rem] text-muted">Spazio di lavoro</div>
        </div>
      )}
    </div>
  );
}

function ProfiloMenu() {
  const { reseed, svuota, logout } = useStore();
  const chiediConferma = useUI((s) => s.chiediConferma);
  const mostra = useToast((s) => s.mostra);
  const navigate = useNavigate();
  return (
    <Menu
      trigger={
        <button className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-operatore-500 to-operatore-600 text-xs font-bold text-white shadow-sm" aria-label="Profilo">
          M
        </button>
      }
      voci={[
        { label: "Ricarica esempi", icona: <RefreshCw size={16} />, onClick: () => { reseed(); mostra("Dati d'esempio ricaricati."); } },
        { label: "Svuota tutto", icona: <Trash2 size={16} />, pericolo: true, onClick: () => chiediConferma({ titolo: "Svuotare tutti i dati?", descrizione: "Restano solo gli operatori. Non si può annullare.", pericolo: true, testoConferma: "Svuota", onConfirm: () => { svuota(); mostra("Tutto svuotato.", "info"); } }) },
        { label: "Esci", icona: <LogOut size={16} />, separa: true, onClick: () => { logout(); navigate("/login"); } },
      ]}
    />
  );
}

function RicercaInput() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [val, setVal] = useState(params.get("q") ?? "");
  return (
    <div className="relative w-full max-w-md">
      <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
      <input
        value={val}
        onChange={(e) => {
          const q = e.target.value;
          setVal(q);
          if (location.pathname !== "/") {
            navigate(q ? `/?q=${encodeURIComponent(q)}` : "/");
          } else {
            if (q) params.set("q", q); else params.delete("q");
            setParams(params, { replace: true });
          }
        }}
        placeholder="Cerca un cliente…"
        className="h-10 w-full rounded-full border border-line bg-surface-2 pl-10 pr-3 text-sm text-ink transition placeholder:text-muted/80 focus:border-brand-300 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-brand-100"
      />
    </div>
  );
}

function SideRail() {
  const apri = useUI((s) => s.apri);
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface/70 p-4 backdrop-blur lg:flex">
      <div className="mb-6 mt-1 px-1"><Logo /></div>
      <button onClick={() => apri("crea")} className="mb-5 inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-gradient-to-b from-brand-400 to-brand-500 px-4 text-sm font-bold text-white shadow-[var(--shadow-glow)] transition hover:to-brand-600">
        <Plus size={18} /> Crea
      </button>
      <nav className="flex flex-col gap-1">
        {NAV.map(({ to, label, Icona, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => cn("group relative flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-semibold transition-colors", isActive ? "bg-brand-50 text-brand-600" : "text-ink-soft hover:bg-brand-50/60 hover:text-brand-600")}>
            {({ isActive }) => (
              <>
                <span className={cn("absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-500 transition-opacity", isActive ? "opacity-100" : "opacity-0")} />
                <Icona size={19} className={isActive ? "text-brand-500" : "text-muted group-hover:text-brand-500"} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto flex items-center justify-between rounded-[14px] border border-line bg-surface-2 p-2.5">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-operatore-500 to-operatore-600 text-xs font-bold text-white">M</span>
          <div className="leading-tight">
            <div className="text-[0.8rem] font-bold text-ink">Marco</div>
            <div className="text-[0.68rem] text-muted">Titolare</div>
          </div>
        </div>
        <ProfiloMenu />
      </div>
    </aside>
  );
}

function BottomNav() {
  const apri = useUI((s) => s.apri);
  const sinistra = NAV.slice(0, 2);
  const destra = NAV.slice(2);
  const item = (v: Voce) => (
    <NavLink key={v.to} to={v.to} end={v.end} className={({ isActive }) => cn("flex flex-1 flex-col items-center gap-0.5 py-1 text-[0.66rem] font-semibold transition-colors", isActive ? "text-brand-600" : "text-muted")}>
      {({ isActive }) => (
        <>
          <span className={cn("grid h-9 w-12 place-items-center rounded-full transition-colors", isActive && "bg-brand-50")}>
            <v.Icona size={20} className={isActive ? "text-brand-500" : "text-muted"} />
          </span>
          {v.label}
        </>
      )}
    </NavLink>
  );
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-safe-nav items-start justify-around border-t border-line bg-surface/90 px-2 pt-1.5 backdrop-blur lg:hidden">
      {sinistra.map(item)}
      <div className="flex flex-1 justify-center">
        <motion.button whileTap={tap} onClick={() => apri("crea")} aria-label="Crea" className="-mt-5 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-b from-brand-400 to-brand-500 text-white shadow-[var(--shadow-glow)] ring-4 ring-canvas">
          <Plus size={26} />
        </motion.button>
      </div>
      {destra.map(item)}
    </nav>
  );
}

function AppBar() {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-surface/80 px-4 py-2.5 backdrop-blur pt-safe">
      <div className="lg:hidden"><Logo compact /></div>
      <div className="flex flex-1 justify-center lg:justify-start"><RicercaInput /></div>
      <div className="lg:hidden"><ProfiloMenu /></div>
    </header>
  );
}

export function AppShell() {
  const location = useLocation();
  const sezione = location.pathname.split("/")[1] || "home";
  return (
    <div className="flex min-h-dvh">
      <SideRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppBar />
        <motion.main
          key={sezione}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="mx-auto w-full max-w-6xl flex-1 px-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] pt-4 lg:px-8 lg:pb-10"
        >
          <Outlet />
        </motion.main>
      </div>
      <BottomNav />
      <SheetHost />
      <ConfirmHost />
    </div>
  );
}
