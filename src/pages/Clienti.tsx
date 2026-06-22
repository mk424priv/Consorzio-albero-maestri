import { useMemo, useState } from "react";
import { Plus, Search, Sprout } from "lucide-react";
import { useStore } from "@/store/store";
import { codiceCliente } from "@/lib/codice-parlante";
import { riepilogoCliente } from "@/lib/conti";
import { euro } from "@/lib/format";
import { etichetta, MODALITA } from "@/lib/dominio";
import {
  CodiceCliente,
  EmptyState,
  Input,
  LinkButton,
  LinkCliente,
  PageHeader,
  Card,
} from "@/components/ui";
import RigaEditabile, { type Cella } from "@/components/RigaEditabile";

export function Clienti() {
  const db = useStore((s) => s.db);
  const aggiornaCliente = useStore((s) => s.aggiornaCliente);
  const [q, setQ] = useState("");

  const righe = useMemo(() => {
    const filtro = q.trim().toLowerCase();
    return [...db.clienti]
      .sort((a, b) =>
        (a.cognome + a.nome).localeCompare(b.cognome + b.nome, "it"),
      )
      .filter((c) =>
        filtro === ""
          ? true
          : `${c.nome} ${c.cognome} ${c.luogo ?? ""}`.toLowerCase().includes(filtro),
      )
      .map((cliente) => ({
        cliente,
        codice: codiceCliente(db, cliente.id),
        riepilogo: riepilogoCliente(db, cliente.id),
      }));
  }, [db, q]);

  return (
    <div>
      <PageHeader
        titolo="Clienti"
        sottotitolo="Le radici dell'attività"
        icona={<Sprout size={22} />}
        azione={
          <LinkButton to="/clienti/nuovo" variante="primary">
            <Plus size={17} /> Nuovo cliente
          </LinkButton>
        }
      />

      <div className="relative mb-5 max-w-sm">
        <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca per nome o luogo…"
          className="!pl-10"
        />
      </div>

      {righe.length === 0 ? (
        <EmptyState
          icona={<Sprout size={26} />}
          titolo={q ? "Nessun risultato" : "Ancora nessun cliente"}
          testo={q ? "Prova con un altro termine di ricerca." : "Inizia aggiungendone uno: il codice parlante si genera da solo."}
          azione={!q && <LinkButton to="/clienti/nuovo" variante="primary"><Plus size={16} /> Nuovo cliente</LinkButton>}
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="am-table">
            <thead>
              <tr>
                <th></th>
                <th>Cliente</th>
                <th>Codice</th>
                <th>Luogo</th>
                <th>Accordo</th>
                <th className="text-right">Da incassare</th>
              </tr>
            </thead>
            <tbody>
              {righe.map(({ cliente, codice, riepilogo }) => {
                const celle: Cella[] = [
                  { tipo: "statico", nodo: <LinkCliente id={cliente.id} nome={`${cliente.nome} ${cliente.cognome}`} /> },
                  { tipo: "statico", nodo: <CodiceCliente codice={codice} /> },
                  { tipo: "testo", nome: "luogo", valore: cliente.luogo ?? "", classe: "text-muted", display: cliente.luogo ?? "—" },
                  {
                    tipo: "select",
                    nome: "modalitaPredefinita",
                    valore: cliente.modalitaPredefinita,
                    opzioni: MODALITA.map((m) => ({ v: m, l: etichetta(m) })),
                    display: etichetta(cliente.modalitaPredefinita),
                  },
                  {
                    tipo: "statico",
                    classe: "text-right",
                    nodo:
                      riepilogo.saldoDaIncassare > 0 ? (
                        <span className="font-semibold text-danger">{euro(riepilogo.saldoDaIncassare)}</span>
                      ) : (
                        <span className="text-muted">—</span>
                      ),
                  },
                ];
                return (
                  <RigaEditabile
                    key={cliente.id}
                    celle={celle}
                    onSave={(v) =>
                      aggiornaCliente(cliente.id, {
                        luogo: v.luogo?.trim() || null,
                        modalitaPredefinita: v.modalitaPredefinita as typeof cliente.modalitaPredefinita,
                      })
                    }
                  />
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
      <p className="mt-3 text-xs text-muted">
        Tocca la matita per modificare una riga al volo. Le modifiche aggiornano subito i totali ovunque.
      </p>
    </div>
  );
}
