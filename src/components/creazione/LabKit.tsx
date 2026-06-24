import type { LucideIcon } from "lucide-react";
import { Plus, X } from "lucide-react";
import { type CSSProperties, type ReactNode, useState } from "react";
import { MeshGradient } from "@/components/world/MeshGradient";

/*
  Kit «Lab»: schermi di creazione vividi e creativi (stile crypto-app).
  Sfondo WebGL saturo che scorre + card a vetro smerigliato (glassmorphism) con filo di
  luce sul bordo. Gerarchia di toni: sfondo vivo → vetro → input → accento neon → testo bianco.
*/

export const PALETTE = {
  sunset: ["#ff8a3a", "#ef5b52", "#c2348f", "#ff8a3a"] as [string, string, string, string], // cliente
  elettrico: ["#3b6ef5", "#2bd4d4", "#6a5bd8", "#3b6ef5"] as [string, string, string, string], // operaio
};

export const vetro = "rounded-bolla border border-white/15 bg-white/10 backdrop-blur-2xl";
export const vetroOmbra: CSSProperties = { boxShadow: "inset 0 1px 0 rgba(255,255,255,0.28), 0 16px 48px -16px rgba(0,0,0,0.55)" };
export const labInput = "w-full rounded-xl border border-white/10 bg-white/10 px-3.5 py-2.5 text-white placeholder-white/45 outline-none transition-colors focus:bg-white/20 focus:border-white/30";

export function LabBg({ colors }: { colors: [string, string, string, string] }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <MeshGradient colors={colors} />
      <div className="absolute inset-0 bg-black/25" />
    </div>
  );
}

export function LabCard({ icon: Icon, titolo, accent, children }: { icon: LucideIcon; titolo: string; accent: string; children: ReactNode }) {
  return (
    <div className={`${vetro} p-4`} style={vetroOmbra}>
      <div className="mb-3 flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-full text-white" style={{ background: accent, boxShadow: `0 6px 18px -4px ${accent}` }}>
          <Icon size={17} />
        </span>
        <span className="text-[15px] font-semibold text-white">{titolo}</span>
      </div>
      {children}
    </div>
  );
}

export function LabSegmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[] }) {
  return (
    <div className="flex rounded-pill bg-black/25 p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} type="button" onClick={() => onChange(o.value)} className={`flex-1 rounded-pill py-2 text-center text-sm font-medium transition-colors ${active ? "bg-white text-[#16181d] shadow" : "text-white/70 hover:text-white"}`}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Contatti miniaturizzati su UNA riga: tap su «+» espande il campo sotto. */
export function LabContatti({ campi }: { campi: { key: string; icon: LucideIcon; label: string; value: string; onValue: (s: string) => void; inputMode?: "tel" | "email" | "text" }[] }) {
  const [aperti, setAperti] = useState<Set<string>>(() => new Set(campi.filter((c) => c.value).map((c) => c.key)));
  const toggle = (k: string) => setAperti((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex gap-2">
        {campi.map((c) => {
          const on = aperti.has(c.key);
          const Icon = c.icon;
          return (
            <button key={c.key} type="button" onClick={() => toggle(c.key)} aria-label={c.label} className={`flex flex-1 items-center justify-center gap-1.5 rounded-pill border py-2.5 transition-colors ${on ? "border-white/40 bg-white/20 text-white" : "border-white/15 bg-white/[0.07] text-white/70"}`}>
              <Icon size={16} /> {on ? <X size={13} /> : <Plus size={13} />}
            </button>
          );
        })}
      </div>
      {campi.filter((c) => aperti.has(c.key)).map((c) => (
        <input key={c.key} autoFocus value={c.value} inputMode={c.inputMode} onChange={(e) => c.onValue(e.target.value)} placeholder={c.label} className={labInput} />
      ))}
    </div>
  );
}

/** Avatar/codice «vetro» per l'header live. */
export function LabBadge({ iniziali }: { iniziali: string }) {
  return (
    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-white/30 bg-white/20 text-xl font-bold text-white backdrop-blur">
      {iniziali}
    </span>
  );
}
