import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { velo } from "@/lib/motion";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/** Modale di vetro centrato. */
export function Modal({ open, onOpenChange, title, description, children, className }: ModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div variants={velo} initial="hidden" animate="show" exit="exit" className="fixed inset-0 z-40 bg-fondo/60" />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount>
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 10, filter: "blur(8px)" }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.96, y: 6 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className={cn(
                  "glass-scura fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-bolla p-5 text-bianco",
                  className,
                )}
              >
                <DialogPrimitive.Title className={cn("font-display text-lg text-bianco", !title && "sr-only")}>
                  {title ?? "Dialogo"}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className={cn("mt-1 text-sm text-fumo", !description && "sr-only")}>
                  {description ?? "Dialogo"}
                </DialogPrimitive.Description>
                <div className="mt-4">{children}</div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
