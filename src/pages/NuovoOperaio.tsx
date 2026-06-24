import { ArrowLeft, Banknote, HardHat, Phone } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LabBadge, LabBg, LabCard, LabContatti, PALETTE, labInput, vetro, vetroOmbra } from "@/components/creazione/LabKit";
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
    <div className="relative flex flex-col pb-40 text-white">
      <LabBg colors={PALETTE.elettrico} />

      <header className="px-4 pt-5">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => navigate(-1)} aria-label="Indietro" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white backdrop-blur"><ArrowLeft size={18} /></button>
          <span className="font-semibold drop-shadow">Nuovo operaio</span>
          <span className="w-9" />
        </div>
        <div className={`mt-5 flex items-center gap-4 ${vetro} p-5`} style={vetroOmbra}>
          <LabBadge iniziali={iniziali} />
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="truncate text-xl font-bold">{form.nome.trim() || "Nuovo operaio"}</span>
            <span className="w-fit rounded-pill border border-white/25 bg-white/15 px-3 py-1 text-xs font-medium text-white/90">collaboratore</span>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-4 px-4 pt-5">
        <LabCard icon={HardHat} titolo="Chi è" accent="#3b6ef5">
          <input value={form.nome} onChange={(e) => set({ nome: e.target.value })} placeholder="Nome" className={`${labInput} text-lg font-semibold`} autoFocus />
        </LabCard>

        <LabCard icon={Banknote} titolo="Costo orario" accent="#2bd4d4">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3.5 py-2">
            <input value={form.tariffa} inputMode="decimal" onChange={(e) => set({ tariffa: e.target.value.replace(/[^0-9.,]/g, "") })} placeholder="0" className="w-24 bg-transparent text-3xl font-bold text-white placeholder-white/40 outline-none" />
            <span className="text-lg font-medium text-white/60">€/h</span>
          </div>
          <p className="mt-2 text-xs text-white/55">Quanto ti costa un'ora del suo lavoro.</p>
        </LabCard>

        <div className="flex flex-col gap-2">
          <span className="px-1 font-mono text-[11px] uppercase tracking-[0.05em] text-white/55">Contatti (facoltativo)</span>
          <LabContatti campi={[{ key: "tel", icon: Phone, label: "Telefono", value: form.telefono, onValue: (v) => set({ telefono: v }), inputMode: "tel" }]} />
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
