import { Activity, AlertCircle, CheckCircle2, Clock, type LucideIcon, Star } from "lucide-react";
import { cn } from "@/lib/cn";

export type Stato = "programmato" | "incassare" | "parziale" | "pagato" | "storico";

const MAP: Record<Stato, { c: string; t: string; I: LucideIcon }> = {
  programmato: { c: "text-blu bg-blu/12", t: "Programmato", I: Activity },
  incassare: { c: "text-rosso bg-rosso/12", t: "Da incassare", I: Clock },
  parziale: { c: "text-attenzione bg-attenzione/12", t: "Parziale", I: AlertCircle },
  pagato: { c: "text-verde bg-verde/12", t: "Saldato", I: CheckCircle2 },
  storico: { c: "text-bianco bg-black/[0.06]", t: "Storico", I: Star },
};

export function StatePill({ stato, className }: { stato: Stato; className?: string }) {
  const m = MAP[stato];
  const I = m.I;
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-pill px-2.5 py-1 text-[11px] font-semibold", m.c, className)}>
      <I size={13} /> {m.t}
    </span>
  );
}
