"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { testo, numero, data } from "@/lib/form";
import { arrotonda } from "@/lib/format";

export async function registraOre(fd: FormData) {
  const clienteId = testo(fd, "clienteId");
  const ore = numero(fd, "ore");
  if (!clienteId || ore === null) redirect("/ore?errore=1");
  await db.registrazioneOre.create({
    data: {
      clienteId: clienteId!,
      lavoroId: testo(fd, "lavoroId"),
      personaId: testo(fd, "personaId"),
      data: data(fd, "data") ?? new Date(),
      ore: ore!,
      note: testo(fd, "note"),
    },
  });
  revalidatePath("/ore");
  revalidatePath(`/clienti/${clienteId}`);
  redirect("/ore");
}

// Genera il compenso del mese a ore: ore del cliente nel mese × tariffa → pagamento.
export async function generaCompensoMese(fd: FormData) {
  const clienteId = testo(fd, "clienteId");
  const anno = numero(fd, "anno");
  const mese = numero(fd, "mese"); // 1..12
  if (!clienteId || anno === null || mese === null) redirect("/ore?errore=1");

  const cliente = await db.cliente.findUnique({ where: { id: clienteId! } });
  if (!cliente) redirect("/ore?errore=1");
  const tariffa = cliente!.tariffaOraria ?? 0;
  if (tariffa <= 0) redirect("/ore?errore=tariffa");

  const inizio = new Date(anno!, mese! - 1, 1);
  const fine = new Date(anno!, mese!, 1);
  const reg = await db.registrazioneOre.aggregate({
    where: { clienteId: clienteId!, data: { gte: inizio, lt: fine } },
    _sum: { ore: true },
  });
  const oreTot = reg._sum.ore ?? 0;
  if (oreTot <= 0) redirect("/ore?errore=orevuote");

  const importo = arrotonda(oreTot * tariffa);
  await db.pagamento.create({
    data: {
      clienteId: clienteId!,
      origine: "ore",
      importoAtteso: importo,
      stato: "in_attesa",
      dataEmissione: new Date(),
      dataScadenza: new Date(fine.getTime() + 30 * 86_400_000),
      note: `Compenso a ore ${String(mese).padStart(2, "0")}/${anno}: ${oreTot} h × ${tariffa} €/h`,
    },
  });
  revalidatePath("/ore");
  revalidatePath("/pagamenti");
  revalidatePath(`/clienti/${clienteId}`);
  redirect("/pagamenti");
}
