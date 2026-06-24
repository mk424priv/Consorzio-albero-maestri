import { assegnaIniziali } from "@/lib/codice-parlante";
import { adessoISO, oggiISO } from "@/lib/format";
import { nuovoId } from "@/lib/id";
import type {
  Attrezzo,
  Cliente,
  CompensoOperatore,
  Dati,
  Lavoro,
  Operatore,
  Pagamento,
  RegistrazioneOre,
  Spesa,
} from "@/lib/types";

/** Dati d'esempio: copre i 4 modi, fasi svolto/programmato, incassi pieno/parziale/aperto. */
export function creaSeed(): Dati {
  const ora = adessoISO();
  const oggi = oggiISO();
  const mese = oggi.slice(0, 7); // YYYY-MM
  const g = (gg: number) => `${mese}-${String(gg).padStart(2, "0")}`;

  // ── Operatori ──
  const io: Operatore = { id: nuovoId(), nome: "Io", ruolo: "titolare", tariffaOraria: null, attivo: true, creatoIl: oggi, updatedAt: ora };
  const luca: Operatore = { id: nuovoId(), nome: "Luca", ruolo: "collaboratore", tariffaOraria: 12, telefono: "333 1234567", attivo: true, creatoIl: oggi, updatedAt: ora };
  const marta: Operatore = { id: nuovoId(), nome: "Marta", ruolo: "collaboratore", tariffaOraria: 14, attivo: true, creatoIl: oggi, updatedAt: ora };
  const operatori = [io, luca, marta];

  // ── Clienti ──
  const clienti: Cliente[] = [];
  const cli = (
    nome: string,
    cognome: string | undefined,
    tariffa: number | null,
    modo: "ore" | "preventivo",
    luogo?: string,
    tel?: string,
  ): Cliente => {
    const c: Cliente = {
      id: nuovoId(),
      nome,
      cognome,
      inizialiCodice: assegnaIniziali(nome, cognome, clienti),
      tariffaOraria: tariffa,
      modalitaPredefinita: modo,
      luogo,
      telefono: tel,
      creatoIl: oggi,
      updatedAt: ora,
    };
    clienti.push(c);
    return c;
  };
  const rossi = cli("Giardino", "Rossi", 25, "ore", "Marciana Marina");
  const bianchi = cli("Villa", "Bianchi", null, "preventivo", "Portoferraio");
  const comune = cli("Comune", "Marciana", 28, "ore", "Marciana");
  const verdi = cli("Anna", "Verdi", 22, "ore", "Capoliveri", "340 9988776");

  const lavori: Lavoro[] = [];
  const ore: RegistrazioneOre[] = [];
  const pagamenti: Pagamento[] = [];
  const spese: Spesa[] = [];
  const compensi: CompensoOperatore[] = [];

  const regOra = (l: Lavoro, operatoreId: string, data: string, n: number) =>
    ore.push({ id: nuovoId(), lavoroId: l.id, clienteId: l.clienteId, operatoreId, data, ore: n, updatedAt: ora });

  // L1 — svolto · ore · totale — Rossi, io+Luca, pagato pieno (lordo 300)
  const l1: Lavoro = {
    id: nuovoId(), clienteId: rossi.id, titolo: "Potatura siepi e ulivi", luogo: "Marciana Marina",
    data: g(4), fase: "fatto", modo: "ore", conteggio: "totale", tariffaClienteSnapshot: 25,
    partecipanti: [
      { collaboratoreId: io.id, tariffaSnapshot: 0, oreTotale: 6 },
      { collaboratoreId: luca.id, tariffaSnapshot: 12, oreTotale: 6 },
    ],
    creatoIl: g(4), updatedAt: ora,
  };
  lavori.push(l1);
  regOra(l1, io.id, g(4), 6);
  regOra(l1, luca.id, g(4), 6);
  pagamenti.push({ id: nuovoId(), clienteId: rossi.id, lavoroId: l1.id, origine: "ore", importoAtteso: 300, importoIncassato: 300, dataEmissione: g(4), dataIncasso: g(9), updatedAt: ora });
  spese.push({ id: nuovoId(), categoria: "benzina", importo: 18, data: g(4), lavoroId: l1.id, clienteId: rossi.id, updatedAt: ora });

  // L2 — svolto · preventivo — Bianchi, prezzo 800, parziale (acconto 300)
  const l2: Lavoro = {
    id: nuovoId(), clienteId: bianchi.id, titolo: "Sistemazione giardino villa", luogo: "Portoferraio",
    data: g(8), fase: "fatto", modo: "preventivo", conteggio: "totale", prezzo: 800, periodo: { dal: g(8), al: g(12) },
    partecipanti: [{ collaboratoreId: io.id, tariffaSnapshot: 0 }],
    creatoIl: g(8), updatedAt: ora,
  };
  lavori.push(l2);
  pagamenti.push({ id: nuovoId(), clienteId: bianchi.id, lavoroId: l2.id, origine: "acconto", importoAtteso: 800, importoIncassato: 300, dataEmissione: g(8), dataIncasso: g(10), updatedAt: ora });

  // L3 — svolto · ore · per_giorni — Comune, io+Marta su 3 giorni, aperto (lordo 672)
  const l3: Lavoro = {
    id: nuovoId(), clienteId: comune.id, titolo: "Manutenzione verde pubblico", luogo: "Marciana",
    data: g(15), fase: "fatto", modo: "ore", conteggio: "per_giorni", tariffaClienteSnapshot: 28,
    partecipanti: [
      { collaboratoreId: io.id, tariffaSnapshot: 0 },
      { collaboratoreId: marta.id, tariffaSnapshot: 14 },
    ],
    creatoIl: g(15), updatedAt: ora,
  };
  lavori.push(l3);
  regOra(l3, io.id, g(15), 5);
  regOra(l3, marta.id, g(15), 5);
  regOra(l3, io.id, g(16), 4);
  regOra(l3, marta.id, g(16), 4);
  regOra(l3, io.id, g(17), 6);
  pagamenti.push({ id: nuovoId(), clienteId: comune.id, lavoroId: l3.id, origine: "ore", importoAtteso: 672, importoIncassato: 0, dataEmissione: g(17), dataScadenza: g(30), updatedAt: ora });

  // L4 — programmato (da_fare) — Verdi, pianificato
  const l4: Lavoro = {
    id: nuovoId(), clienteId: verdi.id, titolo: "Impianto nuovo prato", descrizione: "Preparare terreno e semina", luogo: "Capoliveri",
    data: g(28), fase: "da_fare", modo: "ore", conteggio: "totale", tariffaClienteSnapshot: 22,
    partecipanti: [{ collaboratoreId: io.id, tariffaSnapshot: 0 }],
    creatoIl: oggi, updatedAt: ora,
  };
  lavori.push(l4);

  // L5 — svolto · ore — Rossi, solo io, aperto (lordo 100)
  const l5: Lavoro = {
    id: nuovoId(), clienteId: rossi.id, titolo: "Taglio erba uliveto", luogo: "Marciana Marina",
    data: g(20), fase: "fatto", modo: "ore", conteggio: "totale", tariffaClienteSnapshot: 25,
    partecipanti: [{ collaboratoreId: io.id, tariffaSnapshot: 0, oreTotale: 4 }],
    creatoIl: g(20), updatedAt: ora,
  };
  lavori.push(l5);
  regOra(l5, io.id, g(20), 4);
  pagamenti.push({ id: nuovoId(), clienteId: rossi.id, lavoroId: l5.id, origine: "ore", importoAtteso: 100, importoIncassato: 0, dataEmissione: g(20), updatedAt: ora });

  // compenso parziale a Luca
  compensi.push({ id: nuovoId(), operatoreId: luca.id, importo: 40, data: g(12), metodo: "contanti", periodo: mese, updatedAt: ora });

  const attrezzi: Attrezzo[] = [
    { id: nuovoId(), nome: "Ape Piaggio", categoria: "auto", prezzo: 4500, dataAcquisto: "2023-04-12", caratteristiche: "Furgone da lavoro", consumoMedio: 5.5, carburante: "benzina", prezzoCarburante: 1.85, updatedAt: ora },
    { id: nuovoId(), nome: "Decespugliatore Stihl FS 460", categoria: "motore", prezzo: 720, dataAcquisto: "2024-09-03", caratteristiche: "2.2 kW · 9.3 kg", updatedAt: ora },
    { id: nuovoId(), nome: "Tagliasiepi Bosch", categoria: "elettrico", prezzo: 150, dataAcquisto: "2025-02-18", caratteristiche: "550 W · lama 60 cm", updatedAt: ora },
    { id: nuovoId(), nome: "Forbici Felco", categoria: "manuale", prezzo: 45, dataAcquisto: "2024-06-01", caratteristiche: "Lama Ø 25 mm", updatedAt: ora },
  ];

  return { clienti, operatori, lavori, ore, pagamenti, compensi, spese, attrezzi };
}
