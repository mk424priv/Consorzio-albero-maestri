import Link from "next/link";
import { etichetta, type StatoPagamento } from "@/lib/dominio";
import { euro } from "@/lib/format";

export function Titolo({
  titolo,
  sottotitolo,
  azione,
}: {
  titolo: string;
  sottotitolo?: string;
  azione?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold">{titolo}</h1>
        {sottotitolo && <p className="text-sm text-[var(--muted)] mt-0.5">{sottotitolo}</p>}
      </div>
      {azione}
    </div>
  );
}

export function Stat({
  etichetta: label,
  valore,
  tono,
  nota,
}: {
  etichetta: string;
  valore: string;
  tono?: "positivo" | "negativo" | "neutro";
  nota?: string;
}) {
  const colore =
    tono === "positivo"
      ? "text-[var(--success)]"
      : tono === "negativo"
        ? "text-[var(--danger)]"
        : "text-[var(--foreground)]";
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${colore}`}>{valore}</div>
      {nota && <div className="text-xs text-[var(--muted)] mt-1">{nota}</div>}
    </div>
  );
}

export function BadgePagamento({ stato }: { stato: StatoPagamento }) {
  const cls =
    stato === "pagato"
      ? "badge-success"
      : stato === "in_ritardo"
        ? "badge-danger"
        : "badge-warning";
  return <span className={`badge ${cls}`}>{etichetta(stato)}</span>;
}

export function Vuoto({ testo }: { testo: string }) {
  return (
    <div className="card p-8 text-center text-[var(--muted)] text-sm">{testo}</div>
  );
}

export function CodiceCliente({ codice }: { codice: string }) {
  return <span className="codice">{codice}</span>;
}

export function LinkCliente({ id, nome }: { id: string; nome: string }) {
  return (
    <Link href={`/clienti/${id}`} className="text-[var(--primary)] hover:underline font-medium">
      {nome}
    </Link>
  );
}

export function Soldi({ n, forte }: { n: number; forte?: boolean }) {
  return <span className={forte ? "font-medium" : undefined}>{euro(n)}</span>;
}
