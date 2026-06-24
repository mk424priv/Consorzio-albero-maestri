import type { Transition, Variants } from "framer-motion";

/* Movimento "Vetro Vivo": molle, reveal con blur, niente lineare. (canone 04 §5) */

export const molla: Transition = { type: "spring", stiffness: 300, damping: 30, mass: 0.8 };
export const mollaMorbida: Transition = { type: "spring", stiffness: 200, damping: 26 };

/** Il vetro "si condensa": blur-in + scale. */
export const reveal: Variants = {
  hidden: { opacity: 0, scale: 0.96, filter: "blur(10px)" },
  show: { opacity: 1, scale: 1, filter: "blur(0px)", transition: { type: "spring", stiffness: 240, damping: 26 } },
};

export const rivelaSu: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: molla },
};

/** Foglio che sale dal basso (sheet). */
export const foglioSu: Variants = {
  hidden: { y: "100%" },
  show: { y: 0, transition: { type: "spring", stiffness: 320, damping: 34 } },
  exit: { y: "100%", transition: { duration: 0.25 } },
};

export const velo: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const listaScaglionata: Variants = {
  show: { transition: { staggerChildren: 0.045 } },
};
