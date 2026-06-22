// Selettore orario "a rotella" stile iPhone: scorri per scegliere ore e
// minuti, con snap e banda centrale evidenziata. Pensato per il cantiere.
import { useEffect, useRef } from "react";

const H = 44; // altezza di ogni voce
const VIS = 5; // voci visibili (dispari → una al centro)
const PAD = ((VIS - 1) / 2) * H;

function Ruota({ valori, value, onChange, format }: { valori: number[]; value: number; onChange: (v: number) => void; format: (n: number) => string }) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const idx = Math.max(0, valori.indexOf(value));

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = idx * H;
    // solo al montaggio: poi comanda lo scroll dell'utente
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onScroll() {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const i = Math.max(0, Math.min(valori.length - 1, Math.round(el.scrollTop / H)));
      el.scrollTo({ top: i * H, behavior: "smooth" });
      if (valori[i] !== value) onChange(valori[i]);
    }, 90);
  }

  return (
    <div ref={ref} onScroll={onScroll} className="no-scrollbar snap-y snap-mandatory overflow-y-scroll" style={{ height: VIS * H, width: 64 }}>
      <div style={{ height: PAD }} />
      {valori.map((n) => (
        <div key={n} className="flex snap-center items-center justify-center font-display text-[1.5rem] font-bold tabular-nums text-ink" style={{ height: H }}>
          {format(n)}
        </div>
      ))}
      <div style={{ height: PAD }} />
    </div>
  );
}

export interface Orario { h: number; m: number }

export function RuotaOrario({ value, onChange, stepMin = 5 }: { value: Orario; onChange: (o: Orario) => void; stepMin?: number }) {
  const ore = Array.from({ length: 24 }, (_, i) => i);
  const minuti = Array.from({ length: Math.ceil(60 / stepMin) }, (_, i) => i * stepMin);
  const due = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="relative overflow-hidden rounded-[16px] border border-line bg-surface">
      <div className="relative flex items-center justify-center gap-1 px-4">
        <Ruota valori={ore} value={value.h} onChange={(h) => onChange({ ...value, h })} format={due} />
        <span className="font-display text-[1.5rem] font-bold text-muted">:</span>
        <Ruota valori={minuti} value={value.m} onChange={(m) => onChange({ ...value, m })} format={due} />
      </div>
      {/* banda di selezione centrale */}
      <div className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 rounded-[12px] bg-brand-50/55 ring-1 ring-brand-200" style={{ height: H }} />
      {/* sfumature sopra/sotto */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-surface to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-surface to-transparent" />
    </div>
  );
}
