import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { clsx } from "clsx";
import { useToast } from "@/store/toast";

const ICONE = {
  success: <CheckCircle2 size={18} />,
  error: <XCircle size={18} />,
  info: <Info size={18} />,
};
const COLORI = {
  success: "text-success",
  error: "text-danger",
  info: "text-info",
};

export function Toaster() {
  const { toasts, chiudi } = useToast();
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(92vw,360px)] flex-col gap-2.5">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="anim-scale-in pointer-events-auto flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 pr-3 shadow-[var(--shadow-lg)]"
        >
          <span className={clsx("shrink-0", COLORI[t.tipo])}>{ICONE[t.tipo]}</span>
          <p className="flex-1 text-sm font-medium text-ink">{t.testo}</p>
          <button
            onClick={() => chiudi(t.id)}
            className="shrink-0 rounded-lg p-1 text-muted transition hover:bg-canvas hover:text-ink"
            aria-label="Chiudi"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
