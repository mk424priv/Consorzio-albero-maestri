import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Drawer } from "vaul";
import { MeshStrip, type MeshTono } from "@/components/world/MeshStrip";

/*
  Sistema di sheet (canone 06 §5). Ogni variante ha la SUA tonalità/gerarchia:
  info/dettaglio neutri · azione-incasso(verde)/pagamento(blu) con header mesh ·
  creazione(notte) · pericolo(rosso). Drag-to-dismiss + snap via vaul.
*/

export type FoglioVariante =
  | "info"
  | "dettaglio"
  | "azione-incasso"
  | "azione-pagamento"
  | "creazione"
  | "pericolo";

const CONF: Record<FoglioVariante, { overlay: string; mesh?: MeshTono }> = {
  info: { overlay: "bg-black/50" },
  dettaglio: { overlay: "bg-black/55" },
  "azione-incasso": { overlay: "bg-verde/10", mesh: "verde" },
  "azione-pagamento": { overlay: "bg-blu/10", mesh: "blu" },
  creazione: { overlay: "bg-black/60", mesh: "notte" },
  pericolo: { overlay: "bg-rosso/10" },
};

export interface FoglioProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  variante?: FoglioVariante;
  titolo?: string;
  children: ReactNode;
}

export function Foglio({ open, onOpenChange, variante = "dettaglio", titolo, children }: FoglioProps) {
  const conf = CONF[variante];
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className={`fixed inset-0 z-[90] ${conf.overlay} backdrop-blur-[2px]`} />
        <Drawer.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-[100] mx-auto flex max-h-[92dvh] max-w-lg flex-col overflow-hidden rounded-t-bolla bg-superficie shadow-[var(--shadow-sheet)] outline-none"
        >
          <Drawer.Title className="sr-only">{titolo ?? "Foglio"}</Drawer.Title>
          <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-superficie-3" />
          {conf.mesh && (
            <div className="relative mx-3 mt-2 h-24 shrink-0 overflow-hidden rounded-vetro">
              <MeshStrip tono={conf.mesh} />
              {titolo && <h3 className="absolute bottom-3 left-4 text-2xl font-bold tracking-tight text-white">{titolo}</h3>}
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-6">
            {!conf.mesh && titolo && (
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-2xl font-bold tracking-tight">{titolo}</h3>
                <button type="button" onClick={() => onOpenChange(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-superficie-alta text-fumo hover:text-bianco">
                  <X size={18} />
                </button>
              </div>
            )}
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
