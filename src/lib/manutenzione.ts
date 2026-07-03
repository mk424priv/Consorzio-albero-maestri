import type { InterventoManutenzione, UnitaIntervallo } from "./types";

// Motore manutenzione — la prossima scadenza si deriva sempre da
// dataUltimo + intervallo, mai salvata. "Fatto oggi" si limita a riportare
// dataUltimo alla data odierna: il ciclo riparte da lì.

export const oggiISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const parseData = (iso: string): Date => new Date(`${iso}T00:00:00`);

const inizioGiorno = (d: Date): Date => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const aggiungiIntervallo = (data: Date, valore: number, unita: UnitaIntervallo): Date => {
  const d = new Date(data);
  if (unita === "giorni") d.setDate(d.getDate() + valore);
  else if (unita === "mesi") d.setMonth(d.getMonth() + valore);
  else d.setFullYear(d.getFullYear() + valore);
  return d;
};

export const prossimaScadenza = (
  i: Pick<InterventoManutenzione, "dataUltimo" | "intervalloValore" | "intervalloUnita">,
): Date => aggiungiIntervallo(parseData(i.dataUltimo), i.intervalloValore, i.intervalloUnita);

export const giorniAllaScadenza = (scadenza: Date, riferimento: Date = new Date()): number =>
  Math.round((inizioGiorno(scadenza).getTime() - inizioGiorno(riferimento).getTime()) / 86_400_000);

export type StatoScadenza = "scaduto" | "urgente" | "ok";

export const statoScadenza = (giorni: number): StatoScadenza =>
  giorni < 0 ? "scaduto" : giorni <= 7 ? "urgente" : "ok";
