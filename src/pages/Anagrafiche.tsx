import { Plus, Search, Settings } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Intestazione } from "@/components/Intestazione";
import { Badge, Button, Codice } from "@/components/ui";
import { codiceCliente } from "@/lib/codice-parlante";
import { dovutoOperatore, riepilogoCliente } from "@/lib/conti";
import { formatEuro } from "@/lib/format";
import { useStore } from "@/store/store";

export function Anagrafiche() {
  const dati = useStore((s) => s.dati);
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const operatori = dati.operatori.filter((o) => o.attivo);

  const clienti = useMemo(() => {
    const t = q.trim().toLowerCase();
    return dati.clienti
      .filter((c) => !c.deleted && (!t || `${c.nome} ${c.cognome ?? ""} ${c.inizialiCodice}`.toLowerCase().includes(t)))
      .map((c) => ({ c, r: riepilogoCliente(dati, c.id) }))
      .sort((a, b) => b.r.saldoDaIncassare - a.r.saldoDaIncassare || a.c.nome.localeCompare(b.c.nome));
  }, [dati, q]);

  return (
    <div className="flex flex-col gap-5">
      <Intestazione
        titolo="Anagrafiche"
        sottotitolo={`${dati.clienti.length} clienti · ${operatori.length} operai`}
        azione={
          <Button size="icona" variant="tenue" onClick={() => navigate("/impostazioni")} aria-label="Impostazioni">
            <Settings className="h-5 w-5" />
          </Button>
        }
      />

      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-fumo-2" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca cliente per nome o codice…"
          className="h-11 w-full rounded-2xl border border-white/15 bg-white/[0.08] pl-9 pr-3 text-sm focus-visible:border-lime focus-visible:outline-none"
        />
      </div>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-wider text-fumo-2">Clienti</h2>
          <button type="button" onClick={() => navigate("/cliente/nuovo")} className="flex items-center gap-1 font-mono text-xs text-lime">
            <Plus className="h-3.5 w-3.5" /> Nuovo
          </button>
        </div>
        {clienti.map(({ c, r }) => (
          <button
            key={c.id}
            type="button"
            onClick={() => navigate(`/cliente/${c.id}`)}
            className="flex items-center justify-between gap-2 rounded-2xl bg-white/[0.08] px-3 py-2.5 text-left"
          >
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="flex items-center gap-2">
                <Codice value={codiceCliente(dati, c.id)} />
                <span className="truncate text-sm">{c.nome} {c.cognome ?? ""}</span>
              </span>
              <span className="font-mono text-[0.65rem] text-fumo-2">
                {c.tariffaOraria ? `${c.tariffaOraria} €/h · ` : ""}
                {r.numeroLavori} {r.numeroLavori === 1 ? "lavoro" : "lavori"}
              </span>
            </span>
            {r.saldoDaIncassare > 0 ? (
              <Badge stato="attenzione">{formatEuro(r.saldoDaIncassare)}</Badge>
            ) : r.numeroLavori === 0 ? (
              <Badge stato="lichene">nuovo</Badge>
            ) : null}
          </button>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-wider text-fumo-2">Operai</h2>
          <button type="button" onClick={() => navigate("/operaio/nuovo")} className="flex items-center gap-1 font-mono text-xs text-lime">
            <Plus className="h-3.5 w-3.5" /> Nuovo
          </button>
        </div>
        {operatori.map((o) => {
          const dovuto = o.ruolo === "titolare" ? null : dovutoOperatore(dati, o.id);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => navigate(`/operaio/${o.id}`)}
              className="flex items-center justify-between gap-2 rounded-2xl bg-white/[0.08] px-3 py-2.5 text-left"
            >
              <span className="text-sm">{o.nome} {o.ruolo === "titolare" && <span className="font-mono text-xs text-fumo-2">· io</span>}</span>
              {dovuto && dovuto.daPagare > 0 ? (
                <Badge stato="critico">{formatEuro(dovuto.daPagare)}</Badge>
              ) : (
                <span className="font-mono text-xs text-fumo-2">{o.ruolo === "titolare" ? "io" : `${o.tariffaOraria ?? 0} €/h`}</span>
              )}
            </button>
          );
        })}
      </section>
    </div>
  );
}
