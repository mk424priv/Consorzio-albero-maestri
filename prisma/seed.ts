import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Helper: data a N giorni da oggi (negativo = passato).
const giorni = (n: number) => {
  const d = new Date();
  d.setHours(10, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
};

async function main() {
  // pulizia (ordine: figli → padri)
  await db.spesa.deleteMany();
  await db.pagamento.deleteMany();
  await db.preventivo.deleteMany();
  await db.registrazioneOre.deleteMany();
  await db.lavoro.deleteMany();
  await db.cliente.deleteMany();
  await db.persona.deleteMany();
  await db.attrezzo.deleteMany();

  const titolare = await db.persona.create({
    data: { nome: "Marco (titolare)", ruolo: "titolare" },
  });
  const operatore = await db.persona.create({
    data: { nome: "Luca", ruolo: "operatore" },
  });

  // ---- Cliente 1: Mario Rossi — a preventivo, paga puntuale, cliente storico
  const rossi = await db.cliente.create({
    data: {
      nome: "Mario",
      cognome: "Rossi",
      inizialiCodice: "MR",
      telefono: "333 1234567",
      luogo: "Villa Rossi, Marina di Campo (Elba)",
      modalitaPredefinita: "preventivo",
      tariffaOraria: 30,
    },
  });
  const lavRossi1 = await db.lavoro.create({
    data: {
      clienteId: rossi.id,
      titolo: "Potatura olivi e siepe",
      luogo: "Villa Rossi, Marina di Campo",
      data: giorni(-400),
      stato: "fatto",
      tipoCompenso: "preventivo",
      personaId: titolare.id,
    },
  });
  await db.preventivo.create({
    data: { clienteId: rossi.id, lavoroId: lavRossi1.id, tipo: "unico", importoTotale: 800, dataEmissione: giorni(-405) },
  });
  await db.pagamento.create({
    data: {
      clienteId: rossi.id, lavoroId: lavRossi1.id, origine: "preventivo",
      importoAtteso: 800, importoIncassato: 800, stato: "pagato",
      dataEmissione: giorni(-400), dataScadenza: giorni(-370), dataIncasso: giorni(-397),
    },
  });
  const lavRossi2 = await db.lavoro.create({
    data: {
      clienteId: rossi.id, titolo: "Abbattimento pino pericolante",
      luogo: "Villa Rossi", data: giorni(-30), stato: "fatto",
      tipoCompenso: "preventivo", personaId: titolare.id,
    },
  });
  await db.preventivo.create({
    data: { clienteId: rossi.id, lavoroId: lavRossi2.id, tipo: "acconto_saldo", importoTotale: 600, importoAcconto: 200, importoSaldo: 400, dataEmissione: giorni(-35) },
  });
  await db.pagamento.create({
    data: { clienteId: rossi.id, lavoroId: lavRossi2.id, origine: "acconto", importoAtteso: 200, importoIncassato: 200, stato: "pagato", dataEmissione: giorni(-35), dataIncasso: giorni(-33) },
  });
  await db.pagamento.create({
    data: { clienteId: rossi.id, lavoroId: lavRossi2.id, origine: "saldo", importoAtteso: 400, importoIncassato: 400, stato: "pagato", dataEmissione: giorni(-30), dataScadenza: giorni(0), dataIncasso: giorni(-26) },
  });

  // ---- Cliente 2: Maria Ricci — collisione iniziali (MR1), a ore, debito aperto
  const ricci = await db.cliente.create({
    data: {
      nome: "Maria", cognome: "Ricci", inizialiCodice: "MR1",
      telefono: "340 7654321", luogo: "Giardino Ricci, Portoferraio",
      modalitaPredefinita: "ore", tariffaOraria: 28,
    },
  });
  const lavRicci = await db.lavoro.create({
    data: { clienteId: ricci.id, titolo: "Manutenzione giardino (a ore)", luogo: "Portoferraio", data: giorni(-10), stato: "fatto", tipoCompenso: "ore", personaId: operatore.id },
  });
  for (const [g, h] of [[-12, 4], [-10, 3.5], [-9, 2]] as const) {
    await db.registrazioneOre.create({
      data: { clienteId: ricci.id, lavoroId: lavRicci.id, personaId: operatore.id, data: giorni(g), ore: h, note: "Manutenzione verde" },
    });
  }
  await db.pagamento.create({
    data: { clienteId: ricci.id, lavoroId: lavRicci.id, origine: "ore", importoAtteso: 9.5 * 28, importoIncassato: 0, stato: "in_attesa", dataEmissione: giorni(-8), dataScadenza: giorni(22) },
  });

  // ---- Cliente 3: Giovanni Bianchi — pagamento in ritardo
  const bianchi = await db.cliente.create({
    data: { nome: "Giovanni", cognome: "Bianchi", inizialiCodice: "GB", telefono: "347 1112233", luogo: "Capoliveri", modalitaPredefinita: "preventivo" },
  });
  const lavBianchi = await db.lavoro.create({
    data: { clienteId: bianchi.id, titolo: "Trattamento fitosanitario", luogo: "Capoliveri", data: giorni(-60), stato: "fatto", tipoCompenso: "preventivo", personaId: titolare.id },
  });
  await db.preventivo.create({
    data: { clienteId: bianchi.id, lavoroId: lavBianchi.id, tipo: "unico", importoTotale: 450, dataEmissione: giorni(-60) },
  });
  await db.pagamento.create({
    data: { clienteId: bianchi.id, lavoroId: lavBianchi.id, origine: "preventivo", importoAtteso: 450, importoIncassato: 0, stato: "in_attesa", dataEmissione: giorni(-60), dataScadenza: giorni(-30) },
  });

  // ---- Cliente 4: Anna Verdi — cliente nuova, lavoro programmato
  const verdi = await db.cliente.create({
    data: { nome: "Anna", cognome: "Verdi", inizialiCodice: "AV", telefono: "366 9988776", luogo: "Rio Marina", modalitaPredefinita: "misto", tariffaOraria: 32 },
  });

  // Lavori programmati (futuri) — per calendario e "oggi"
  await db.lavoro.create({ data: { clienteId: verdi.id, titolo: "Sopralluogo e preventivo", luogo: "Rio Marina", data: giorni(0), ordineNelGiorno: 1, stato: "da_fare", tipoCompenso: "ore", personaId: titolare.id } });
  await db.lavoro.create({ data: { clienteId: ricci.id, titolo: "Taglio erba", luogo: "Portoferraio", data: giorni(0), ordineNelGiorno: 2, stato: "da_fare", tipoCompenso: "ore", personaId: operatore.id } });
  await db.lavoro.create({ data: { clienteId: rossi.id, titolo: "Controllo impianto irrigazione", luogo: "Marina di Campo", data: giorni(2), stato: "da_fare", tipoCompenso: "preventivo", personaId: titolare.id } });
  await db.lavoro.create({ data: { clienteId: bianchi.id, titolo: "Potatura siepe", luogo: "Capoliveri", data: giorni(4), stato: "da_fare", tipoCompenso: "preventivo", personaId: operatore.id } });

  // ---- Spese
  await db.spesa.createMany({
    data: [
      { categoria: "benzina", importo: 60, data: giorni(-5), descrizione: "Pieno furgone" },
      { categoria: "materiali", importo: 35.5, data: giorni(-7), descrizione: "Olio catena, filo decespugliatore" },
      { categoria: "benzina", importo: 55, data: giorni(-20), descrizione: "Pieno furgone" },
      { categoria: "attrezzi", importo: 280, data: giorni(-45), descrizione: "Soffiatore nuovo" },
    ],
  });

  // ---- Officina (attrezzi)
  await db.attrezzo.createMany({
    data: [
      { nome: "Motosega Stihl MS 261", costoAcquisto: 720, dataAcquisto: giorni(-500), stato: "ok" },
      { nome: "Decespugliatore", costoAcquisto: 380, dataAcquisto: giorni(-300), stato: "ok" },
      { nome: "Soffiatore", costoAcquisto: 280, dataAcquisto: giorni(-45), stato: "ok" },
      { nome: "Tagliasiepi", costoAcquisto: 250, dataAcquisto: giorni(-200), stato: "manutenzione" },
    ],
  });

  const n = await db.cliente.count();
  console.log(`Seed completato: ${n} clienti + lavori, preventivi, ore, pagamenti, spese e attrezzi.`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
