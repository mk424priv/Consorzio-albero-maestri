import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { aggiornaCliente } from "@/actions/clienti";
import ClienteForm from "@/components/ClienteForm";
import { Titolo } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ModificaCliente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cliente = await db.cliente.findUnique({ where: { id } });
  if (!cliente) notFound();

  return (
    <div>
      <Titolo
        titolo="Modifica cliente"
        azione={<Link href={`/clienti/${id}`} className="btn">← Annulla</Link>}
      />
      <ClienteForm action={aggiornaCliente} cliente={cliente} testoBottone="Salva modifiche" />
    </div>
  );
}
