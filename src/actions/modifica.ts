"use server";

// Aggiornamenti inline dalle tabelle: modificano un solo record e fanno
// revalidare le pagine (i dati derivati — codice parlante, totali, storico,
// cruscotto — si ricalcolano da soli alla rilettura). Nessun redirect.

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { testo, numero, data } from "@/lib/form";

function ovunque() {
  for (const p of ["/", "/clienti", "/preventivi", "/ore", "/pagamenti", "/storico", "/spese", "/officina", "/calendario"]) {
    revalidatePath(p);
  }
}

export async function modificaCliente(fd: FormData) {
  const id = testo(fd, "id");
  if (!id) return;
  await db.cliente.update({
    where: { id },
    data: {
      nome: testo(fd, "nome") ?? undefined,
      cognome: testo(fd, "cognome") ?? undefined,
      luogo: fd.has("luogo") ? testo(fd, "luogo") : undefined,
      telefono: fd.has("telefono") ? testo(fd, "telefono") : undefined,
      email: fd.has("email") ? testo(fd, "email") : undefined,
      tariffaOraria: fd.has("tariffaOraria") ? numero(fd, "tariffaOraria") : undefined,
      modalitaPredefinita: testo(fd, "modalitaPredefinita") ?? undefined,
      note: fd.has("note") ? testo(fd, "note") : undefined,
    },
  });
  revalidatePath(`/clienti/${id}`);
  ovunque();
}

export async function modificaPreventivo(fd: FormData) {
  const id = testo(fd, "id");
  if (!id) return;
  await db.preventivo.update({
    where: { id },
    data: {
      dataEmissione: data(fd, "dataEmissione") ?? undefined,
      tipo: testo(fd, "tipo") ?? undefined,
      importoTotale: numero(fd, "importoTotale") ?? undefined,
      note: fd.has("note") ? testo(fd, "note") : undefined,
    },
  });
  ovunque();
}

export async function modificaPagamento(fd: FormData) {
  const id = testo(fd, "id");
  if (!id) return;
  const attuale = await db.pagamento.findUnique({ where: { id } });
  if (!attuale) return;

  const importoAtteso = numero(fd, "importoAtteso") ?? attuale.importoAtteso;
  const importoIncassato = numero(fd, "importoIncassato") ?? attuale.importoIncassato;
  const dataScadenza = fd.has("dataScadenza") ? data(fd, "dataScadenza") : attuale.dataScadenza;
  const saldato = importoIncassato >= importoAtteso - 0.005 && importoAtteso > 0;
  const inRitardo = !saldato && dataScadenza && dataScadenza < new Date();

  await db.pagamento.update({
    where: { id },
    data: {
      origine: testo(fd, "origine") ?? undefined,
      importoAtteso,
      importoIncassato,
      dataEmissione: data(fd, "dataEmissione") ?? undefined,
      dataScadenza,
      stato: saldato ? "pagato" : inRitardo ? "in_ritardo" : "in_attesa",
      dataIncasso: saldato ? (attuale.dataIncasso ?? new Date()) : null,
      note: fd.has("note") ? testo(fd, "note") : undefined,
    },
  });
  revalidatePath(`/clienti/${attuale.clienteId}`);
  ovunque();
}

export async function modificaSpesa(fd: FormData) {
  const id = testo(fd, "id");
  if (!id) return;
  await db.spesa.update({
    where: { id },
    data: {
      categoria: testo(fd, "categoria") ?? undefined,
      importo: numero(fd, "importo") ?? undefined,
      data: data(fd, "data") ?? undefined,
      descrizione: fd.has("descrizione") ? testo(fd, "descrizione") : undefined,
    },
  });
  ovunque();
}

export async function modificaAttrezzo(fd: FormData) {
  const id = testo(fd, "id");
  if (!id) return;
  await db.attrezzo.update({
    where: { id },
    data: {
      nome: testo(fd, "nome") ?? undefined,
      costoAcquisto: fd.has("costoAcquisto") ? numero(fd, "costoAcquisto") : undefined,
      dataAcquisto: fd.has("dataAcquisto") ? data(fd, "dataAcquisto") : undefined,
      stato: testo(fd, "stato") ?? undefined,
    },
  });
  revalidatePath("/officina");
}

export async function modificaLavoro(fd: FormData) {
  const id = testo(fd, "id");
  if (!id) return;
  await db.lavoro.update({
    where: { id },
    data: {
      titolo: testo(fd, "titolo") ?? undefined,
      data: data(fd, "data") ?? undefined,
      stato: testo(fd, "stato") ?? undefined,
      tipoCompenso: testo(fd, "tipoCompenso") ?? undefined,
      luogo: fd.has("luogo") ? testo(fd, "luogo") : undefined,
    },
  });
  revalidatePath("/calendario");
  ovunque();
}

export async function modificaOre(fd: FormData) {
  const id = testo(fd, "id");
  if (!id) return;
  const reg = await db.registrazioneOre.update({
    where: { id },
    data: {
      data: data(fd, "data") ?? undefined,
      ore: numero(fd, "ore") ?? undefined,
      note: fd.has("note") ? testo(fd, "note") : undefined,
    },
  });
  revalidatePath(`/clienti/${reg.clienteId}`);
  revalidatePath("/ore");
}
