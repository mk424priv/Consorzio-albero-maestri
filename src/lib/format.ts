const fmtEuro = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

export const euro = (v: number): string => fmtEuro.format(v);

const fmtData = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export const dataBreve = (iso: string): string => fmtData.format(new Date(iso));
