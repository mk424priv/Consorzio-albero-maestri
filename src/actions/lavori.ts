"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { testo, numero, data } from "@/lib/form";

export async function creaLavoro(fd: FormData) {
  const clienteId = testo(fd, "clienteId");
  const titolo = testo(fd, "titolo");
  const quando = data(fd, "data") ?? new Date();
  if (!clienteId || !titolo) redirect("/calendario?errore=1");

  await db.lavoro.create({
    data: {
      clienteId: clienteId!,
      titolo: titolo!,
      descrizione: testo(fd, "descrizione"),
      luogo: testo(fd, "luogo"),
      data: quando,
      stato: testo(fd, "stato") ?? "da_fare",
      tipoCompenso: testo(fd, "tipoCompenso") ?? "preventivo",
      durataPrevistaOre: numero(fd, "durataPrevistaOre"),
      personaId: testo(fd, "personaId"),
    },
  });
  revalidatePath("/calendario");
  revalidatePath(`/clienti/${clienteId}`);
  redirect(testo(fd, "ritorno") ?? "/calendario");
}

export async function cambiaStatoLavoro(fd: FormData) {
  const id = testo(fd, "id");
  const stato = testo(fd, "stato");
  if (id && stato) await db.lavoro.update({ where: { id }, data: { stato } });
  revalidatePath("/calendario");
  const ritorno = testo(fd, "ritorno");
  if (ritorno) redirect(ritorno);
}

export async function eliminaLavoro(fd: FormData) {
  const id = testo(fd, "id");
  if (id) await db.lavoro.delete({ where: { id } });
  revalidatePath("/calendario");
  const ritorno = testo(fd, "ritorno");
  if (ritorno) redirect(ritorno);
}
