import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useIsDesktop } from "@/lib/hooks";
import { dialogVar, overlayVar, sheetMobile } from "@/lib/motion";

export function Sheet({
  aperto,
  onClose,
  titolo,
  sottotitolo,
  icona,
  accent,
  children,
  larghezza = "sm:max-w-lg",
}: {
  aperto: boolean;
  onClose: () => void;
  titolo: string;
  sottotitolo?: string;
  icona?: ReactNode;
  accent?: string; // classi gradiente per l'intestazione colorata
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
              <motion.div
                variants={overlayVar}
                initial="hidden"
                animate="show"
                exit="exit"
                className="fixed inset-0 z-50 bg-ink/45 backdrop-blur-[3px]"
              />
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
                {/* Intestazione (colorata se accent) */}
                <div className={cn("relative shrink-0", colorata ? cn(accent, "text-white") : "bg-surface")}>
                  {colorata && <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-white/15 blur-2xl" />}
                  {!desktop && (
                    <div className="flex justify-center pt-2.5">
                      <span className={cn("h-1.5 w-10 rounded-full", colorata ? "bg-white/40" : "bg-line-strong")} />
                    </div>
                  )}
                  <div className="relative flex items-start justify-between gap-3 px-5 pb-4 pt-4">
                    <div className="flex items-center gap-3">
                      {icona && (
                        <span className={cn("grid h-11 w-11 place-items-center rounded-[14px]", colorata ? "bg-white/15 text-white backdrop-blur" : "bg-brand-50 text-brand-500")}>
                          {icona}
                        </span>
                      )}
                      <div>
                        <Dialog.Title className={cn("text-lg font-extrabold leading-tight", colorata ? "text-white" : "text-ink")}>{titolo}</Dialog.Title>
                        {sottotitolo && <p className={cn("mt-0.5 text-[0.82rem]", colorata ? "text-white/85" : "text-muted")}>{sottotitolo}</p>}
                      </div>
                    </div>
                    <Dialog.Close asChild>
                      <button
                        aria-label="Chiudi"
                        className={cn(
                          "-mr-1 grid h-9 w-9 place-items-center rounded-[11px] transition",
                          colorata ? "text-white/80 hover:bg-white/15 hover:text-white" : "text-muted hover:bg-canvas hover:text-ink",
                        )}
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
