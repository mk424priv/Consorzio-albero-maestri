import NumberFlow from "@number-flow/react";
import { clsx } from "clsx";
import { Check, Link as LinkIcon, Plus, Trash2 } from "lucide-react";
import { CATEGORIE_COSTO, ORDINE_CATEGORIE } from "@/lib/dominio";
import { scostamentoBudget, totaleCosti, totaleSpeso, totaleVoce, totaliPerCategoria } from "@/lib/costi";
import { nuovoId } from "@/lib/id";
import type { CategoriaCosto, VoceCosto } from "@/lib/types";
import { Btn } from "./ui";

const EURO = { style: "currency", currency: "EUR", maximumFractionDigits: 2 } as const;

interface Props {
  voci: VoceCosto[];
  budget: number | null;
  onChange: (voci: VoceCosto[]) => void;
}

/** Calcolatore costi: righe quantità × prezzo, totali live animati, confronto budget. */
export function CalcolatoreCosti({ voci, budget, onChange }: Props) {
  const totale = totaleCosti(voci);
  const speso = totaleSpeso(voci);
  const delta = scostamentoBudget({ budget, costi: voci });
  const perCategoria = totaliPerCategoria(voci);

  const aggiorna = (id: string, patch: Partial<VoceCosto>) =>
    onChange(voci.map((v) => (v.id === id ? { ...v, ...patch } : v)));

  const aggiungi = () =>
    onChange([
      ...voci,
      { id: nuovoId(), descrizione: "", categoria: "materiali", quantita: 1, prezzoUnitario: 0, acquistato: false },
    ]);

  return (
    <div className="space-y-4">
      {/* totali */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-xl p-3">
          <div className="text-[10px] tracking-widest text-ghost">TOTALE STIMATO</div>
          <div className="mt-1 text-xl font-bold text-neon glow">
            <NumberFlow value={totale} format={EURO} locales="it-IT" />
          </div>
        </div>
        <div className="glass rounded-xl p-3">
          <div className="text-[10px] tracking-widest text-ghost">GIÀ SPESO</div>
          <div className="mt-1 text-xl font-bold text-cyan">
            <NumberFlow value={speso} format={EURO} locales="it-IT" />
          </div>
        </div>
        <div className="glass rounded-xl p-3">
          <div className="text-[10px] tracking-widest text-ghost">BUDGET</div>
          {budget == null ? (
            <div className="mt-1 text-xl font-bold text-faint">—</div>
          ) : (
            <div className={clsx("mt-1 text-xl font-bold", delta != null && delta > 0 ? "text-danger" : "text-ice")}>
              <NumberFlow value={budget} format={EURO} locales="it-IT" />
            </div>
          )}
          {delta != null && (
            <div className={clsx("text-[10px]", delta > 0 ? "text-danger" : "text-neon-dim")}>
              {delta > 0 ? "SFORATO DI " : "MARGINE "}
              <NumberFlow value={Math.abs(delta)} format={EURO} locales="it-IT" />
            </div>
          )}
        </div>
      </div>

      {/* ripartizione per categoria */}
      {totale > 0 && (
        <div className="glass space-y-1.5 rounded-xl p-3">
          {ORDINE_CATEGORIE.filter((c) => perCategoria[c]).map((c) => {
            const val = perCategoria[c]!;
            return (
              <div key={c} className="flex items-center gap-2 text-xs">
                <span className="w-24 shrink-0 text-ghost">{CATEGORIE_COSTO[c]}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ice/5">
                  <div
                    className="h-full rounded-full bg-neon/60 transition-all duration-500"
                    style={{ width: `${(val / totale) * 100}%` }}
                  />
                </div>
                <span className="w-20 shrink-0 text-right text-ice">
                  <NumberFlow value={val} format={EURO} locales="it-IT" />
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* righe */}
      <div className="space-y-2">
        {voci.map((v) => (
          <div key={v.id} className="glass rounded-xl p-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                title={v.acquistato ? "Acquistato" : "Da acquistare"}
                onClick={() => aggiorna(v.id, { acquistato: !v.acquistato })}
                className={clsx(
                  "flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md border transition-colors",
                  v.acquistato ? "border-neon/60 bg-neon/15 text-neon" : "border-ice/15 text-transparent hover:border-ice/40",
                )}
              >
                <Check className="size-3.5" />
              </button>
              <input
                value={v.descrizione}
                onChange={(e) => aggiorna(v.id, { descrizione: e.target.value })}
                placeholder="descrizione voce…"
                className="min-w-32 flex-1 bg-transparent text-sm text-ice outline-none placeholder:text-faint"
              />
              <select
                value={v.categoria}
                onChange={(e) => aggiorna(v.id, { categoria: e.target.value as CategoriaCosto })}
                className="cursor-pointer rounded-md border border-ice/10 bg-void/60 px-2 py-1 text-xs text-ghost outline-none focus:border-neon/50"
              >
                {ORDINE_CATEGORIE.map((c) => (
                  <option key={c} value={c}>{CATEGORIE_COSTO[c]}</option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                step="any"
                value={v.quantita}
                onChange={(e) => aggiorna(v.id, { quantita: Number(e.target.value) || 0 })}
                title="Quantità"
                className="w-14 rounded-md border border-ice/10 bg-void/60 px-2 py-1 text-right text-xs text-ice outline-none focus:border-neon/50"
              />
              <span className="text-xs text-faint">×</span>
              <input
                type="number"
                min={0}
                step="any"
                value={v.prezzoUnitario}
                onChange={(e) => aggiorna(v.id, { prezzoUnitario: Number(e.target.value) || 0 })}
                title="Prezzo unitario (€)"
                className="w-20 rounded-md border border-ice/10 bg-void/60 px-2 py-1 text-right text-xs text-ice outline-none focus:border-neon/50"
              />
              <span className="w-20 text-right text-sm font-semibold text-neon-dim">
                <NumberFlow value={totaleVoce(v)} format={EURO} locales="it-IT" />
              </span>
              <button
                type="button"
                title="Link prodotto"
                onClick={() => {
                  const link = window.prompt("Link al prodotto (vuoto per rimuovere):", v.link ?? "");
                  if (link !== null) aggiorna(v.id, { link: link || undefined });
                }}
                className={clsx("cursor-pointer rounded-md p-1.5 transition-colors", v.link ? "text-cyan" : "text-faint hover:text-ghost")}
              >
                <LinkIcon className="size-3.5" />
              </button>
              <button
                type="button"
                title="Elimina voce"
                onClick={() => onChange(voci.filter((x) => x.id !== v.id))}
                className="cursor-pointer rounded-md p-1.5 text-faint transition-colors hover:text-danger"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Btn type="button" variante="neon" onClick={aggiungi}>
        <Plus className="size-4" /> Aggiungi voce di costo
      </Btn>
    </div>
  );
}
