import { MotionConfig } from "framer-motion";
import { Kitchen } from "@/pages/Kitchen";

/*
  Tappa 1 — l'App mostra la vetrina del design system.
  MotionConfig reducedMotion="user": ogni animazione rispetta prefers-reduced-motion.
  In Tappa 3 l'App passera' alla shell con navigazione e router.
*/
export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Kitchen />
    </MotionConfig>
  );
}
