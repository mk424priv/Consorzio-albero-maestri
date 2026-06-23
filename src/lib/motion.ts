import type { Transition, Variants } from "framer-motion";

/*
  Movimento = "voltare pagina", non "transizione web" (canone 01/02 §1.1, §3.6).
  Durate calme, curve naturali, NIENTE rimbalzo elastico — tranne il leggero
  galleggiamento delle card `programmato`. Il movimento significa il TEMPO:
  il passato si posa, il futuro galleggia. Tutto rispetta reduced-motion.
*/

export const voltaPagina: Transition = {
  type: "tween",
  ease: [0.22, 0.61, 0.36, 1],
  duration: 0.42,
};

/** Il passato "si posa" e non trema piu'. */
export const posa: Transition = {
  type: "tween",
  ease: [0.2, 0.8, 0.2, 1],
  duration: 0.5,
};

/** Il futuro "galleggia" — unico punto con un filo di molla. */
export const galleggia: Transition = {
  type: "spring",
  stiffness: 210,
  damping: 24,
  mass: 0.9,
};

/** Card `svolto`: scende e si posa. */
export const cardPosa: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: posa },
};

/** Card `programmato`: arriva dall'alto e galleggia. */
export const cardGalleggia: Variants = {
  hidden: { opacity: 0, y: -6 },
  show: { opacity: 1, y: 0, transition: galleggia },
};

/** Foglio inferiore (sheet): sale dal basso come una pagina. */
export const foglioSu: Variants = {
  hidden: { y: "100%" },
  show: { y: 0, transition: voltaPagina },
  exit: { y: "100%", transition: { ...voltaPagina, duration: 0.3 } },
};

/** Velo del modale. */
export const velo: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

/** Lista a comparsa scaglionata (per i giorni dell'Agenda). */
export const listaScaglionata: Variants = {
  show: { transition: { staggerChildren: 0.035 } },
};
