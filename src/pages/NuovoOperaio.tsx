import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Intestazione } from "@/components/Intestazione";
import { Button, Field } from "@/components/ui";
import { oggiISO } from "@/lib/format";
import { nuovoId } from "@/lib/id";
import { useStore } from "@/store/store";

export function NuovoOperaio() {
  const navigate = useNavigate();
  const salva = useStore((s) => s.salva);
  const [form, setForm] = useState({ nome: "", tariffa: "", telefono: "" });

  const crea = async () => {
    if (!form.nome.trim()) return;
    const id = nuovoId();
    await salva("operatori", {
      id,
      nome: form.nome.trim(),
      ruolo: "collaboratore",
      tariffaOraria: form.tariffa ? Number(form.tariffa.replace(",", ".")) : 0,
      telefono: form.telefono.trim() || undefined,
      attivo: true,
      creatoIl: oggiISO(),
      updatedAt: "",
    });
    navigate(`/operaio/${id}`, { replace: true });
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <Intestazione
        titolo="Nuovo operaio"
        azione={
          <Button size="icona" variant="tenue" onClick={() => navigate(-1)} aria-label="Indietro">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        }
      />
      <Field label="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Luca" />
      <Field label="Tariffa oraria (costo)" value={form.tariffa} onChange={(e) => setForm({ ...form, tariffa: e.target.value })} suffix="€/h" inputMode="decimal" placeholder="0,00" />
      <Field label="Telefono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} inputMode="tel" />
      <Button size="lg" onClick={() => void crea()} disabled={!form.nome.trim()}>
        Salva e apri scheda
      </Button>
    </div>
  );
}
