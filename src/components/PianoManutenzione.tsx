import { clsx } from "clsx";
import { CalendarCheck, Trash2, Wrench } from "lucide-react";
import { ORDINE_UNITA, UNITA_INTERVALLO } from "@/lib/dominio";
import { dataBreve } from "@/lib/format";
import { giorniAllaScadenza, oggiISO, prossimaScadenza, statoScadenza, type StatoScadenza } from "@/lib/manutenzione";
import { nuovoId } from "@/lib/id";
import type { InterventoManutenzione, UnitaIntervallo } from "@/lib/types";
import { Btn } from "./ui";

interface Props {
  interventi: InterventoManutenzione[];
  onChange: (interventi: InterventoManutenzione[]) => void;
}

const STILE_STATO: Record<StatoScadenza, { testo: string; classe: string }> = {
  scaduto: { testo: "SCADUTO", classe: "text-danger border-danger/40 bg-danger/10" },
  urgente: { testo: "IN SCADENZA", classe: "text-amber border-amber/40 bg-amber/10" },
  ok: { testo: "OK", classe: "text-neon-dim border-neon/30 bg-neon/5" },
};

const formattaGiorni = (giorni: number): string => {
  if (giorni === 0) return "oggi";
  if (giorni < 0) return `in ritardo di ${Math.abs(giorni)}g`;
  return `tra ${giorni}g`;
};

/** Piano di manutenzione: interventi ricorrenti — ogni N giorni/mesi/anni a partire da una data. */
export function PianoManutenzione({ interventi, onChange }: Props) {
  const aggiorna = (id: string, patch: Partial<InterventoManutenzione>) =>
    onChange(interventi.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const aggiungi = () =>
    onChange([
      ...interventi,
      {
        id: nuovoId(),
        titolo: "",
        note: "",
        dataUltimo: oggiISO(),
        intervalloValore: 30,
        intervalloUnita: "giorni",
      },
    ]);

  return (
    <div className="space-y-3">
      {interventi.map((i) => {
        const scadenza = prossimaScadenza(i);
        const giorni = giorniAllaScadenza(scadenza);
        const stato = statoScadenza(giorni);
        const stile = STILE_STATO[stato];
        return (
          <div key={i.id} className="glass space-y-2.5 rounded-xl p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Wrench className="size-4 shrink-0 text-ghost" />
              <input
                value={i.titolo}
                onChange={(e) => aggiorna(i.id, { titolo: e.target.value })}
                placeholder="es. Cambio olio motore"
                className="min-w-32 flex-1 bg-transparent text-sm text-ice outline-none placeholder:text-faint"
              />
              <span className={clsx("rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-wider", stile.classe)}>
                {stile.testo}
              </span>
              <button
                type="button"
                title="Elimina intervento"
                onClick={() => onChange(interventi.filter((x) => x.id !== i.id))}
                className="cursor-pointer rounded-md p-1.5 text-faint transition-colors hover:text-danger"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <label className="flex items-center gap-1.5 text-ghost">
                Ultimo il
                <input
                  type="date"
                  value={i.dataUltimo}
                  onChange={(e) => aggiorna(i.id, { dataUltimo: e.target.value })}
                  className="rounded-md border border-ice/10 bg-void/60 px-2 py-1 text-ice outline-none focus:border-neon/50"
                />
              </label>
              <span className="text-ghost">ogni</span>
              <input
                type="number"
                min={1}
                step="1"
                value={i.intervalloValore}
                onChange={(e) => aggiorna(i.id, { intervalloValore: Math.max(1, Number(e.target.value) || 1) })}
                className="w-14 rounded-md border border-ice/10 bg-void/60 px-2 py-1 text-right text-ice outline-none focus:border-neon/50"
              />
              <select
                value={i.intervalloUnita}
                onChange={(e) => aggiorna(i.id, { intervalloUnita: e.target.value as UnitaIntervallo })}
                className="cursor-pointer rounded-md border border-ice/10 bg-void/60 px-2 py-1 text-ghost outline-none focus:border-neon/50"
              >
                {ORDINE_UNITA.map((u) => (
                  <option key={u} value={u}>{UNITA_INTERVALLO[u].label}</option>
                ))}
              </select>
              <span className="ml-auto text-right text-ghost">
                prossima: <span className="text-ice">{dataBreve(scadenza.toISOString())}</span>{" "}
                <span className={stato === "scaduto" ? "text-danger" : "text-faint"}>
                  ({formattaGiorni(giorni)})
                </span>
              </span>
              <button
                type="button"
                onClick={() => aggiorna(i.id, { dataUltimo: oggiISO() })}
                className="flex cursor-pointer items-center gap-1 rounded-md border border-ice/10 px-2 py-1 text-ghost transition-colors hover:border-neon/50 hover:text-neon"
              >
                <CalendarCheck className="size-3.5" /> Fatto oggi
              </button>
            </div>
          </div>
        );
      })}

      <Btn type="button" variante="neon" onClick={aggiungi}>
        <Wrench className="size-4" /> Aggiungi intervento
      </Btn>
    </div>
  );
}
