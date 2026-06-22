"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { testo, numero, data } from "@/lib/form";

// Registra un incasso (parziale o totale) e aggiorna lo stato.
export async function registraIncasso(fd: FormData) {
  const id = testo(fd, "id");
  if (!id) redirect("/pagamenti");
  const pag = await db.pagamento.findUnique({ where: { id } });
  if (!pag) redirect("/pagamenti");

  const importo = numero(fd, "importo") ?? pag!.importoAtteso - pag!.importoIncassato;
  const nuovoIncassato = pag!.importoIncassato + importo;
  const saldato = nuovoIncassato >= pag!.importoAtteso - 0.005;

  await db.pagamento.update({
    where: { id },
    data: {
      importoIncassato: nuovoIncassato,
      stato: saldato ? "pagato" : pag!.stato === "in_ritardo" ? "in_ritardo" : "in_attesa",
      dataIncasso: saldato ? (data(fd, "dataIncasso") ?? new Date()) : pag!.dataIncasso,
    },
  });
  revalidatePath("/pagamenti");
  revalidatePath("/storico");
  revalidatePath(`/clienti/${pag!.clienteId}`);
  redirect(testo(fd, "ritorno") ?? "/pagamenti");
}

export async function creaPagamento(fd: FormData) {
  const clienteId = testo(fd, "clienteId");
  const importoAtteso = numero(fd, "importoAtteso");
  if (!clienteId || importoAtteso === null) redirect("/pagamenti?errore=1");
  await db.pagamento.create({
    data: {
      clienteId: clienteId!,
      lavoroId: testo(fd, "lavoroId"),
      origine: "manuale",
      importoAtteso: importoAtteso!,
      stato: "in_attesa",
      dataEmissione: data(fd, "dataEmissione") ?? new Date(),
      dataScadenza: data(fd, "dataScadenza"),
      note: testo(fd, "note"),
    },
  });
  revalidatePath("/pagamenti");
  revalidatePath(`/clienti/${clienteId}`);
  redirect("/pagamenti");
}

export async function eliminaPagamento(fd: FormData) {
  const id = testo(fd, "id");
  if (id) await db.pagamento.delete({ where: { id } });
  revalidatePath("/pagamenti");
  redirect("/pagamenti");
}
