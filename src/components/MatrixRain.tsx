import { useEffect, useRef } from "react";

const GLIFI = "アイウエオカキクケコサシスセソ0123456789ABCDEF<>/{}[]=+*#$";

/**
 * Pioggia di glifi stile Matrix su canvas, come fondale a bassissima opacità.
 * Rispetta prefers-reduced-motion: in quel caso disegna un frame statico.
 */
export function MatrixRain({ opacity = 0.3 }: { opacity?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const riduci = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const CELLA = 16;
    let colonne = 0;
    let gocce: number[] = [];
    let raf = 0;
    let ultimo = 0;

    const ridimensiona = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      colonne = Math.ceil(canvas.width / CELLA);
      gocce = Array.from({ length: colonne }, () =>
        Math.floor(Math.random() * (canvas.height / CELLA)),
      );
      ctx.fillStyle = "rgb(4 7 10)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const passo = () => {
      ctx.fillStyle = "rgb(4 7 10 / 0.10)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${CELLA - 3}px "JetBrains Mono Variable", monospace`;
      for (let i = 0; i < colonne; i++) {
        const glifo = GLIFI[Math.floor(Math.random() * GLIFI.length)];
        const testa = Math.random() < 0.08;
        ctx.fillStyle = testa ? "rgb(190 255 220)" : "rgb(0 255 156)";
        ctx.fillText(glifo, i * CELLA, gocce[i] * CELLA);
        if (gocce[i] * CELLA > canvas.height && Math.random() > 0.975) gocce[i] = 0;
        gocce[i]++;
      }
    };

    const anima = (t: number) => {
      raf = requestAnimationFrame(anima);
      if (t - ultimo < 66) return; // ~15fps: basta per l'effetto, leggero per la GPU
      ultimo = t;
      passo();
    };

    ridimensiona();
    if (riduci) {
      for (let i = 0; i < 40; i++) passo();
    } else {
      raf = requestAnimationFrame(anima);
    }
    window.addEventListener("resize", ridimensiona);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", ridimensiona);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ opacity }}
    />
  );
}
