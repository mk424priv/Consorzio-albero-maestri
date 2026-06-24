import { useDrag } from "@use-gesture/react";
import { animate, motion, useMotionValue } from "framer-motion";
import type { ReactNode } from "react";

/*
  Card con azione su swipe-sinistra. L'azione (es. «Riscuoti») sta sotto, a destra;
  scorrendo a sinistra oltre soglia → onAzione. Rispetta il tap (filterTaps).
*/
export function Swipeable({ azione, onAzione, children, soglia = 72 }: { azione: ReactNode; onAzione: () => void; children: ReactNode; soglia?: number }) {
  const x = useMotionValue(0);
  const bind = useDrag(
    ({ last, movement: [mx], cancel }) => {
      const clamped = Math.max(-104, Math.min(0, mx));
      if (last) {
        if (mx < -soglia) {
          onAzione();
          cancel?.();
        }
        animate(x, 0, { type: "spring", stiffness: 420, damping: 36 });
      } else {
        x.set(clamped);
      }
    },
    { axis: "x", filterTaps: true, pointer: { touch: true } },
  );
  return (
    <div className="relative overflow-hidden rounded-vetro">
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-5">{azione}</div>
      <div {...bind()} style={{ touchAction: "pan-y" }}>
        <motion.div style={{ x }}>{children}</motion.div>
      </div>
    </div>
  );
}
