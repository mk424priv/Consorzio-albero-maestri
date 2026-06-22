"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { testo, numero, data } from "@/lib/form";

export async function creaAttrezzo(fd: FormData) {
  const nome = testo(fd, "nome");
  if (!nome) redirect("/officina?errore=1");
  await db.attrezzo.create({
    data: {
      nome: nome!,
      costoAcquisto: numero(fd, "costoAcquisto"),
      dataAcquisto: data(fd, "dataAcquisto"),
      stato: testo(fd, "stato") ?? "ok",
      note: testo(fd, "note"),
    },
  });
  revalidatePath("/officina");
  redirect("/officina");
}

export async function eliminaAttrezzo(fd: FormData) {
  const id = testo(fd, "id");
  if (id) await db.attrezzo.delete({ where: { id } });
  revalidatePath("/officina");
  redirect("/officina");
}
