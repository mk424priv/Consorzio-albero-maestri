import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

type Tono = "lime" | "positivo" | "attenzione";

const fill: Record<Tono, string> = {
  lime: "bg-lime",
  positivo: "bg-positivo",
  attenzione: "bg-attenzione",
};

/** Barra che si riempie con uno sweep (spring). */
export function Progress({ pct, tono = "lime", className }: { pct: number; tono?: Tono; className?: string }) {
  const v = Math.min(100, Math.max(0, pct));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-pill bg-white/10", className)}>
      <motion.div
        className={cn("h-full rounded-pill", fill[tono])}
        initial={{ width: 0 }}
        animate={{ width: `${v}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      />
    </div>
  );
}
