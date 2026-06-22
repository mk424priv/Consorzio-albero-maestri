// Formattazione per l'interfaccia (italiano).

export function euro(n: number | null | undefined): string {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
}

export function arrotonda(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function dataIT(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function dataLungaIT(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function meseAnnoIT(anno: number, mese1to12: number): string {
  const d = new Date(anno, mese1to12 - 1, 1);
  const s = new Intl.DateTimeFormat("it-IT", {
    month: "long",
    year: "numeric",
  }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function ore(n: number | null | undefined): string {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return `${new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 }).format(v)} h`;
}

export function chiaveMese(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
