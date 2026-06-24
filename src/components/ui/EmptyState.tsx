import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({ icon: Icon, titolo, testo, azione }: { icon: LucideIcon; titolo: string; testo?: string; azione?: ReactNode }) {
  return (
    <div className="rounded-bolla bg-superficie p-8 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-superficie-alta text-fumo">
        <Icon size={30} />
      </div>
      <p className="font-semibold">{titolo}</p>
      {testo && <p className="mt-1 text-sm text-fumo">{testo}</p>}
      {azione && <div className="mt-5 flex justify-center">{azione}</div>}
    </div>
  );
}
