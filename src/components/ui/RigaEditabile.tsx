// Riga di tabella con modifica inline (matita → campi → ✓/✕).
import { useState, type ReactNode } from "react";
import { Check, Pencil, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { fieldCls } from "./fields";

type Opzione = { v: string; l: string };

export type Cella =
  | { tipo: "statico"; nodo: ReactNode; classe?: string }
  | { tipo: "testo" | "numero" | "data"; nome: string; valore: string; display: ReactNode; classe?: string; step?: string; placeholder?: string }
  | { tipo: "select"; nome: string; valore: string; opzioni: Opzione[]; display: ReactNode; classe?: string };

export function RigaEditabile({
  celle,
  onSave,
  azioni,
}: {
  celle: Cella[];
  onSave: (valori: Record<string, string>) => void;
  azioni?: ReactNode; // azioni extra (es. elimina) mostrate a riposo
}) {
  const iniz = () =>
    Object.fromEntries(celle.filter((c) => c.tipo !== "statico").map((c) => [c.nome, c.valore]));
  const [edit, setEdit] = useState(false);
  const [vals, setVals] = useState<Record<string, string>>(iniz);

  const cellaInput = "h-9 !text-sm";

  return (
    <tr className={cn("group border-b border-line transition-colors last:border-b-0", edit ? "bg-brand-50/60" : "hover:bg-brand-50/40")}>
      <td className="w-10 px-2 py-2">
        {edit ? (
          <div className="flex gap-1">
            <button onClick={() => { onSave(vals); setEdit(false); }} aria-label="Salva" className="grid h-7 w-7 place-items-center rounded-[9px] bg-success-soft text-success transition hover:brightness-95">
              <Check size={15} />
            </button>
            <button onClick={() => { setVals(iniz()); setEdit(false); }} aria-label="Annulla" className="grid h-7 w-7 place-items-center rounded-[9px] bg-[#eef1ea] text-muted transition hover:brightness-95">
              <X size={15} />
            </button>
          </div>
        ) : (
          <button onClick={() => setEdit(true)} aria-label="Modifica" className="grid h-7 w-7 place-items-center rounded-[9px] text-muted opacity-0 transition hover:bg-brand-50 hover:text-brand-600 group-hover:opacity-100">
            <Pencil size={14} />
          </button>
        )}
      </td>

      {celle.map((c, i) => {
        if (c.tipo === "statico") return <td key={i} className={cn("px-3.5 py-3 align-middle", c.classe)}>{c.nodo}</td>;
        if (!edit) return <td key={i} className={cn("px-3.5 py-3 align-middle", c.classe)}>{c.display}</td>;
        return (
          <td key={i} className={cn("px-2 py-2 align-middle", c.classe)}>
            {c.tipo === "select" ? (
              <select className={cn(fieldCls, cellaInput, "px-2")} value={vals[c.nome] ?? ""} onChange={(e) => setVals((s) => ({ ...s, [c.nome]: e.target.value }))}>
                {c.opzioni.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            ) : (
              <input
                className={cn(fieldCls, cellaInput)}
                type={c.tipo === "numero" ? "number" : c.tipo === "data" ? "date" : "text"}
                step={c.step}
                placeholder={c.placeholder}
                value={vals[c.nome] ?? ""}
                onChange={(e) => setVals((s) => ({ ...s, [c.nome]: e.target.value }))}
              />
            )}
          </td>
        );
      })}

      {azioni && <td className="px-3.5 py-3 text-right align-middle">{!edit && azioni}</td>}
    </tr>
  );
}
