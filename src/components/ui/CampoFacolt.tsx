import { Plus, X } from "lucide-react";
import { useState } from "react";

/*
  Campo facoltativo "a scomparsa": finché non serve è un mini-bottone "+ Etichetta";
  al tap si apre l'input. La × lo richiude e svuota. Risparmia spazio nei form.
*/
export function CampoFacolt({
  label,
  value,
  onValue,
  inputMode,
  suffix,
}: {
  label: string;
  value: string;
  onValue: (s: string) => void;
  inputMode?: "text" | "tel" | "email" | "decimal" | "numeric";
  suffix?: string;
}) {
  const [open, setOpen] = useState(!!value);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex w-fit items-center gap-1.5 rounded-pill bg-superficie px-3.5 py-2 text-sm font-medium text-fumo transition-colors hover:text-bianco">
        <Plus size={15} /> {label}
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-xs uppercase tracking-label text-fumo-2">{label}</label>
      <div className="relative flex items-center">
        <input
          autoFocus
          value={value}
          inputMode={inputMode}
          onChange={(e) => onValue(e.target.value)}
          className="h-12 w-full rounded-btn bg-superficie-bassa px-4 pr-16 text-sm text-bianco placeholder-fumo-2 focus:bg-superficie focus:outline-none"
        />
        {suffix && <span className="pointer-events-none absolute right-10 font-mono text-sm text-fumo-2">{suffix}</span>}
        <button type="button" aria-label={`Rimuovi ${label}`} onClick={() => { onValue(""); setOpen(false); }} className="absolute right-3 flex h-7 w-7 items-center justify-center rounded-full text-fumo-2 hover:text-bianco">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
