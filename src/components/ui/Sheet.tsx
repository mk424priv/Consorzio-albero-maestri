import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { foglioSu, velo } from "@/lib/motion";

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/** Foglio inferiore (bottom sheet) su Radix Dialog: accessibile, sale dal basso. */
export function Sheet({ open, onOpenChange, title, description, children, className }: SheetProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                variants={velo}
                initial="hidden"
                animate="show"
                exit="exit"
                className="fixed inset-0 z-40 bg-inchiostro/40"
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount>
              <motion.div
                variants={foglioSu}
                initial="hidden"
                animate="show"
                exit="exit"
                className={cn(
                  "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-bolla bg-carta-alta shadow-targhetta",
                  className,
                )}
              >
                <div aria-hidden className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-carta-ombra" />
                <div className="overflow-y-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3">
                  <DialogPrimitive.Title className={cn("font-display text-xl text-inchiostro", !title && "sr-only")}>
                    {title ?? "Foglio"}
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className={cn("mt-1 text-sm text-inchiostro-debole", !description && "sr-only")}>
                    {description ?? "Foglio"}
                  </DialogPrimitive.Description>
                  <div className="mt-4">{children}</div>
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
