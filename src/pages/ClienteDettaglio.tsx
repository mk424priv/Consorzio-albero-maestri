import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarPlus,
  Clock,
  Mail,
  Pencil,
  Phone,
  ReceiptText,
  Trash2,
} from "lucide-react";
import { useStore } from "@/store/store";
import { codiceCliente, leggiCodice } from "@/lib/codice-parlante";
import { riepilogoCliente, statoCalcolato } from "@/lib/conti";
import { dataIT, euro, ore as fmtOre } from "@/lib/format";
import { etichetta } from "@/lib/dominio";
import {
  BadgeLavoro,
  BadgePagamento,
  Button,
  Card,
  CodiceCliente,
  EmptyState,
  LinkButton,
  PageHeader,
  Stat,
} from "@/components/ui";
import { Modal } from "@/components/Modal";
import { useToast } from "@/store/toast";

export function ClienteDettaglio() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const db = useStore((s) => s.db);
  const registraIncasso = useStore((s) => s.registraIncasso);
  const eliminaCliente = useStore((s) => s.eliminaCliente);
  const mostra = useToast((s) => s.mostra);
  const [confermaElimina, setConfermaElimina] = useState(false);

  const cliente = db.clienti.find((c) => c.id === id);

  const datiCliente = useMemo(() => {
    if (!cliente) return null;
    const codice = codiceCliente(db, id);
    return {
      codice,
      parti: leggiCodice(codice),
      r: riepilogoCliente(db, id),
      pagamenti: [...db.pagamenti]
        .filter((p) => p.clienteId === id)
        .sort((a, b) => b.dataEmissione.localeCompare(a.dataEmissione)),
      lavori: [...db.lavori]
        .filter((l) => l.clienteId === id)
        .sort((a, b) => b.data.localeCompare(a.data)),
      ore: [...db.ore]
        .filter((o) => o.clienteId === id)
        .sort((a, b) => b.data.localeCompare(a.data))
        .slice(0, 10),
    };
  }, [db, id, cliente]);

  if (!cliente || !datiCliente) {
    return (
      <EmptyState
        titolo="Cliente non trovato"
        testo="Forse è stato eliminato."
        azione={<LinkButton to="/clienti"><ArrowLeft size={16} /> Torna ai clienti</LinkButton>}
      />
    );
  }

  const { codice, parti, r, pagamenti, lavori, ore } = datiCliente;
  const persona = (pid?: string | null) => db.persone.find((p) => p.id === pid)?.nome;

  function elimina() {
    eliminaCliente(id);
    mostra("Cliente eliminato.", "info");
    navigate("/clienti");
  }

  return (
    <div>
      <PageHeader
        titolo={`${cliente.nome} ${cliente.cognome}`}
        sottotitolo={cliente.luogo ?? undefined}
        azione={
          <>
            <LinkButton to={`/clienti/${id}/modifica`}><Pencil size={15} /> Modifica</LinkButton>
            <LinkButton to="/clienti"><ArrowLeft size={15} /> Clienti</LinkButton>
          </>
        }
      />

      <Card className="mb-6 p-5 anim-fade-up">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <CodiceCliente codice={codice} />
          <span className="text-sm text-muted">
            {etichetta(cliente.modalitaPredefinita)}
            {cliente.tariffaOraria ? ` · ${euro(cliente.tariffaOraria)}/h` : ""}
          </span>
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-xl bg-surface-2 p-3">
            <span className="text-muted">Paga in </span>
            <b className="text-ink">{parti.giorni} giorni</b>
            <span className="text-muted"> in media</span>
          </div>
          <div className="rounded-xl bg-surface-2 p-3">
            <span className="text-muted">Spesa media </span>
            <b className="text-ink">{euro(parti.spesaMedia)}</b>
            <span className="text-muted"> a lavoro</span>
          </div>
          <div className="rounded-xl bg-surface-2 p-3">
            <span className="text-muted">Cliente da </span>
            <b className="text-ink">{parti.anni} {parti.anni === 1 ? "anno" : "anni"}</b>
          </div>
        </div>
        {(cliente.telefono || cliente.email) && (
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted">
            {cliente.telefono && <span className="inline-flex items-center gap-1.5"><Phone size={14} /> {cliente.telefono}</span>}
            {cliente.email && <span className="inline-flex items-center gap-1.5"><Mail size={14} /> {cliente.email}</span>}
          </div>
        )}
        {cliente.note && <p className="mt-3 text-sm text-ink-soft">{cliente.note}</p>}
      </Card>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat etichetta="Da incassare" valore={euro(r.saldoDaIncassare)} tono={r.saldoDaIncassare > 0 ? "negativo" : "neutro"} />
        <Stat etichetta="Incassato" valore={euro(r.totaleIncassato)} tono="positivo" />
        <Stat etichetta="Lavori" valore={String(r.numeroLavori)} />
        <Stat etichetta="Ore totali" valore={fmtOre(r.oreTotali)} />
      </div>

      {/* Pagamenti */}
      <section className="mb-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-ink">Pagamenti</h2>
          <div className="flex gap-2">
            <LinkButton to={`/preventivi?clienteId=${id}`} dim="sm"><ReceiptText size={14} /> Preventivo</LinkButton>
            <LinkButton to={`/ore?clienteId=${id}`} dim="sm"><Clock size={14} /> Ore</LinkButton>
          </div>
        </div>
        {pagamenti.length === 0 ? (
          <EmptyState testo="Nessun pagamento ancora." />
        ) : (
          <Card className="overflow-x-auto">
            <table className="am-table">
              <thead>
                <tr>
                  <th>Emesso</th><th>Origine</th><th className="text-right">Atteso</th>
                  <th className="text-right">Incassato</th><th>Stato</th><th></th>
                </tr>
              </thead>
              <tbody>
                {pagamenti.map((p) => {
                  const st = statoCalcolato(p);
                  return (
                    <tr key={p.id}>
                      <td>{dataIT(p.dataEmissione)}</td>
                      <td>{etichetta(p.origine)}</td>
                      <td className="text-right">{euro(p.importoAtteso)}</td>
                      <td className="text-right">{euro(p.importoIncassato)}</td>
                      <td><BadgePagamento stato={st} /></td>
                      <td className="text-right">
                        {st !== "pagato" && (
                          <Button dim="sm" onClick={() => { registraIncasso(p.id); mostra("Incasso registrato."); }}>
                            Segna incassato
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      {/* Lavori */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-ink">Lavori</h2>
          <LinkButton to="/calendario" dim="sm"><CalendarPlus size={14} /> Calendario</LinkButton>
        </div>
        {lavori.length === 0 ? (
          <EmptyState testo="Nessun lavoro ancora." />
        ) : (
          <Card className="divide-y divide-line overflow-hidden">
            {lavori.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-3 p-3.5">
                <div className="min-w-0">
                  <div className="truncate font-medium text-ink">{l.titolo}</div>
                  <div className="text-sm text-muted">
                    {dataIT(l.data)} · {etichetta(l.tipoCompenso)}
                    {persona(l.personaId) ? ` · ${persona(l.personaId)}` : ""}
                  </div>
                </div>
                <BadgeLavoro stato={l.stato} />
              </div>
            ))}
          </Card>
        )}
      </section>

      {/* Ore recenti */}
      {ore.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 font-semibold text-ink">Ultime ore registrate</h2>
          <Card className="divide-y divide-line overflow-hidden">
            {ore.map((o) => (
              <div key={o.id} className="flex items-center justify-between p-3.5 text-sm">
                <span className="text-ink-soft">
                  {dataIT(o.data)}
                  {persona(o.personaId) ? ` · ${persona(o.personaId)}` : ""}
                  {o.note ? ` · ${o.note}` : ""}
                </span>
                <b className="text-ink">{fmtOre(o.ore)}</b>
              </div>
            ))}
          </Card>
        </section>
      )}

      <button
        onClick={() => setConfermaElimina(true)}
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-danger hover:underline"
      >
        <Trash2 size={15} /> Elimina cliente
      </button>

      <Modal
        aperto={confermaElimina}
        onClose={() => setConfermaElimina(false)}
        titolo="Eliminare il cliente?"
        sottotitolo={`${cliente.nome} ${cliente.cognome} e tutti i suoi lavori, preventivi, ore e pagamenti.`}
      >
        <p className="text-sm text-ink-soft">Questa azione non si può annullare.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={() => setConfermaElimina(false)}>Annulla</Button>
          <Button variante="danger" onClick={elimina}><Trash2 size={15} /> Elimina definitivamente</Button>
        </div>
      </Modal>
    </div>
  );
}
