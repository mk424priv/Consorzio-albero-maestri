import { useRef, type PointerEvent } from "react";

/**
 * Long-press che non rompe tap/swipe: parte su pointerdown, si annulla se il dito
 * si muove oltre soglia (lo swipe vince) o al rilascio. `fired` permette al click
 * di sopprimersi quando il long-press è scattato.
 */
export function useLongPress(onLong: () => void, ms = 480) {
  const timer = useRef<number | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);

  const clear = () => {
    if (timer.current != null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const handlers = {
    onPointerDown: (e: PointerEvent) => {
      fired.current = false;
      start.current = { x: e.clientX, y: e.clientY };
      clear();
      timer.current = window.setTimeout(() => {
        fired.current = true;
        onLong();
      }, ms);
    },
    onPointerMove: (e: PointerEvent) => {
      if (!start.current) return;
      if (Math.abs(e.clientX - start.current.x) > 8 || Math.abs(e.clientY - start.current.y) > 8) clear();
    },
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
  };

  return { handlers, fired };
}
