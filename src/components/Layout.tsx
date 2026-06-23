import { Plus } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";
import { BottomNav } from "./BottomNav";

/** Guscio dell'app: contenuto scrollabile + FAB globale + navigazione inferiore. */
export function Layout() {
  const navigate = useNavigate();
  return (
    <div className="grana min-h-dvh">
      <main className="mx-auto min-h-dvh max-w-md px-4 pb-28 pt-5">
        <Outlet />
      </main>

      {/* FAB globale "crea record", allineato al bordo del contenuto */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40">
        <div className="mx-auto flex max-w-md justify-end px-4">
          <button
            type="button"
            onClick={() => navigate("/nuovo")}
            aria-label="Crea record"
            className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-ottone text-carta-alta shadow-targhetta transition-transform active:translate-y-px"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
