"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { testo, numero, data } from "@/lib/form";

export async function creaSpesa(fd: FormData) {
  const importo = numero(fd, "importo");
  if (importo === null) redirect("/spese?errore=1");
  await db.spesa.create({
    data: {
      categoria: testo(fd, "categoria") ?? "altro",
      importo: importo!,
      data: data(fd, "data") ?? new Date(),
      descrizione: testo(fd, "descrizione"),
      clienteId: testo(fd, "clienteId"),
    },
  });
  revalidatePath("/spese");
  revalidatePath("/storico");
  redirect("/spese");
}

export async function eliminaSpesa(fd: FormData) {
  const id = testo(fd, "id");
  if (id) await db.spesa.delete({ where: { id } });
  revalidatePath("/spese");
  redirect("/spese");
}
