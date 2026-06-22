"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { testo, numero, data } from "@/lib/form";
import { arrotonda } from "@/lib/format";

// Crea un preventivo e genera automaticamente i pagamenti attesi (PRD §8.1).
export async function creaPreventivo(fd: FormData) {
  const clienteId = testo(fd, "clienteId");
  const importoTotale = numero(fd, "importoTotale");
  const tipo = testo(fd, "tipo") ?? "unico";
  if (!clienteId || importoTotale === null) redirect("/preventivi?errore=1");

  const emissione = data(fd, "dataEmissione") ?? new Date();
  const scadenza = data(fd, "dataScadenza");
  const lavoroId = testo(fd, "lavoroId");

  let importoAcconto: number | null = null;
  let importoSaldo: number | null = null;
  if (tipo === "acconto_saldo") {
    importoAcconto = numero(fd, "importoAcconto") ?? arrotonda(importoTotale! / 2);
    importoSaldo = arrotonda(importoTotale! - importoAcconto);
  }

  const preventivo = await db.preventivo.create({
    data: {
      clienteId: clienteId!,
      lavoroId,
      tipo,
      importoTotale: importoTotale!,
      importoAcconto,
      importoSaldo,
      dataEmissione: emissione,
      note: testo(fd, "note"),
    },
  });

  if (tipo === "acconto_saldo") {
    await db.pagamento.createMany({
      data: [
        { clienteId: clienteId!, lavoroId, preventivoId: preventivo.id, origine: "acconto", importoAtteso: importoAcconto!, stato: "in_attesa", dataEmissione: emissione, dataScadenza: scadenza },
        { clienteId: clienteId!, lavoroId, preventivoId: preventivo.id, origine: "saldo", importoAtteso: importoSaldo!, stato: "in_attesa", dataEmissione: emissione, dataScadenza: scadenza },
      ],
    });
  } else {
    await db.pagamento.create({
      data: { clienteId: clienteId!, lavoroId, preventivoId: preventivo.id, origine: "preventivo", importoAtteso: importoTotale!, stato: "in_attesa", dataEmissione: emissione, dataScadenza: scadenza },
    });
  }

  revalidatePath("/preventivi");
  revalidatePath("/pagamenti");
  revalidatePath(`/clienti/${clienteId}`);
  redirect("/preventivi");
}
