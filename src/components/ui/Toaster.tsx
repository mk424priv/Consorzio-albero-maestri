import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { useToast } from "@/store/toast";

const ICONE = {
  success: <CheckCircle2 size={18} />,
  error: <XCircle size={18} />,
  info: <Info size={18} />,
};
const COLORI = { success: "text-success", error: "text-danger", info: "text-info" };

export function Toaster() {
  const { toasts, chiudi } = useToast();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-5 sm:right-5 sm:items-end sm:px-0">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 480, damping: 34 }}
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-[16px] border border-line bg-surface p-3.5 pr-3 shadow-[var(--shadow-lg)]"
          >
            <span className={cn("shrink-0", COLORI[t.tipo])}>{ICONE[t.tipo]}</span>
            <p className="flex-1 text-sm font-medium text-ink">{t.testo}</p>
            <button
              onClick={() => chiudi(t.id)}
              className="shrink-0 rounded-lg p-1 text-muted transition hover:bg-canvas hover:text-ink"
              aria-label="Chiudi"
            >
              <X size={15} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
