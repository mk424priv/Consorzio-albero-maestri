import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Intestazione } from "@/components/Intestazione";
import { Button, Codice, Field, Segmented } from "@/components/ui";
import { assegnaIniziali, inizialiDa } from "@/lib/codice-parlante";
import { oggiISO } from "@/lib/format";
import { nuovoId } from "@/lib/id";
import { useStore } from "@/store/store";

export function NuovoCliente() {
  const navigate = useNavigate();
  const dati = useStore((s) => s.dati);
  const salva = useStore((s) => s.salva);
  const [tipo, setTipo] = useState<"persona" | "azienda">("persona");
  const [form, setForm] = useState({ nome: "", cognome: "", luogo: "", telefono: "", email: "", tariffa: "" });
  const [modo, setModo] = useState<"ore" | "preventivo">("ore");

  const iniziali = form.nome.trim() ? inizialiDa(form.nome, tipo === "azienda" ? form.nome.slice(1) : form.cognome) : "··";
  const valido = form.nome.trim().length > 0;

  const crea = async () => {
    if (!valido) return;
    const id = nuovoId();
    const cognome = tipo === "azienda" ? "" : form.cognome.trim();
    await salva("clienti", {
      id,
      nome: form.nome.trim(),
      cognome: cognome || undefined,
      inizialiCodice: assegnaIniziali(form.nome, tipo === "azienda" ? form.nome.slice(1) : form.cognome, dati.clienti),
      luogo: form.luogo.trim() || undefined,
      telefono: form.telefono.trim() || undefined,
      email: form.email.trim() || undefined,
      tariffaOraria: form.tariffa ? Number(form.tariffa.replace(",", ".")) : null,
      modalitaPredefinita: modo,
      creatoIl: oggiISO(),
      updatedAt: "",
    });
    navigate(`/cliente/${id}`, { replace: true });
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <Intestazione
        titolo="Nuovo cliente"
        azione={
          <Button size="icona" variant="tenue" onClick={() => navigate(-1)} aria-label="Indietro">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        }
      />

      <Segmented
        value={tipo}
        onValueChange={setTipo}
        options={[
          { value: "persona", label: "Persona" },
          { value: "azienda", label: "Azienda" },
        ]}
        layoutId="tipo-cliente"
      />

      {tipo === "persona" ? (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Mario" />
          <Field label="Cognome" value={form.cognome} onChange={(e) => setForm({ ...form, cognome: e.target.value })} placeholder="Rossi" />
        </div>
      ) : (
        <Field label="Ragione sociale" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Verde Vivo s.r.l." />
      )}

      {/* preview codice */}
      <div className="flex flex-col items-center gap-1 py-1">
        <Codice value={`${iniziali}-00-00-00`} grande />
        <p className="font-mono text-xs text-fumo-2">il codice cresce con i lavori</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-mono text-xs uppercase tracking-wider text-fumo-2">Come lavori di solito</label>
        <Segmented
          value={modo}
          onValueChange={setModo}
          options={[
            { value: "ore", label: "A ore" },
            { value: "preventivo", label: "A preventivo" },
          ]}
          layoutId="modo-cliente"
        />
      </div>

      <Field label="Tariffa oraria" value={form.tariffa} onChange={(e) => setForm({ ...form, tariffa: e.target.value })} suffix="€/h" inputMode="decimal" placeholder="0,00" />
      <Field label="Luogo" value={form.luogo} onChange={(e) => setForm({ ...form, luogo: e.target.value })} placeholder="Portoferraio" />
      <Field label="Telefono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} inputMode="tel" />
      <Field label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} inputMode="email" />

      <Button size="lg" onClick={() => void crea()} className="mt-1" disabled={!valido}>
        Salva e apri scheda
      </Button>
    </div>
  );
}
