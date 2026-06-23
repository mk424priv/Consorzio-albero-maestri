import { useNavigate } from "react-router-dom";
import { Intestazione } from "@/components/Intestazione";
import { Codice } from "@/components/ui";
import { codiceCliente } from "@/lib/codice-parlante";
import { useStore } from "@/store/store";

// Placeholder (Tappa 3). Liste e schede complete in Tappe 6-7.
export function Anagrafiche() {
  const dati = useStore((s) => s.dati);
  const navigate = useNavigate();
  const operatori = dati.operatori.filter((o) => o.attivo);

  return (
    <div className="flex flex-col gap-5">
      <Intestazione titolo="Anagrafiche" sottotitolo={`${dati.clienti.length} clienti · ${operatori.length} operai`} />

      <section className="flex flex-col gap-2">
        <h2 className="font-mono text-xs uppercase tracking-wider text-inchiostro-debole">Clienti</h2>
        {dati.clienti.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => navigate(`/cliente/${c.id}`)}
            className="flex items-center justify-between gap-2 rounded-targhetta bg-carta-alta px-3 py-2.5 text-left shadow-svolto"
          >
            <span className="min-w-0 truncate text-sm">
              {c.nome} {c.cognome ?? ""}
            </span>
            <Codice value={codiceCliente(dati, c.id)} />
          </button>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-mono text-xs uppercase tracking-wider text-inchiostro-debole">Operai</h2>
        {operatori.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => navigate(`/operaio/${o.id}`)}
            className="flex items-center justify-between gap-2 rounded-targhetta bg-carta-alta px-3 py-2.5 text-left shadow-svolto"
          >
            <span className="text-sm">{o.nome}</span>
            <span className="font-mono text-xs text-inchiostro-debole">
              {o.ruolo === "titolare" ? "io" : `${o.tariffaOraria ?? 0} €/h`}
            </span>
          </button>
        ))}
      </section>
    </div>
  );
}
