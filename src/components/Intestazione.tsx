import type { ReactNode } from "react";

export interface IntestazioneProps {
  titolo: string;
  sottotitolo?: string;
  azione?: ReactNode;
}

/** Intestazione di pagina coerente: titolo serif + sottotitolo mono. */
export function Intestazione({ titolo, sottotitolo, azione }: IntestazioneProps) {
  return (
    <header className="flex items-end justify-between gap-3 pb-1">
      <div className="min-w-0">
        <h1 className="truncate font-display text-3xl font-semibold text-bianco">{titolo}</h1>
        {sottotitolo && <p className="font-mono text-xs text-fumo-2">{sottotitolo}</p>}
      </div>
      {azione}
    </header>
  );
}
