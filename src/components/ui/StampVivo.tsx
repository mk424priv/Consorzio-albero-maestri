import { AnimatePresence, motion } from "framer-motion";

const N = 12;

/** Sprizzo di luce alla conferma (incasso/pagamento). Overlay assoluto. */
export function StampVivo({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-visible">
          <motion.span
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: [0, 1.4, 1.1], opacity: [0.5, 0.25, 0] }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute h-16 w-16 rounded-full bg-lime/30"
          />
          {Array.from({ length: N }).map((_, i) => {
            const a = (i / N) * Math.PI * 2;
            return (
              <motion.span
                key={i}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{ x: Math.cos(a) * 64, y: Math.sin(a) * 64, scale: 0, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute h-1.5 w-1.5 rounded-full bg-lime"
              />
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}
