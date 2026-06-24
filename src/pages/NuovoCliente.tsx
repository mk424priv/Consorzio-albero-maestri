import { ArrowLeft, Banknote, Building2, Clock, Mail, MapPin, Phone, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AvatarHero, ContattiMini, HeroMesh, SezioneCard, inputLuce } from "@/components/creazione/Creazione";
import { Button, Segmented } from "@/components/ui";
import { assegnaIniziali, inizialiDa } from "@/lib/codice-parlante";
import { oggiISO } from "@/lib/format";
import { nuovoId } from "@/lib/id";
import { useStore } from "@/store/store";

export function NuovoCliente() {
  const navigate = useNavigate();
  const dati = useStore((s) => s.dati);
  const salva = useStore((s) => s.salva);
  const [tipo, setTipo] = useState<"persona" | "azienda">("persona");
  const [modo, setModo] = useState<"ore" | "preventivo">("ore");
  const [form, setForm] = useState({ nome: "", cognome: "", tariffa: "", luogo: "", telefono: "", email: "" });
  const set = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }));

  const cognomePer = tipo === "azienda" ? form.nome.slice(1) : form.cognome;
  const iniziali = form.nome.trim() ? inizialiDa(form.nome, cognomePer) : "··";
  const nomeMostrato = `${form.nome}${tipo === "persona" && form.cognome ? " " + form.cognome : ""}`.trim();
  const valido = form.nome.trim().length > 0;

  const crea = async () => {
    if (!valido) return;
    const id = nuovoId();
    await salva("clienti", {
      id,
      nome: form.nome.trim(),
      cognome: tipo === "persona" && form.cognome.trim() ? form.cognome.trim() : undefined,
      inizialiCodice: assegnaIniziali(form.nome, cognomePer, dati.clienti),
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
    <div className="flex flex-col pb-40">
      <header className="px-4 pt-4">
        <button type="button" onClick={() => navigate(-1)} aria-label="Indietro" className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-superficie text-fumo shadow-card hover:text-bianco"><ArrowLeft size={18} /></button>
        <HeroMesh tono="terra" eyebrow="Nuova scheda cliente">
          <div className="mt-3 flex items-center gap-4">
            <AvatarHero iniziali={iniziali} />
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="truncate text-xl font-bold">{nomeMostrato || "Nuovo cliente"}</span>
              <span className="w-fit rounded-pill bg-white/20 px-3 py-1 font-mono text-sm tracking-wider backdrop-blur">{iniziali}-00-00-00</span>
            </div>
            {form.tariffa && <span className="ml-auto self-start rounded-pill bg-white/20 px-2.5 py-1 text-xs font-semibold">{form.tariffa} €/h</span>}
          </div>
        </HeroMesh>
      </header>

      <div className="flex flex-col gap-4 px-4 pt-5">
        <SezioneCard icon={tipo === "azienda" ? Building2 : User} titolo="Identità" tinta="ambra">
          <Segmented
            value={tipo}
            onValueChange={setTipo}
            options={[
              { value: "persona", label: <span className="flex items-center justify-center gap-1.5"><User size={14} /> Persona</span> },
              { value: "azienda", label: <span className="flex items-center justify-center gap-1.5"><Building2 size={14} /> Azienda</span> },
            ]}
            layoutId="tipo-cliente"
            className="w-full"
          />
          <input value={form.nome} onChange={(e) => set({ nome: e.target.value })} placeholder={tipo === "azienda" ? "Ragione sociale" : "Nome"} className={`${inputLuce} mt-3 text-lg font-semibold`} />
          {tipo === "persona" && <input value={form.cognome} onChange={(e) => set({ cognome: e.target.value })} placeholder="Cognome (facoltativo)" className={`${inputLuce} mt-2`} />}
        </SezioneCard>

        {/* Tariffa — pannello diverso: numero grande, icona a destra */}
        <div className="rounded-bolla p-4 shadow-card" style={{ background: "linear-gradient(155deg, rgba(27,181,116,0.10), rgba(255,255,255,1) 58%)" }}>
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-label text-fumo-2">Tariffa oraria</span>
              <div className="flex items-baseline gap-1.5">
                <input value={form.tariffa} inputMode="decimal" onChange={(e) => set({ tariffa: e.target.value.replace(/[^0-9.,]/g, "") })} placeholder="0" className="w-24 bg-transparent text-4xl font-bold text-bianco placeholder-fumo-2 outline-none" />
                <span className="text-xl font-medium text-fumo-2">€/h</span>
              </div>
            </div>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-verde/14 text-verde"><Banknote size={20} /></span>
          </div>
          <div className="mt-3">
            <Segmented
              value={modo}
              onValueChange={setModo}
              options={[
                { value: "ore", label: <span className="flex items-center justify-center gap-1.5"><Clock size={14} /> A ore</span> },
                { value: "preventivo", label: "A preventivo" },
              ]}
              layoutId="modo-cliente-nuovo"
              className="w-full"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="px-1 font-mono text-[11px] uppercase tracking-label text-fumo-2">Contatti (facoltativo)</span>
          <ContattiMini
            campi={[
              { key: "tel", icon: Phone, label: "Telefono", value: form.telefono, onValue: (v) => set({ telefono: v }), tinta: "blu", inputMode: "tel" },
              { key: "luo", icon: MapPin, label: "Luogo", value: form.luogo, onValue: (v) => set({ luogo: v }), tinta: "verde" },
              { key: "ema", icon: Mail, label: "Email", value: form.email, onValue: (v) => set({ email: v }), tinta: "viola", inputMode: "email" },
            ]}
          />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30">
        <div className="mx-auto flex max-w-md px-4">
          <Button size="lg" className="w-full shadow-flottante" onClick={() => void crea()} disabled={!valido}>Salva e apri scheda</Button>
        </div>
      </div>
    </div>
  );
}
