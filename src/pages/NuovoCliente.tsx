import { ArrowLeft, Banknote, Building2, Clock, Mail, MapPin, Phone, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LabBadge, LabBg, LabCard, LabContatti, LabSegmented, PALETTE, labInput, vetro, vetroOmbra } from "@/components/creazione/LabKit";
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
    <div className="relative flex flex-col pb-40 text-white">
      <LabBg colors={PALETTE.sunset} />

      <header className="px-4 pt-5">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => navigate(-1)} aria-label="Indietro" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white backdrop-blur"><ArrowLeft size={18} /></button>
          <span className="font-semibold drop-shadow">Nuovo cliente</span>
          <span className="w-9" />
        </div>
        <div className={`mt-5 flex items-center gap-4 ${vetro} p-5`} style={vetroOmbra}>
          <LabBadge iniziali={iniziali} />
          <div className="flex min-w-0 flex-col gap-2">
            <span className="truncate text-xl font-bold">{nomeMostrato || "Nuovo cliente"}</span>
            <span className="w-fit rounded-pill border border-white/25 bg-white/15 px-3 py-1 font-mono text-sm tracking-wider text-white">{iniziali}-00-00-00</span>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-4 px-4 pt-5">
        <LabCard icon={tipo === "azienda" ? Building2 : User} titolo="Chi è" accent="#ff7a3a">
          <LabSegmented
            value={tipo}
            onChange={setTipo}
            options={[
              { value: "persona", label: <span className="flex items-center justify-center gap-1.5"><User size={14} /> Persona</span> },
              { value: "azienda", label: <span className="flex items-center justify-center gap-1.5"><Building2 size={14} /> Azienda</span> },
            ]}
          />
          <input value={form.nome} onChange={(e) => set({ nome: e.target.value })} placeholder={tipo === "azienda" ? "Ragione sociale" : "Nome"} className={`${labInput} mt-3 text-lg font-semibold`} />
          {tipo === "persona" && <input value={form.cognome} onChange={(e) => set({ cognome: e.target.value })} placeholder="Cognome (facoltativo)" className={`${labInput} mt-2`} />}
        </LabCard>

        <LabCard icon={Banknote} titolo="Tariffa & modalità" accent="#1bb574">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3.5 py-2">
            <input value={form.tariffa} inputMode="decimal" onChange={(e) => set({ tariffa: e.target.value.replace(/[^0-9.,]/g, "") })} placeholder="0" className="w-24 bg-transparent text-3xl font-bold text-white placeholder-white/40 outline-none" />
            <span className="text-lg font-medium text-white/60">€/h</span>
          </div>
          <div className="mt-3">
            <LabSegmented
              value={modo}
              onChange={setModo}
              options={[
                { value: "ore", label: <span className="flex items-center justify-center gap-1.5"><Clock size={14} /> A ore</span> },
                { value: "preventivo", label: "A preventivo" },
              ]}
            />
          </div>
        </LabCard>

        <div className="flex flex-col gap-2">
          <span className="px-1 font-mono text-[11px] uppercase tracking-[0.05em] text-white/55">Contatti (facoltativo)</span>
          <LabContatti
            campi={[
              { key: "tel", icon: Phone, label: "Telefono", value: form.telefono, onValue: (v) => set({ telefono: v }), inputMode: "tel" },
              { key: "luo", icon: MapPin, label: "Luogo", value: form.luogo, onValue: (v) => set({ luogo: v }) },
              { key: "ema", icon: Mail, label: "Email", value: form.email, onValue: (v) => set({ email: v }), inputMode: "email" },
            ]}
          />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30">
        <div className="mx-auto flex max-w-md px-4">
          <button type="button" onClick={() => void crea()} disabled={!valido} className="w-full rounded-pill bg-white py-4 text-base font-bold text-[#16181d] shadow-[0_12px_36px_-8px_rgba(255,255,255,0.5)] transition-transform active:scale-[0.98] disabled:opacity-40">
            Salva e apri scheda
          </button>
        </div>
      </div>
    </div>
  );
}
