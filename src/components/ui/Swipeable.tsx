import { useDrag } from "@use-gesture/react";
import { animate, motion, useMotionValue } from "framer-motion";
import type { ReactNode } from "react";

/*
  Card con azione su swipe-sinistra. L'azione (es. «Riscuoti») sta sotto, a destra;
  scorrendo a sinistra oltre soglia → onAzione. Rispetta il tap (filterTaps).
*/
export function Swipeable({
  azione,
  onAzione,
  azioneDx,
  onAzioneDx,
  children,
  soglia = 72,
}: {
  azione?: ReactNode;
  onAzione?: () => void;
  azioneDx?: ReactNode;
  onAzioneDx?: () => void;
  children: ReactNode;
  soglia?: number;
}) {
  const x = useMotionValue(0);
  const bind = useDrag(
    ({ last, movement: [mx], cancel }) => {
      const min = onAzione ? -104 : 0;
      const max = onAzioneDx ? 104 : 0;
      const clamped = Math.max(min, Math.min(max, mx));
      if (last) {
        if (onAzione && mx < -soglia) {
          onAzione();
          cancel?.();
        } else if (onAzioneDx && mx > soglia) {
          onAzioneDx();
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
      {azione && <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-5">{azione}</div>}
      {azioneDx && <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">{azioneDx}</div>}
      <div {...bind()} style={{ touchAction: "pan-y" }}>
        <motion.div style={{ x }}>{children}</motion.div>
      </div>
    </div>
  );
}
