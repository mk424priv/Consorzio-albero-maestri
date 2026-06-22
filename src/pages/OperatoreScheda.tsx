import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, HandCoins, Hammer, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useStore } from "@/store/store";
import { useUI } from "@/store/ui";
import { useToast } from "@/store/toast";
import { libroOperatore } from "@/lib/squadra";
import { dataIT, euro, ore as fmtOre } from "@/lib/format";
import { etichetta } from "@/lib/dominio";
import { ENTITA } from "@/lib/entita";
import { Avatar, Badge, Button, Card, EmptyState, Menu, RingStat, StatCard, StatusBadge } from "@/components/ui";

export function OperatoreScheda() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const db = useStore((s) => s.db);
  const apri = useUI((s) => s.apri);
  const chiediConferma = useUI((s) => s.chiediConferma);
  const eliminaOperatore = useStore((s) => s.eliminaOperatore);
  const eliminaCompenso = useStore((s) => s.eliminaCompenso);
  const mostra = useToast((s) => s.mostra);

  const operatore = db.operatori.find((o) => o.id === id);
  const libro = useMemo(() => libroOperatore(db, id), [db, id]);
  const lavori = useMemo(
    () => db.lavori.filter((l) => l.operatoreId === id).sort((a, b) => b.data.localeCompare(a.data)).slice(0, 12),
    [db, id],
  );

  if (!operatore) {
    return <EmptyState titolo="Operatore non trovato" testo="Forse è stato eliminato." azione={<Button onClick={() => navigate("/squadra")}>Torna alla squadra</Button>} />;
  }
  const nomeCliente = (cid: string) => { const c = db.clienti.find((x) => x.id === cid); return c ? `${c.nome} ${c.cognome}` : "—"; };

  function elimina() {
    chiediConferma({ titolo: "Eliminare l'operatore?", descrizione: `${operatore!.nome} e i suoi compensi registrati.`, pericolo: true, testoConferma: "Elimina", onConfirm: () => { eliminaOperatore(id); mostra("Operatore eliminato.", "info"); navigate("/squadra"); } });
  }

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-ink"><ArrowLeft size={16} /> Indietro</button>

      <Card className="mb-5 overflow-hidden">
        <div className="bg-gradient-to-br from-operatore-50 to-surface p-5">
          <div className="flex items-start gap-4">
            <Avatar nome={operatore.nome} size="xl" grad={ENTITA.operatore.grad} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-xl font-extrabold leading-tight text-ink">{operatore.nome}</h1>
                <Menu trigger={<button className="grid h-9 w-9 place-items-center rounded-[11px] text-muted hover:bg-surface"><MoreVertical size={18} /></button>} voci={[
                  { label: "Modifica", icona: <Pencil size={16} />, onClick: () => apri("operatore", { id }) },
                  { label: "Elimina", icona: <Trash2 size={16} />, pericolo: true, separa: true, onClick: elimina },
                ]} />
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Badge tono="info">{etichetta(operatore.ruolo)}</Badge>
                {operatore.tariffaOraria ? <span className="text-[0.8rem] text-muted">{euro(operatore.tariffaOraria)}/h</span> : <span className="text-[0.8rem] text-muted">tariffa non impostata</span>}
                <StatusBadge genere="compenso" valore={libro.stato} />
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <RingStat
          className="sm:col-span-2 lg:col-span-1"
          accent="uscita"
          ratio={libro.dovuto > 0 ? libro.pagato / libro.dovuto : 1}
          label="Saldato"
          valore={euro(libro.pagato)}
          sub={`su ${euro(libro.dovuto)} dovuti`}
        />
        <StatCard accent="uscita" label="Da pagare" valore={euro(libro.saldo)} icona={<HandCoins size={15} />} nota={libro.saldo > 0 ? "in sospeso" : "saldato"} />
        <StatCard accent="lavoro" label="Dovuto" valore={euro(libro.dovuto)} />
        <StatCard accent="operatore" label="Ore" valore={fmtOre(libro.ore)} icona={<Clock size={15} />} />
      </div>
      <Button variante="primary" onClick={() => apri("compenso", { operatoreId: id })} className="mb-6 w-full sm:w-auto"><HandCoins size={16} /> Paga operatore</Button>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-[0.95rem] font-bold text-ink">Libro mastro (ore per cliente)</h2>
          {libro.perCliente.length === 0 ? <EmptyState testo="Nessuna ora registrata." /> : (
            <Card className="divide-y divide-line overflow-hidden">
              {libro.perCliente.map((v) => (
                <Link key={v.clienteId} to={`/cliente/${v.clienteId}`} className="flex items-center justify-between gap-3 p-3.5 transition hover:bg-brand-50/50">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-ink">{v.nome}</div>
                    <div className="text-[0.74rem] text-muted">{fmtOre(v.ore)}</div>
                  </div>
                  <b className="tabular-nums text-ink">{euro(v.importo)}</b>
                </Link>
              ))}
            </Card>
          )}

          <h2 className="mb-3 mt-6 text-[0.95rem] font-bold text-ink">Compensi pagati</h2>
          {libro.compensi.length === 0 ? <EmptyState testo="Nessun compenso ancora." /> : (
            <Card className="divide-y divide-line overflow-hidden">
              {libro.compensi.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 p-3.5">
                  <div className="min-w-0 text-sm">
                    <div className="font-semibold text-ink">{euro(c.importo)} <span className="font-normal text-muted">· {etichetta(c.metodo ?? undefined)}</span></div>
                    <div className="text-[0.74rem] text-muted">{dataIT(c.data)}{c.note ? ` · ${c.note}` : ""}</div>
                  </div>
                  <button onClick={() => chiediConferma({ titolo: "Eliminare il compenso?", pericolo: true, testoConferma: "Elimina", onConfirm: () => eliminaCompenso(c.id) })} className="grid h-8 w-8 place-items-center rounded-[10px] text-muted hover:bg-danger-soft hover:text-danger"><Trash2 size={15} /></button>
                </div>
              ))}
            </Card>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-[0.95rem] font-bold text-ink">Lavori assegnati</h2>
          {lavori.length === 0 ? <EmptyState icona={<Hammer size={24} />} testo="Nessun lavoro assegnato." /> : (
            <Card className="divide-y divide-line overflow-hidden">
              {lavori.map((l) => (
                <Link key={l.id} to={`/cliente/${l.clienteId}`} className="flex items-center justify-between gap-3 p-3.5 transition hover:bg-brand-50/50">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-ink">{l.titolo}</div>
                    <div className="text-[0.74rem] text-muted">{dataIT(l.data)} · {nomeCliente(l.clienteId)}</div>
                  </div>
                  <StatusBadge genere="lavoro" valore={l.stato} />
                </Link>
              ))}
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
