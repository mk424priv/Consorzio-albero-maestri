// Dati d'esempio — scenario dell'Isola d'Elba: clienti con storie diverse,
// una squadra di due operatori e i loro compensi (saldati e in sospeso).

import type { Database } from "@/lib/types";

function giorni(n: number): string {
  const d = new Date();
  d.setHours(10, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const mese = (iso: string) => iso.slice(0, 7);

export function datiIniziali(): Database {
  const titolare = "op_marco";
  const luca = "op_luca";

  const rossi = "cl_rossi";
  const ricci = "cl_ricci";
  const bianchi = "cl_bianchi";
  const verdi = "cl_verdi";

  const lavRossi1 = "lv_rossi1";
  const lavRossi2 = "lv_rossi2";
  const lavRicci = "lv_ricci";
  const lavBianchi = "lv_bianchi";

  return {
    operatori: [
      { id: titolare, nome: "Marco", ruolo: "titolare", tariffaOraria: null, attivo: true, creatoIl: giorni(-500) },
      { id: luca, nome: "Luca", ruolo: "collaboratore", tariffaOraria: 16, telefono: "349 5566778", attivo: true, creatoIl: giorni(-90) },
    ],

    clienti: [
      { id: rossi, nome: "Mario", cognome: "Rossi", inizialiCodice: "MR", telefono: "333 1234567", luogo: "Villa Rossi, Marina di Campo (Elba)", modalitaPredefinita: "preventivo", tariffaOraria: 30, creatoIl: giorni(-405) },
      { id: ricci, nome: "Maria", cognome: "Ricci", inizialiCodice: "MR1", telefono: "340 7654321", luogo: "Giardino Ricci, Portoferraio", modalitaPredefinita: "ore", tariffaOraria: 28, creatoIl: giorni(-30) },
      { id: bianchi, nome: "Giovanni", cognome: "Bianchi", inizialiCodice: "GB", telefono: "347 1112233", luogo: "Capoliveri", modalitaPredefinita: "preventivo", creatoIl: giorni(-70) },
      { id: verdi, nome: "Anna", cognome: "Verdi", inizialiCodice: "AV", telefono: "366 9988776", luogo: "Rio Marina", modalitaPredefinita: "misto", tariffaOraria: 32, creatoIl: giorni(-5) },
    ],

    lavori: [
      { id: lavRossi1, clienteId: rossi, titolo: "Potatura olivi e siepe", luogo: "Villa Rossi, Marina di Campo", data: giorni(-400), stato: "fatto", tipoCompenso: "preventivo", operatoreId: titolare, creatoIl: giorni(-405) },
      { id: lavRossi2, clienteId: rossi, titolo: "Abbattimento pino pericolante", luogo: "Villa Rossi", data: giorni(-30), stato: "fatto", tipoCompenso: "preventivo", operatoreId: titolare, creatoIl: giorni(-35) },
      { id: lavRicci, clienteId: ricci, titolo: "Manutenzione giardino (a ore)", luogo: "Portoferraio", data: giorni(-10), stato: "fatto", tipoCompenso: "ore", operatoreId: luca, creatoIl: giorni(-12) },
      { id: lavBianchi, clienteId: bianchi, titolo: "Trattamento fitosanitario", luogo: "Capoliveri", data: giorni(-60), stato: "fatto", tipoCompenso: "preventivo", operatoreId: titolare, creatoIl: giorni(-60) },
      { id: "lv_verdi1", clienteId: verdi, titolo: "Sopralluogo e preventivo", luogo: "Rio Marina", data: giorni(0), ordineNelGiorno: 1, stato: "da_fare", tipoCompenso: "ore", operatoreId: titolare, creatoIl: giorni(-5) },
      { id: "lv_ricci2", clienteId: ricci, titolo: "Taglio erba", luogo: "Portoferraio", data: giorni(0), ordineNelGiorno: 2, stato: "da_fare", tipoCompenso: "ore", operatoreId: luca, creatoIl: giorni(-3) },
      { id: "lv_rossi3", clienteId: rossi, titolo: "Controllo impianto irrigazione", luogo: "Marina di Campo", data: giorni(2), stato: "da_fare", tipoCompenso: "preventivo", operatoreId: titolare, creatoIl: giorni(-3) },
      { id: "lv_bianchi2", clienteId: bianchi, titolo: "Potatura siepe", luogo: "Capoliveri", data: giorni(4), stato: "da_fare", tipoCompenso: "preventivo", operatoreId: luca, creatoIl: giorni(-3) },
    ],

    preventivi: [
      { id: "pr_rossi1", clienteId: rossi, lavoroId: lavRossi1, tipo: "unico", importoTotale: 800, dataEmissione: giorni(-405) },
      { id: "pr_rossi2", clienteId: rossi, lavoroId: lavRossi2, tipo: "acconto_saldo", importoTotale: 600, importoAcconto: 200, importoSaldo: 400, dataEmissione: giorni(-35) },
      { id: "pr_bianchi1", clienteId: bianchi, lavoroId: lavBianchi, tipo: "unico", importoTotale: 450, dataEmissione: giorni(-60) },
    ],

    ore: [
      { id: "or_1", clienteId: ricci, lavoroId: lavRicci, operatoreId: luca, data: giorni(-12), ore: 4, note: "Manutenzione verde" },
      { id: "or_2", clienteId: ricci, lavoroId: lavRicci, operatoreId: luca, data: giorni(-10), ore: 3.5, note: "Manutenzione verde" },
      { id: "or_3", clienteId: ricci, lavoroId: lavRicci, operatoreId: luca, data: giorni(-9), ore: 2, note: "Manutenzione verde" },
    ],

    pagamenti: [
      { id: "pa_rossi1", clienteId: rossi, lavoroId: lavRossi1, preventivoId: "pr_rossi1", origine: "preventivo", importoAtteso: 800, importoIncassato: 800, stato: "pagato", dataEmissione: giorni(-400), dataScadenza: giorni(-370), dataIncasso: giorni(-397) },
      { id: "pa_rossi2", clienteId: rossi, lavoroId: lavRossi2, preventivoId: "pr_rossi2", origine: "acconto", importoAtteso: 200, importoIncassato: 200, stato: "pagato", dataEmissione: giorni(-35), dataIncasso: giorni(-33) },
      { id: "pa_rossi3", clienteId: rossi, lavoroId: lavRossi2, preventivoId: "pr_rossi2", origine: "saldo", importoAtteso: 400, importoIncassato: 400, stato: "pagato", dataEmissione: giorni(-30), dataScadenza: giorni(0), dataIncasso: giorni(-26) },
      { id: "pa_ricci1", clienteId: ricci, lavoroId: lavRicci, origine: "ore", importoAtteso: 9.5 * 28, importoIncassato: 0, stato: "in_attesa", dataEmissione: giorni(-8), dataScadenza: giorni(22) },
      { id: "pa_bianchi1", clienteId: bianchi, lavoroId: lavBianchi, preventivoId: "pr_bianchi1", origine: "preventivo", importoAtteso: 450, importoIncassato: 0, stato: "in_attesa", dataEmissione: giorni(-60), dataScadenza: giorni(-30) },
    ],

    compensi: [
      { id: "co_luca1", operatoreId: luca, importo: 100, data: giorni(-7), periodo: mese(giorni(-7)), metodo: "contanti", note: "Acconto manutenzione Ricci" },
    ],

    spese: [
      { id: "sp_1", categoria: "benzina", importo: 60, data: giorni(-5), descrizione: "Pieno furgone" },
      { id: "sp_2", categoria: "materiali", importo: 35.5, data: giorni(-7), descrizione: "Olio catena, filo decespugliatore" },
      { id: "sp_3", categoria: "benzina", importo: 55, data: giorni(-20), descrizione: "Pieno furgone" },
      { id: "sp_4", categoria: "attrezzi", importo: 280, data: giorni(-45), descrizione: "Soffiatore nuovo" },
    ],

    attrezzi: [
      { id: "at_1", nome: "Motosega Stihl MS 261", costoAcquisto: 720, dataAcquisto: giorni(-500), stato: "ok" },
      { id: "at_2", nome: "Decespugliatore", costoAcquisto: 380, dataAcquisto: giorni(-300), stato: "ok" },
      { id: "at_3", nome: "Soffiatore", costoAcquisto: 280, dataAcquisto: giorni(-45), stato: "ok" },
      { id: "at_4", nome: "Tagliasiepi", costoAcquisto: 250, dataAcquisto: giorni(-200), stato: "manutenzione" },
    ],
  };
}
