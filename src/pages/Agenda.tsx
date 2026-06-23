import { Intestazione } from "@/components/Intestazione";
import { Badge } from "@/components/ui";
import { etichetta } from "@/lib/dominio";
import { formatData } from "@/lib/format";
import { useStore } from "@/store/store";

// Placeholder (Tappa 3). Il feed mensile vero arriva in Tappa 4.
export function Agenda() {
  const lavori = useStore((s) => s.dati.lavori);
  const ordinati = [...lavori].sort((a, b) => (a.data < b.data ? 1 : -1));

  return (
    <div className="flex flex-col gap-3">
      <Intestazione titolo="Agenda" sottotitolo={`${lavori.length} lavori`} />
      <p className="text-sm text-inchiostro-debole">Feed mensile con targhetta — in costruzione (Tappa 4).</p>
      <ul className="flex flex-col gap-1.5">
        {ordinati.map((l) => (
          <li key={l.id} className="flex items-center justify-between rounded-targhetta bg-carta-alta px-3 py-2 shadow-svolto">
            <span className="min-w-0 truncate text-sm">
              <span className="font-mono text-xs text-inchiostro-debole">{formatData(l.data)}</span> · {l.titolo}
            </span>
            <Badge stato={l.fase === "fatto" ? "neutro" : "lichene"}>{etichetta(l.fase)}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
