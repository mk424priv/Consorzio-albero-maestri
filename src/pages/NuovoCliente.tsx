import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Intestazione } from "@/components/Intestazione";
import { Button, CampoFacolt, Codice, Field } from "@/components/ui";
import { assegnaIniziali, inizialiDa } from "@/lib/codice-parlante";
import { oggiISO } from "@/lib/format";
import { nuovoId } from "@/lib/id";
import { useStore } from "@/store/store";

export function NuovoCliente() {
  const navigate = useNavigate();
  const dati = useStore((s) => s.dati);
  const salva = useStore((s) => s.salva);
  const [form, setForm] = useState({ nome: "", luogo: "", telefono: "", email: "", tariffa: "" });
  const set = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }));

  const iniziali = form.nome.trim() ? inizialiDa(form.nome, "") : "··";
  const valido = form.nome.trim().length > 0;

  const crea = async () => {
    if (!valido) return;
    const id = nuovoId();
    await salva("clienti", {
      id,
      nome: form.nome.trim(),
      cognome: undefined,
      inizialiCodice: assegnaIniziali(form.nome, "", dati.clienti),
      luogo: form.luogo.trim() || undefined,
      telefono: form.telefono.trim() || undefined,
      email: form.email.trim() || undefined,
      tariffaOraria: form.tariffa ? Number(form.tariffa.replace(",", ".")) : null,
      modalitaPredefinita: "ore",
      creatoIl: oggiISO(),
      updatedAt: "",
    });
    navigate(`/cliente/${id}`, { replace: true });
  };

  return (
    <div className="flex flex-col gap-4 px-4 pt-5 pb-10">
      <Intestazione
        titolo="Nuovo cliente"
        azione={
          <Button size="icona" variant="tenue" onClick={() => navigate(-1)} aria-label="Indietro">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        }
      />

      <Field label="Nome o ragione sociale" value={form.nome} onChange={(e) => set({ nome: e.target.value })} placeholder="Mario Rossi · Verde Vivo srl" />
      <Field label="Tariffa oraria" value={form.tariffa} onChange={(e) => set({ tariffa: e.target.value })} suffix="€/h" inputMode="decimal" placeholder="0,00" />

      <div className="flex flex-col items-center gap-1 py-1">
        <Codice value={`${iniziali}-00-00-00`} grande />
        <p className="font-mono text-xs text-fumo-2">il codice cresce con i lavori</p>
      </div>

      <div className="flex flex-col items-start gap-2">
        <span className="font-mono text-[11px] uppercase tracking-label text-fumo-2">Aggiungi (facoltativo)</span>
        <div className="flex flex-col gap-2 self-stretch">
          <CampoFacolt label="Telefono" value={form.telefono} onValue={(v) => set({ telefono: v })} inputMode="tel" />
          <CampoFacolt label="Luogo" value={form.luogo} onValue={(v) => set({ luogo: v })} />
          <CampoFacolt label="Email" value={form.email} onValue={(v) => set({ email: v })} inputMode="email" />
        </div>
      </div>

      <Button size="lg" onClick={() => void crea()} className="mt-1" disabled={!valido}>
        Salva e apri scheda
      </Button>
    </div>
  );
}
