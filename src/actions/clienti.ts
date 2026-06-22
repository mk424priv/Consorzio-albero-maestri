"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { assegnaIniziali } from "@/lib/codice-parlante";

function testo(fd: FormData, k: string): string | null {
  const v = fd.get(k);
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}
function numero(fd: FormData, k: string): number | null {
  const s = testo(fd, k);
  if (s === null) return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export async function creaCliente(fd: FormData) {
  const nome = testo(fd, "nome");
  const cognome = testo(fd, "cognome");
  if (!nome || !cognome) redirect("/clienti/nuovo?errore=1");

  const inizialiCodice = await assegnaIniziali(nome, cognome);
  const cliente = await db.cliente.create({
    data: {
      nome,
      cognome,
      inizialiCodice,
      telefono: testo(fd, "telefono"),
      email: testo(fd, "email"),
      luogo: testo(fd, "luogo"),
      tariffaOraria: numero(fd, "tariffaOraria"),
      modalitaPredefinita: testo(fd, "modalitaPredefinita") ?? "preventivo",
      note: testo(fd, "note"),
    },
  });
  revalidatePath("/clienti");
  redirect(`/clienti/${cliente.id}`);
}

export async function aggiornaCliente(fd: FormData) {
  const id = testo(fd, "id");
  if (!id) redirect("/clienti");
  await db.cliente.update({
    where: { id: id! },
    data: {
      nome: testo(fd, "nome") ?? undefined,
      cognome: testo(fd, "cognome") ?? undefined,
      telefono: testo(fd, "telefono"),
      email: testo(fd, "email"),
      luogo: testo(fd, "luogo"),
      tariffaOraria: numero(fd, "tariffaOraria"),
      modalitaPredefinita: testo(fd, "modalitaPredefinita") ?? undefined,
      note: testo(fd, "note"),
    },
  });
  revalidatePath(`/clienti/${id}`);
  revalidatePath("/clienti");
  redirect(`/clienti/${id}`);
}

export async function eliminaCliente(fd: FormData) {
  const id = testo(fd, "id");
  if (id) await db.cliente.delete({ where: { id } });
  revalidatePath("/clienti");
  redirect("/clienti");
}
