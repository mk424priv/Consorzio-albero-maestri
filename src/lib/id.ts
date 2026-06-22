// Generatore di id ordinabili e leggibili (sostituto leggero di cuid).
export function nuovoId(prefisso = "c"): string {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 9);
  return `${prefisso}_${t}${r}`;
}
