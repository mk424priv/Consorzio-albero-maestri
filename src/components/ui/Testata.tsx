import type { ReactNode } from "react";

/*
  Registro superiore (canone 06 §2): identità dello schermo. Titolo grande +
  controllo di contesto (nav mese / segmented) + slot eroe (numero/sotto-blocco).
*/
export function Testata({ titolo, controllo, children }: { titolo: string; controllo?: ReactNode; children?: ReactNode }) {
  return (
    <header className="px-4 pt-5 pb-2">
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-[32px] font-bold leading-none tracking-tight">{titolo}</h1>
        {controllo && <div className="shrink-0">{controllo}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </header>
  );
}
