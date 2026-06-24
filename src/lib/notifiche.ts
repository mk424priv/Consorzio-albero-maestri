// Notifiche push via Notification API (PWA). Attive solo se l'utente le abilita.
import type { Dati } from "./types";
import { oggiISO } from "./format";

const LS_KEY = "albero:notifiche";

export function notificheAbilitate(): boolean {
  try { return localStorage.getItem(LS_KEY) === "true"; } catch { return false; }
}

export function setNotificheAbilitate(v: boolean): void {
  try { localStorage.setItem(LS_KEY, v ? "true" : "false"); } catch { /* ignore */ }
}

export async function richiediPermessoNotifiche(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const perm = await Notification.requestPermission();
  return perm === "granted";
}

export function mostraNotifica(titolo: string, corpo: string): void {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  new Notification(titolo, { body: corpo, icon: "/albero.svg", badge: "/albero.svg" });
}

function iso(data: string): Date {
  return new Date(data + "T00:00:00");
}

/** Controlla eventi in arrivo e mostra notifiche (chiamare all'avvio app se abilitato). */
export function verificaNotificheGiornaliere(dati: Dati): void {
  if (!notificheAbilitate() || Notification.permission !== "granted") return;

  const oggi = oggiISO();
  const domaniD = new Date(iso(oggi).getTime() + 86400000);
  const domani = domaniD.toISOString().slice(0, 10);

  // Lavori programmati per oggi
  const lavoriOggi = dati.lavori.filter(
    (l) => !l.deleted && l.fase === "da_fare" && l.data === oggi,
  );
  if (lavoriOggi.length > 0) {
    mostraNotifica(
      `${lavoriOggi.length} lavoro${lavoriOggi.length > 1 ? "i" : ""} programmato${lavoriOggi.length > 1 ? "i" : ""} oggi`,
      lavoriOggi.map((l) => l.titolo).join(", "),
    );
  }

  // Lavori programmati per domani
  const lavoriDomani = dati.lavori.filter(
    (l) => !l.deleted && l.fase === "da_fare" && l.data === domani,
  );
  if (lavoriDomani.length > 0) {
    mostraNotifica(
      `Domani: ${lavoriDomani.length} lavoro${lavoriDomani.length > 1 ? "i" : ""}`,
      lavoriDomani.map((l) => l.titolo).join(", "),
    );
  }

  // Appuntamenti di oggi
  const appOggi = dati.appuntamenti.filter(
    (a) => !a.deleted && !a.completato && a.data === oggi,
  );
  if (appOggi.length > 0) {
    mostraNotifica(
      `${appOggi.length} appuntamento${appOggi.length > 1 ? "i" : ""} oggi`,
      appOggi.map((a) => a.titolo).join(", "),
    );
  }

  // Promemoria scaduti (data passata, non completati)
  const promemoria = dati.appuntamenti.filter(
    (a) => !a.deleted && !a.completato && a.tipo === "promemoria" && a.data < oggi,
  );
  if (promemoria.length > 0) {
    mostraNotifica(
      `${promemoria.length} promemoria in scadenza`,
      promemoria.map((a) => a.titolo).join(", "),
    );
  }

  // Pagamenti scaduti non incassati
  const pagamentiScaduti = dati.pagamenti.filter(
    (p) => !p.deleted && p.dataScadenza && p.dataScadenza < oggi &&
      p.importoIncassato < p.importoAtteso - 0.005,
  );
  if (pagamentiScaduti.length > 0) {
    mostraNotifica(
      `${pagamentiScaduti.length} fattura${pagamentiScaduti.length > 1 ? "e" : ""} scaduta${pagamentiScaduti.length > 1 ? "e" : ""}`,
      "Controlla la sezione Soldi per i dettagli.",
    );
  }
}

// Per evitare notifiche doppie nella stessa sessione
let notificheInviateOggi = false;

export function verificaUnaVoltaAlGiorno(dati: Dati): void {
  if (notificheInviateOggi) return;
  notificheInviateOggi = true;
  verificaNotificheGiornaliere(dati);
}
