// Preset di animazione condivisi (framer-motion).
import type { Variants, Transition } from "framer-motion";

export const springSoft: Transition = { type: "spring", stiffness: 380, damping: 32 };
export const springSnappy: Transition = { type: "spring", stiffness: 520, damping: 34 };
export const easeOut: Transition = { duration: 0.28, ease: [0.16, 1, 0.3, 1] };

// Lista con comparsa a cascata
export const listaContenitore: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.02 } },
};
export const listaElemento: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: easeOut },
};

// Pressione carte/bottoni
export const tap = { scale: 0.97 };
export const tapSoft = { scale: 0.985 };

// Comparsa pagina
export const paginaVar: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: easeOut },
  exit: { opacity: 0, y: -6, transition: { duration: 0.16 } },
};

// Foglio (sheet) bottom su mobile
export const sheetMobile: Variants = {
  hidden: { y: "100%" },
  show: { y: 0, transition: springSoft },
  exit: { y: "100%", transition: { duration: 0.2 } },
};
// Dialog centrato su desktop — solo dissolvenza + lieve scorrimento (niente
// "scale" che dà l'effetto di zoom al tocco/apertura).
export const dialogVar: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: springSoft },
  exit: { opacity: 0, y: 8, transition: { duration: 0.15 } },
};
export const overlayVar: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};
