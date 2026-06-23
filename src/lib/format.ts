// Aritmetica del denaro, date ISO, formattazione it-IT. (canone 02 §3.0)

export const UNITA_SPESA = 50; // € per il calcolo di SS nel codice parlante
export const GIORNO_MS = 86_400_000;
export const SOGLIA = 0.005; // confronti su denaro/residui, mai === su float

/** Ogni grandezza monetaria passa SEMPRE da qui. */
export function arrotonda(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

const fmtEuro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });
const fmtNum = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 2 });

export function formatEuro(n: number | null | undefined): string {
  return fmtEuro.format(n ?? 0);
}
export function formatNumero(n: number | null | undefined): string {
  return fmtNum.format(n ?? 0);
}
export function formatOre(n: number | null | undefined): string {
  return `${formatNumero(n)} h`;
}

// ── Date: ISO yyyy-mm-dd in locale ──
export function oggiISO(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}
export function adessoISO(): string {
  return new Date().toISOString();
}
export function dataDaISO(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function giorniTra(isoDa: string, isoA: string): number {
  return (dataDaISO(isoA).getTime() - dataDaISO(isoDa).getTime()) / GIORNO_MS;
}

const GIORNI = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
const GIORNI_BREVI = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"];
const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const MESI_BREVI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];

export function nomeGiorno(iso: string, breve = false): string {
  return (breve ? GIORNI_BREVI : GIORNI)[dataDaISO(iso).getDay()];
}
export function nomeMese(iso: string, breve = false): string {
  return (breve ? MESI_BREVI : MESI)[dataDaISO(iso).getMonth()];
}
export function giornoDelMese(iso: string): number {
  return dataDaISO(iso).getDate();
}
export function annoDi(iso: string): number {
  return dataDaISO(iso).getFullYear();
}
/** "12 giu 2026" */
export function formatData(iso: string): string {
  const d = dataDaISO(iso);
  return `${d.getDate()} ${nomeMese(iso, true)} ${d.getFullYear()}`;
}
/** Chiave mese: "YYYY-MM" */
export function chiaveMese(iso: string): string {
  return iso.slice(0, 7);
}
/** "giugno 2026" */
export function formatMese(chiave: string): string {
  const iso = `${chiave}-01`;
  return `${nomeMese(iso)} ${annoDi(iso)}`;
}
