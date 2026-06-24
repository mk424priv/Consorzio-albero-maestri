import { Plus, Search, Settings } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarStorico, Codice, SectionHeader, Segmented, StatePill, Testata } from "@/components/ui";
import { codiceCliente } from "@/lib/codice-parlante";
import { dovutoOperatore, riepilogoCliente } from "@/lib/conti";
import { formatEuro } from "@/lib/format";
import { useStore } from "@/store/store";

const STORICO_SOGLIA = 2; // cliente "storico" = relazione consolidata (≥2 lavori)

export function Anagrafiche() {
  const dati = useStore((s) => s.dati);
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [modo, setModo] = useState<"clienti" | "operai">("clienti");

  const operatori = dati.operatori.filter((o) => o.attivo);

  const clienti = useMemo(() => {
    const t = q.trim().toLowerCase();
    return dati.clienti
      .filter((c) => !c.deleted && (!t || `${c.nome} ${c.cognome ?? ""} ${c.inizialiCodice}`.toLowerCase().includes(t)))
      .map((c) => ({ c, r: riepilogoCliente(dati, c.id) }))
      .sort((a, b) => b.r.saldoDaIncassare - a.r.saldoDaIncassare || a.c.nome.localeCompare(b.c.nome));
  }, [dati, q]);

  const operaiFiltrati = useMemo(() => {
    const t = q.trim().toLowerCase();
    return operatori.filter((o) => !t || o.nome.toLowerCase().includes(t));
  }, [operatori, q]);

  return (
    <div className="flex flex-col">
      <Testata
        titolo="Rubrica"
        controllo={
          <button type="button" onClick={() => navigate("/impostazioni")} aria-label="Impostazioni" className="flex h-9 w-9 items-center justify-center rounded-full bg-superficie text-fumo hover:text-bianco">
            <Settings size={18} />
          </button>
        }
      >
        <div className="relative mb-3 flex items-center">
          <Search className="absolute left-4 h-4 w-4 text-fumo-2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cerca per nome o codice…"
            className="h-12 w-full rounded-pill bg-superficie pl-11 pr-4 text-sm text-bianco placeholder-fumo-2 focus:bg-superficie-alta focus:outline-none"
          />
        </div>
        <Segmented
          value={modo}
          onValueChange={setModo}
          options={[
            { value: "clienti", label: "Clienti" },
            { value: "operai", label: "Squadra" },
          ]}
          layoutId="modo-rubrica"
        />
      </Testata>

      <div className="flex flex-col gap-2.5 px-4 pt-5">
        {modo === "clienti" ? (
          <>
            <SectionHeader
              titolo="Clienti"
              conteggio={clienti.length}
              azione={
                <button type="button" onClick={() => navigate("/cliente/nuovo")} className="flex items-center gap-1 text-sm font-medium text-blu">
                  <Plus size={16} /> Nuovo
                </button>
              }
            />
            {clienti.map(({ c, r }) => {
              const storico = r.numeroLavori >= STORICO_SOGLIA;
              const iniz = `${c.nome[0] ?? ""}${c.cognome?.[0] ?? ""}`.toUpperCase() || "?";
              return (
                <button key={c.id} type="button" onClick={() => navigate(`/cliente/${c.id}`)} className="flex items-center justify-between gap-2 rounded-vetro bg-superficie p-3 text-left transition-transform active:scale-[0.99]">
                  <span className="flex min-w-0 items-center gap-3">
                    {storico ? <AvatarStorico iniziali={iniz} size={40} /> : <Avatar iniziali={iniz} tono={r.saldoDaIncassare > 0 ? "rosso" : "neutro"} />}
                    <span className="flex min-w-0 flex-col items-start gap-0.5">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{c.nome} {c.cognome ?? ""}</span>
                        {storico && <StatePill stato="storico" />}
                      </span>
                      <span className="flex items-center gap-2">
                        <Codice value={codiceCliente(dati, c.id)} />
                        <span className="font-mono text-[11px] text-fumo-2">{r.numeroLavori || "0"} lav.</span>
                      </span>
                    </span>
                  </span>
                  {r.saldoDaIncassare > 0 ? (
                    <span className="shrink-0 text-sm font-bold tracking-tight text-rosso">{formatEuro(r.saldoDaIncassare)}</span>
                  ) : r.numeroLavori === 0 ? (
                    <span className="shrink-0 font-mono text-xs text-fumo-2">nuovo</span>
                  ) : (
                    <span className="shrink-0 font-mono text-xs text-verde">saldato</span>
                  )}
                </button>
              );
            })}
          </>
        ) : (
          <>
            <SectionHeader
              titolo="Squadra"
              conteggio={operaiFiltrati.length}
              azione={
                <button type="button" onClick={() => navigate("/operaio/nuovo")} className="flex items-center gap-1 text-sm font-medium text-blu">
                  <Plus size={16} /> Nuovo
                </button>
              }
            />
            {operaiFiltrati.map((o) => {
              const dovuto = o.ruolo === "titolare" ? null : dovutoOperatore(dati, o.id);
              const isIo = o.ruolo === "titolare";
              return (
                <button key={o.id} type="button" onClick={() => navigate(`/operaio/${o.id}`)} className="flex items-center justify-between gap-2 rounded-vetro bg-superficie p-3 text-left transition-transform active:scale-[0.99]">
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar iniziali={o.nome.slice(0, 2).toUpperCase()} tono={isIo ? "verde" : "blu"} />
                    <span className="flex min-w-0 flex-col items-start">
                      <span className="truncate text-sm font-medium">{o.nome} {isIo && <span className="font-mono text-[11px] text-fumo-2">· io</span>}</span>
                      <span className="font-mono text-[11px] text-fumo-2">{isIo ? "titolare" : `${o.tariffaOraria ?? 0} €/h`}</span>
                    </span>
                  </span>
                  {dovuto && dovuto.daPagare > 0 ? (
                    <span className="shrink-0 text-sm font-bold tracking-tight text-rosso">{formatEuro(dovuto.daPagare)}</span>
                  ) : (
                    <span className="shrink-0 font-mono text-xs text-fumo-2">{isIo ? "profitto" : "saldato"}</span>
                  )}
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
