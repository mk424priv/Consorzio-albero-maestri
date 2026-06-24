import type { LucideIcon } from "lucide-react";

export interface Azione {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  tono?: "neutro" | "bianco";
}

export function ActionRow({ azioni }: { azioni: Azione[] }) {
  return (
    <div className="flex justify-around">
      {azioni.map((a, i) => {
        const I = a.icon;
        return (
          <button key={i} type="button" onClick={a.onClick} className="flex flex-col items-center gap-2">
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors active:scale-95 ${
                a.tono === "bianco" ? "bg-scuro text-white" : "bg-superficie text-bianco shadow-card hover:bg-superficie-bassa"
              }`}
            >
              <I size={22} />
            </span>
            <span className="text-xs font-medium text-fumo">{a.label}</span>
          </button>
        );
      })}
    </div>
  );
}
