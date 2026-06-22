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
  children,
  larghezza = "sm:max-w-lg",
}: {
  aperto: boolean;
  onClose: () => void;
  titolo: string;
  sottotitolo?: string;
  icona?: ReactNode;
  children: ReactNode;
  larghezza?: string;
}) {
  const desktop = useIsDesktop();

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

            <Dialog.Content
              asChild
              forceMount
              onOpenAutoFocus={(e) => e.preventDefault()}
              aria-describedby={undefined}
            >
              <motion.div
                variants={desktop ? dialogVar : sheetMobile}
                initial="hidden"
                animate="show"
                exit="exit"
                className={cn(
                  "fixed z-50 flex flex-col border border-line bg-surface shadow-[var(--shadow-lg)]",
                  desktop
                    ? cn("left-1/2 top-1/2 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-xl)]", larghezza)
                    : "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[var(--radius-xl)]",
                )}
              >
                {!desktop && (
                  <div className="flex justify-center pt-2.5">
                    <span className="h-1.5 w-10 rounded-full bg-line-strong" />
                  </div>
                )}
                <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-4">
                  <div className="flex items-center gap-3">
                    {icona && (
                      <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-brand-50 text-brand-500">{icona}</span>
                    )}
                    <div>
                      <Dialog.Title className="text-lg font-extrabold text-ink">{titolo}</Dialog.Title>
                      {sottotitolo && <p className="mt-0.5 text-sm text-muted">{sottotitolo}</p>}
                    </div>
                  </div>
                  <Dialog.Close asChild>
                    <button className="-mr-1 grid h-9 w-9 place-items-center rounded-[11px] text-muted transition hover:bg-canvas hover:text-ink" aria-label="Chiudi">
                      <X size={18} />
                    </button>
                  </Dialog.Close>
                </div>
                <div className="overflow-y-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]">{children}</div>
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
