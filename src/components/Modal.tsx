import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function Modal({
  aperto,
  onClose,
  titolo,
  sottotitolo,
  children,
  larghezza = "max-w-lg",
}: {
  aperto: boolean;
  onClose: () => void;
  titolo: string;
  sottotitolo?: string;
  children: ReactNode;
  larghezza?: string;
}) {
  useEffect(() => {
    if (!aperto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [aperto, onClose]);

  if (!aperto) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div
        className="anim-fade absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className={`anim-scale-in relative z-10 w-full ${larghezza} overflow-hidden rounded-[20px] border border-line bg-surface shadow-[var(--shadow-lg)]`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line p-5">
          <div>
            <h2 className="text-lg font-bold text-ink">{titolo}</h2>
            {sottotitolo && <p className="mt-0.5 text-sm text-muted">{sottotitolo}</p>}
          </div>
          <button
            onClick={onClose}
            className="-mr-1 -mt-1 rounded-xl p-2 text-muted transition hover:bg-canvas hover:text-ink"
            aria-label="Chiudi"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
