// Effetto "festa" — coriandoli colorati come ricompensa per ogni registrazione.
import confetti from "canvas-confetti";

const COLORI: Record<string, string[]> = {
  cliente: ["#2fbd72", "#169d55", "#84cc16", "#a3e635"],
  operatore: ["#1bb3a1", "#0d9488", "#54d3bf"],
  lavoro: ["#8b6bfc", "#7857fb", "#cbbcff"],
  preventivo: ["#4aa1f7", "#2589f5", "#aed5ff"],
  entrata: ["#34b563", "#16a34a", "#a7e3ba"],
  uscita: ["#f5a300", "#e08600", "#ffc24d"],
  spesa: ["#f2566f", "#e23a55", "#ffb3c0"],
  patrimonio: ["#968d7e", "#b9b2a4", "#d8d3c8"],
  brand: ["#2fbd72", "#169d55", "#84cc16"],
};

// y in coordinate 0..1 (0 = alto). Default vicino all'azione.
export function festa(tinta: keyof typeof COLORI = "brand", y = 0.35) {
  const colors = COLORI[tinta] ?? COLORI.brand;
  confetti({
    particleCount: 70,
    spread: 75,
    startVelocity: 32,
    gravity: 0.9,
    scalar: 0.85,
    ticks: 140,
    origin: { x: 0.5, y },
    colors,
    disableForReducedMotion: true,
  });
}

// piccolo "pop" laterale doppio (per pagamenti/incassi importanti)
export function festaDoppia(tinta: keyof typeof COLORI = "brand") {
  const colors = COLORI[tinta] ?? COLORI.brand;
  const opt = { particleCount: 45, spread: 60, scalar: 0.8, ticks: 130, colors, disableForReducedMotion: true };
  confetti({ ...opt, origin: { x: 0.2, y: 0.5 }, angle: 60 });
  confetti({ ...opt, origin: { x: 0.8, y: 0.5 }, angle: 120 });
}
