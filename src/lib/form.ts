// Helper per leggere i campi dei form nelle azioni server.

export function testo(fd: FormData, k: string): string | null {
  const v = fd.get(k);
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

export function numero(fd: FormData, k: string): number | null {
  const s = testo(fd, k);
  if (s === null) return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function data(fd: FormData, k: string): Date | null {
  const s = testo(fd, k);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}
