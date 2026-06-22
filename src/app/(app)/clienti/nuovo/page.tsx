import Link from "next/link";
import { creaCliente } from "@/actions/clienti";
import ClienteForm from "@/components/ClienteForm";
import { Titolo } from "@/components/ui";

export default function NuovoClientePage() {
  return (
    <div>
      <Titolo
        titolo="Nuovo cliente"
        sottotitolo="Il codice parlante si genera da solo"
        azione={<Link href="/clienti" className="btn">← Clienti</Link>}
      />
      <ClienteForm action={creaCliente} testoBottone="Crea cliente" />
    </div>
  );
}
