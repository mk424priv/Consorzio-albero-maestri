import type { CSSProperties, ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useIsDesktop } from "@/lib/hooks";
import { dialogVar, overlayVar, sheetMobile } from "@/lib/motion";

export type PatternModale = "dots" | "grid" | "rings" | "diagonal";

function texture(p: PatternModale): CSSProperties {
  const c = "rgba(255,255,255,0.18)";
  switch (p) {
    case "grid":
      return { backgroundImage: `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`, backgroundSize: "18px 18px" };
    case "rings":
      return { backgroundImage: `radial-gradient(circle, transparent 6px, ${c} 7px, transparent 8px)`, backgroundSize: "26px 26px" };
    case "diagonal":
      return { backgroundImage: `repeating-linear-gradient(45deg, ${c} 0 1px, transparent 1px 11px)` };
    default:
      return { backgroundImage: `radial-gradient(${c} 1.4px, transparent 1.6px)`, backgroundSize: "14px 14px" };
  }
}

export function Sheet({
  aperto,
  onClose,
  titolo,
  sottotitolo,
  icona,
  accent,
  pattern = "dots",
  motivo,
  children,
  larghezza = "sm:max-w-lg",
}: {
  aperto: boolean;
  onClose: () => void;
  titolo: string;
  sottotitolo?: string;
  icona?: ReactNode;
  accent?: string; // classi gradiente per l'intestazione colorata
  pattern?: PatternModale;
  motivo?: ReactNode; // icona-filigrana grande
  children: ReactNode;
  larghezza?: string;
}) {
  const desktop = useIsDesktop();
  const colorata = !!accent;

  return (
    <Dialog.Root open={aperto} onOpenChange={(o) => !o && onClose()}>
      <AnimatePresence>
        {aperto && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div variants={overlayVar} initial="hidden" animate="show" exit="exit" className="fixed inset-0 z-50 bg-ink/45 backdrop-blur-[3px]" />
            </Dialog.Overlay>

            <Dialog.Content asChild forceMount onOpenAutoFocus={(e) => e.preventDefault()} aria-describedby={undefined}>
              <motion.div
                variants={desktop ? dialogVar : sheetMobile}
                initial="hidden"
                animate="show"
                exit="exit"
                className={cn(
                  "fixed z-50 flex flex-col overflow-hidden border border-line bg-surface shadow-[var(--shadow-lg)]",
                  desktop
                    ? cn("left-1/2 top-1/2 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-xl)]", larghezza)
                    : "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[var(--radius-xl)]",
                )}
              >
                {/* Scena d'intestazione (colorata + filigrana + texture) */}
                <div className={cn("relative shrink-0 overflow-hidden", colorata ? cn(accent, "text-white") : "bg-surface")}>
                  {colorata && <div className="pointer-events-none absolute inset-0 opacity-60" style={texture(pattern)} />}
                  {colorata && (
                    <motion.div
                      aria-hidden
                      initial={{ opacity: 0, scale: 0.9, rotate: -8 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0, y: [0, -5, 0] }}
                      transition={{ opacity: { duration: 0.4 }, scale: { duration: 0.4 }, y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" } }}
                      className="pointer-events-none absolute -right-4 -top-5 text-white/15"
                    >
                      {motivo}
                    </motion.div>
                  )}
                  {!desktop && (
                    <div className="relative flex justify-center pt-2.5">
                      <span className={cn("h-1.5 w-10 rounded-full", colorata ? "bg-white/45" : "bg-line-strong")} />
                    </div>
                  )}
                  <div className="relative flex items-start justify-between gap-3 px-5 pb-4 pt-4">
                    <div className="flex items-center gap-3">
                      {icona && (
                        <motion.span
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 420, damping: 20, delay: 0.05 }}
                          className={cn("grid h-11 w-11 place-items-center rounded-[14px]", colorata ? "bg-white/20 text-white backdrop-blur" : "bg-brand-50 text-brand-500")}
                        >
                          {icona}
                        </motion.span>
                      )}
                      <div>
                        <Dialog.Title className={cn("text-lg font-extrabold leading-tight", colorata ? "text-white" : "text-ink")}>{titolo}</Dialog.Title>
                        {sottotitolo && <p className={cn("mt-0.5 text-[0.82rem]", colorata ? "text-white/85" : "text-muted")}>{sottotitolo}</p>}
                      </div>
                    </div>
                    <Dialog.Close asChild>
                      <button
                        aria-label="Chiudi"
                        className={cn("-mr-1 grid h-9 w-9 place-items-center rounded-[11px] transition", colorata ? "text-white/80 hover:bg-white/20 hover:text-white" : "text-muted hover:bg-canvas hover:text-ink")}
                      >
                        <X size={18} />
                      </button>
                    </Dialog.Close>
                  </div>
                </div>

                <div className="overflow-y-auto px-5 py-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]">{children}</div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

export function SheetFooter({ children }: { children: ReactNode }) {
  return <div className="mt-5 flex items-center justify-end gap-2">{children}</div>;
}

// contenitore per la comparsa "a cascata" dei campi dentro un foglio
export function SheetStagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } } }}
    >
      {children}
    </motion.div>
  );
}
export function SheetRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } } }}>
      {children}
    </motion.div>
  );
}
