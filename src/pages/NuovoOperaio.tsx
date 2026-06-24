import { ArrowLeft, Banknote, HardHat, Phone } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AvatarHero, ContattiMini, HeroMesh, SezioneCard, inputLuce } from "@/components/creazione/Creazione";
import { Button } from "@/components/ui";
import { oggiISO } from "@/lib/format";
import { nuovoId } from "@/lib/id";
import { useStore } from "@/store/store";

export function NuovoOperaio() {
  const navigate = useNavigate();
  const salva = useStore((s) => s.salva);
  const [form, setForm] = useState({ nome: "", tariffa: "", telefono: "" });
  const set = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }));

  const iniziali = form.nome.trim() ? form.nome.trim().slice(0, 2).toUpperCase() : "··";
  const valido = form.nome.trim().length > 0;

  const crea = async () => {
    if (!valido) return;
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
    <div className="flex flex-col pb-40">
      <header className="px-4 pt-4">
        <button type="button" onClick={() => navigate(-1)} aria-label="Indietro" className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-superficie text-fumo shadow-card hover:text-bianco"><ArrowLeft size={18} /></button>
        <HeroMesh tono="blu" eyebrow="Nuovo collaboratore">
          <div className="mt-3 flex items-center gap-4">
            <AvatarHero iniziali={iniziali} />
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="truncate text-xl font-bold">{form.nome.trim() || "Nuovo operaio"}</span>
              <span className="w-fit rounded-pill bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur">collaboratore</span>
            </div>
          </div>
        </HeroMesh>
      </header>

      <div className="flex flex-col gap-4 px-4 pt-5">
        <SezioneCard icon={HardHat} titolo="Identità" tinta="blu">
          <input value={form.nome} onChange={(e) => set({ nome: e.target.value })} placeholder="Nome" className={`${inputLuce} text-lg font-semibold`} autoFocus />
        </SezioneCard>

        {/* Costo orario — pannello diverso */}
        <div className="rounded-bolla p-4 shadow-card" style={{ background: "linear-gradient(155deg, rgba(43,212,212,0.12), rgba(255,255,255,1) 58%)" }}>
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-label text-fumo-2">Costo orario</span>
              <div className="flex items-baseline gap-1.5">
                <input value={form.tariffa} inputMode="decimal" onChange={(e) => set({ tariffa: e.target.value.replace(/[^0-9.,]/g, "") })} placeholder="0" className="w-24 bg-transparent text-4xl font-bold text-bianco placeholder-fumo-2 outline-none" />
                <span className="text-xl font-medium text-fumo-2">€/h</span>
              </div>
            </div>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-verde/14 text-verde"><Banknote size={20} /></span>
          </div>
          <p className="mt-2 text-xs text-fumo-2">Quanto ti costa un'ora del suo lavoro.</p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="px-1 font-mono text-[11px] uppercase tracking-label text-fumo-2">Contatti (facoltativo)</span>
          <ContattiMini campi={[{ key: "tel", icon: Phone, label: "Telefono", value: form.telefono, onValue: (v) => set({ telefono: v }), tinta: "blu", inputMode: "tel" }]} />
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
