import { ArrowLeft, Banknote, Building2, Clock, Mail, MapPin, Phone, Plus, User, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MeshStrip } from "@/components/world/MeshStrip";
import { Avatar, Button, Codice, Segmented } from "@/components/ui";
import { assegnaIniziali, inizialiDa } from "@/lib/codice-parlante";
import { oggiISO } from "@/lib/format";
import { nuovoId } from "@/lib/id";
import { useStore } from "@/store/store";

type Tinta = "blu" | "verde" | "ambra" | "viola";
const TINTA: Record<Tinta, string> = {
  blu: "bg-blu/12 text-blu",
  verde: "bg-verde/12 text-verde",
  ambra: "bg-attenzione/12 text-attenzione",
  viola: "bg-viola/12 text-viola",
};

function FieldCard({ icon: Icon, titolo, tinta, children }: { icon: LucideIcon; titolo: string; tinta: Tinta; children: ReactNode }) {
  return (
    <div className="rounded-bolla bg-superficie p-4 shadow-card">
      <div className="mb-3 flex items-center gap-2.5">
        <span className={`grid h-9 w-9 place-items-center rounded-full ${TINTA[tinta]}`}><Icon size={17} /></span>
        <span className="text-[15px] font-semibold">{titolo}</span>
      </div>
      {children}
    </div>
  );
}

function ContattoRow({ icon: Icon, label, value, onValue, tinta, inputMode }: { icon: LucideIcon; label: string; value: string; onValue: (s: string) => void; tinta: Tinta; inputMode?: "tel" | "email" | "text" }) {
  const [open, setOpen] = useState(!!value);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center gap-3 rounded-vetro bg-superficie p-3 text-left shadow-card transition-transform active:scale-[0.99]">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${TINTA[tinta]}`}><Icon size={16} /></span>
        <span className="flex-1 text-sm font-medium text-fumo">{label}</span>
        <Plus size={16} className="text-fumo-2" />
      </button>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-vetro bg-superficie p-3 shadow-card">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${TINTA[tinta]}`}><Icon size={16} /></span>
      <input autoFocus value={value} inputMode={inputMode} onChange={(e) => onValue(e.target.value)} placeholder={label} className="flex-1 bg-transparent text-sm font-medium text-bianco placeholder-fumo-2 focus:outline-none" />
      <button type="button" aria-label={`Rimuovi ${label}`} onClick={() => { onValue(""); setOpen(false); }} className="text-fumo-2 hover:text-bianco"><X size={16} /></button>
    </div>
  );
}

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
      {/* HERO presentazionale: fascia ambra + business-card live */}
      <header className="relative">
        <div className="absolute inset-x-0 top-0 h-44 overflow-hidden rounded-b-[2.5rem]" style={{ background: "linear-gradient(135deg, #ff8a3a, #ef5b52)" }}>
          <MeshStrip tono="terra" overlay={false} />
          <div className="absolute inset-0 bg-black/10" />
        </div>
        <div className="relative px-4 pt-5">
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => navigate(-1)} aria-label="Indietro" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur"><ArrowLeft size={18} /></button>
            <span className="font-semibold text-white drop-shadow">Nuovo cliente</span>
            <span className="w-9" />
          </div>
          {/* business card live */}
          <div className="mt-5 flex items-center gap-4 rounded-bolla bg-superficie p-5 shadow-flottante">
            <Avatar iniziali={iniziali} tono={valido ? "rosso" : "neutro"} size={56} />
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="truncate text-lg font-bold">{nomeMostrato || "Nuovo cliente"}</span>
              <Codice value={`${iniziali}-00-00-00`} />
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-4 px-4 pt-5">
        <FieldCard icon={tipo === "azienda" ? Building2 : User} titolo="Chi è" tinta="ambra">
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
          <input value={form.nome} onChange={(e) => set({ nome: e.target.value })} placeholder={tipo === "azienda" ? "Ragione sociale" : "Nome"} className="mt-3 w-full bg-transparent text-xl font-bold text-bianco placeholder-fumo-2 focus:outline-none" />
          {tipo === "persona" && (
            <input value={form.cognome} onChange={(e) => set({ cognome: e.target.value })} placeholder="Cognome (facoltativo)" className="mt-1 w-full bg-transparent text-base font-medium text-fumo placeholder-fumo-2 focus:outline-none" />
          )}
        </FieldCard>

        <FieldCard icon={Banknote} titolo="Tariffa & modalità" tinta="verde">
          <div className="flex items-baseline gap-2">
            <input value={form.tariffa} inputMode="decimal" onChange={(e) => set({ tariffa: e.target.value.replace(/[^0-9.,]/g, "") })} placeholder="0" className="w-24 bg-transparent text-3xl font-bold text-bianco placeholder-fumo-2 focus:outline-none" />
            <span className="text-lg font-medium text-fumo-2">€/h</span>
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
        </FieldCard>

        <div className="flex flex-col gap-2">
          <span className="px-1 font-mono text-[11px] uppercase tracking-label text-fumo-2">Contatti (facoltativo)</span>
          <ContattoRow icon={Phone} label="Telefono" value={form.telefono} onValue={(v) => set({ telefono: v })} tinta="blu" inputMode="tel" />
          <ContattoRow icon={MapPin} label="Luogo" value={form.luogo} onValue={(v) => set({ luogo: v })} tinta="verde" />
          <ContattoRow icon={Mail} label="Email" value={form.email} onValue={(v) => set({ email: v })} tinta="viola" inputMode="email" />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30">
        <div className="mx-auto flex max-w-md px-4">
          <Button size="lg" className="w-full shadow-flottante" onClick={() => void crea()} disabled={!valido}>
            Salva e apri scheda
          </Button>
        </div>
      </div>
    </div>
  );
}
