// Riga di tabella con modifica inline: si tocca la matita ✏️, i campi
// diventano editabili, ✓ salva e ✕ annulla.
import { useState, type ReactNode } from "react";
import { Check, Pencil, X } from "lucide-react";
import { clsx } from "clsx";

type Opzione = { v: string; l: string };

export type Cella =
  | { tipo: "statico"; nodo: ReactNode; classe?: string }
  | {
      tipo: "testo" | "numero" | "data";
      nome: string;
      valore: string;
      display: ReactNode;
      classe?: string;
      step?: string;
      placeholder?: string;
    }
  | {
      tipo: "select";
      nome: string;
      valore: string;
      opzioni: Opzione[];
      display: ReactNode;
      classe?: string;
    };

export default function RigaEditabile({
  celle,
  onSave,
}: {
  celle: Cella[];
  onSave: (valori: Record<string, string>) => void;
}) {
  const inizial = () =>
    Object.fromEntries(
      celle.filter((c) => c.tipo !== "statico").map((c) => [c.nome, c.valore]),
    );

  const [edit, setEdit] = useState(false);
  const [vals, setVals] = useState<Record<string, string>>(inizial);

  function annulla() {
    setVals(inizial());
    setEdit(false);
  }
  function salva() {
    onSave(vals);
    setEdit(false);
  }

  return (
    <tr className={clsx(edit && "bg-brand-50/60")}>
      <td className="w-10">
        {edit ? (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={salva}
              title="Salva"
              aria-label="Salva"
              className="grid h-7 w-7 place-items-center rounded-lg bg-success-soft text-success transition hover:brightness-95"
            >
              <Check size={15} />
            </button>
            <button
              type="button"
              onClick={annulla}
              title="Annulla"
              aria-label="Annulla"
              className="grid h-7 w-7 place-items-center rounded-lg bg-[#eef1ea] text-muted transition hover:brightness-95"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEdit(true)}
            title="Modifica"
            aria-label="Modifica"
            className="grid h-7 w-7 place-items-center rounded-lg text-muted opacity-60 transition hover:bg-brand-50 hover:text-brand-500 hover:opacity-100"
          >
            <Pencil size={14} />
          </button>
        )}
      </td>

      {celle.map((c, i) => {
        if (c.tipo === "statico") {
          return (
            <td key={i} className={c.classe}>
              {c.nodo}
            </td>
          );
        }
        if (!edit) {
          return (
            <td key={i} className={c.classe}>
              {c.display}
            </td>
          );
        }
        return (
          <td key={i} className={c.classe}>
            {c.tipo === "select" ? (
              <select
                className="field !py-1.5 !text-sm"
                value={vals[c.nome] ?? ""}
                onChange={(e) => setVals((s) => ({ ...s, [c.nome]: e.target.value }))}
              >
                {c.opzioni.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.l}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="field !py-1.5 !text-sm"
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
    </tr>
  );
}
