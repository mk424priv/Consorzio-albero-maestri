import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useUI } from "@/store/ui";
import { dialogVar, overlayVar } from "@/lib/motion";
import { Button } from "./primitives";

// Dialog di conferma globale (guidato da useUI.conferma).
export function ConfirmHost() {
  const conferma = useUI((s) => s.conferma);
  const chiudi = useUI((s) => s.chiudiConferma);
  const aperto = !!conferma;

  return (
    <Dialog.Root open={aperto} onOpenChange={(o) => !o && chiudi()}>
      <AnimatePresence>
        {aperto && conferma && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div variants={overlayVar} initial="hidden" animate="show" exit="exit" className="fixed inset-0 z-[70] bg-ink/45 backdrop-blur-[3px]" />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                variants={dialogVar}
                initial="hidden"
                animate="show"
                exit="exit"
                className="fixed left-1/2 top-1/2 z-[70] w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-xl)] border border-line bg-surface p-6 shadow-[var(--shadow-lg)]"
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  <span className={`grid h-12 w-12 place-items-center rounded-[14px] ${conferma.pericolo ? "bg-danger-soft text-danger" : "bg-brand-50 text-brand-500"}`}>
                    <AlertTriangle size={22} />
                  </span>
                  <Dialog.Title className="text-lg font-extrabold text-ink">{conferma.titolo}</Dialog.Title>
                  {conferma.descrizione && <p className="text-sm text-muted">{conferma.descrizione}</p>}
                </div>
                <div className="mt-6 grid grid-cols-2 gap-2">
                  <Button onClick={chiudi}>Annulla</Button>
                  <Button
                    variante={conferma.pericolo ? "danger" : "primary"}
                    onClick={() => { conferma.onConfirm(); chiudi(); }}
                  >
                    {conferma.testoConferma ?? "Conferma"}
                  </Button>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
