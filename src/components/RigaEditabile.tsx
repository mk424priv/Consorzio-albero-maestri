"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";

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
  id,
  azione,
  celle,
}: {
  id: string;
  azione: (fd: FormData) => Promise<void>;
  celle: Cella[];
}) {
  const router = useRouter();
  const [edit, setEdit] = useState(false);
  const [pending, start] = useTransition();
  const [vals, setVals] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      celle.filter((c) => c.tipo !== "statico").map((c) => [c.nome, c.valore]),
    ),
  );

  function annulla() {
    setVals(
      Object.fromEntries(
        celle.filter((c) => c.tipo !== "statico").map((c) => [c.nome, c.valore]),
      ),
    );
    setEdit(false);
  }

  function salva() {
    const fd = new FormData();
    fd.set("id", id);
    for (const [k, v] of Object.entries(vals)) fd.set(k, v);
    start(async () => {
      await azione(fd);
      setEdit(false);
      router.refresh();
    });
  }

  return (
    <tr className={pending ? "opacity-50" : undefined}>
      <td className="w-9 align-middle">
        {edit ? (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={salva}
              disabled={pending}
              title="Salva"
              aria-label="Salva"
              className="text-[var(--success)] hover:opacity-70 text-base leading-none"
            >
              ✓
            </button>
            <button
              type="button"
              onClick={annulla}
              title="Annulla"
              aria-label="Annulla"
              className="text-[var(--muted)] hover:opacity-70 text-base leading-none"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEdit(true)}
            title="Modifica"
            aria-label="Modifica"
            className="text-[var(--muted)] hover:text-[var(--primary)] opacity-60 hover:opacity-100"
          >
            ✏️
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
                className="input"
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
                className="input"
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
