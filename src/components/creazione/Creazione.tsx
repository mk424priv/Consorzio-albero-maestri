import type { LucideIcon } from "lucide-react";
import { Plus, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import { MeshStrip, type MeshTono } from "@/components/world/MeshStrip";

/*
  Kit creazione (tema Luce): sfondo STANDARD chiaro, l'effetto "vivo" sta DENTRO le card.
  Composizione VARIATA: hero (mesh vivo, stile carta-banca) + sezioni con tinte/forme diverse,
  niente card tutte uguali. Pratico, non decorazione fine a se stessa.
*/

export type Tinta = "ambra" | "verde" | "blu" | "viola";

const GRAD: Record<Tinta, string> = {
  ambra: "linear-gradient(155deg, rgba(255,159,10,0.10), rgba(255,255,255,1) 58%)",
  verde: "linear-gradient(155deg, rgba(27,181,116,0.10), rgba(255,255,255,1) 58%)",
  blu: "linear-gradient(155deg, rgba(59,110,245,0.10), rgba(255,255,255,1) 58%)",
  viola: "linear-gradient(155deg, rgba(106,91,216,0.10), rgba(255,255,255,1) 58%)",
};
const ICONA: Record<Tinta, string> = {
  ambra: "bg-attenzione/14 text-attenzione",
  verde: "bg-verde/14 text-verde",
  blu: "bg-blu/14 text-blu",
  viola: "bg-viola/14 text-viola",
};

/** Hero "carta-banca": mesh WebGL vivo come riempimento interno + lucentezza, testo bianco. */
export function HeroMesh({ tono, eyebrow, children }: { tono: MeshTono; eyebrow: string; children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] p-5 shadow-flottante">
      <MeshStrip tono={tono} overlay={false} />
      <div className="absolute inset-0 bg-black/18" />
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/30 mix-blend-overlay blur-3xl" />
      <div className="relative text-white">
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white/75">{eyebrow}</span>
        {children}
      </div>
    </div>
  );
}

export function AvatarHero({ iniziali }: { iniziali: string }) {
  return (
    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/35 bg-white/20 text-xl font-bold text-white backdrop-blur">
      {iniziali}
    </span>
  );
}

/** Sezione-card chiara con riempimento a gradiente interno (tinta per sezione → varietà). */
export function SezioneCard({ icon: Icon, titolo, tinta, children }: { icon: LucideIcon; titolo: string; tinta: Tinta; children: ReactNode }) {
  return (
    <div className="rounded-bolla p-4 shadow-card" style={{ background: GRAD[tinta] }}>
      <div className="mb-3 flex items-center gap-2.5">
        <span className={`grid h-9 w-9 place-items-center rounded-full ${ICONA[tinta]}`}><Icon size={17} /></span>
        <span className="text-[15px] font-semibold">{titolo}</span>
      </div>
      {children}
    </div>
  );
}

export const inputLuce = "w-full rounded-xl bg-superficie-bassa px-3.5 py-2.5 text-bianco placeholder-fumo-2 outline-none transition-colors focus:bg-white";

/** Contatti miniaturizzati su UNA riga (tema chiaro); tap su «+» espande il campo. */
export function ContattiMini({ campi }: { campi: { key: string; icon: LucideIcon; label: string; value: string; onValue: (s: string) => void; tinta: Tinta; inputMode?: "tel" | "email" | "text" }[] }) {
  const [aperti, setAperti] = useState<Set<string>>(() => new Set(campi.filter((c) => c.value).map((c) => c.key)));
  const toggle = (k: string) => setAperti((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex gap-2">
        {campi.map((c) => {
          const on = aperti.has(c.key);
          const Icon = c.icon;
          return (
            <button key={c.key} type="button" onClick={() => toggle(c.key)} aria-label={c.label} className={`flex flex-1 items-center justify-center gap-1.5 rounded-pill py-2.5 shadow-card transition-colors ${on ? ICONA[c.tinta] : "bg-superficie text-fumo"}`}>
              <Icon size={16} /> {on ? <X size={13} /> : <Plus size={13} />}
            </button>
          );
        })}
      </div>
      {campi.filter((c) => aperti.has(c.key)).map((c) => (
        <input key={c.key} autoFocus value={c.value} inputMode={c.inputMode} onChange={(e) => c.onValue(e.target.value)} placeholder={c.label} className={`${inputLuce} shadow-card`} />
      ))}
    </div>
  );
}
