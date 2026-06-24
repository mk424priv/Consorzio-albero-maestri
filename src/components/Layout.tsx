import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { oggiISO } from "@/lib/format";
import { BottomNav } from "./BottomNav";
import { World } from "./world/World";

const TAB_PRINCIPALI = ["/", "/soldi", "/anagrafiche", "/dashboard"];

/** Guscio dell'app: 4 registri (World + contenuto + FAB + nav) + toast. */
export function Layout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const mostraFab = TAB_PRINCIPALI.includes(pathname);
  const creazione = pathname === "/nuovo";

  return (
    <div className="min-h-dvh">
      <World />
      <main className={`relative mx-auto min-h-dvh max-w-md ${creazione ? "pb-0" : "pb-28"}`}>
        <Outlet />
      </main>

      {mostraFab && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40">
          <div className="mx-auto flex max-w-md justify-end px-4">
            <motion.button
              layoutId="fab-crea"
              type="button"
              onClick={() => navigate("/nuovo", { state: { data: oggiISO() } })}
              aria-label="Crea record"
              className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-pill bg-scuro text-white shadow-flottante transition-transform active:scale-95"
            >
              <Plus className="h-6 w-6" strokeWidth={2.5} />
            </motion.button>
          </div>
        </div>
      )}

      {!creazione && <BottomNav />}
      <Toaster
        position="top-center"
        theme="dark"
        toastOptions={{
          style: {
            background: "#1c1c1c",
            border: "1px solid #2a2a2a",
            color: "#fff",
            borderRadius: "16px",
          },
        }}
      />
    </div>
  );
}
