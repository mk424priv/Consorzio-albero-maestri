import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Clock, HandCoins, Hammer, MoreVertical, Pencil, Trash2, Users } from "lucide-react";
import { useStore } from "@/store/store";
import { useUI } from "@/store/ui";
import { useToast } from "@/store/toast";
import { libroOperatore } from "@/lib/squadra";
import { dataIT, euro, ore as fmtOre } from "@/lib/format";
import { etichetta } from "@/lib/dominio";
import { ENTITA } from "@/lib/entita";
import { Avatar, Badge, Button, Card, Cifra, Conta, EmptyState, Menu, RingStat, Segmented, StatCard, StatusBadge } from "@/components/ui";

const TABS = [
  { k: "lavori", label: "Lavori" },
  { k: "clienti", label: "Per cliente" },
  { k: "compensi", label: "Compensi" },
];

export function OperatoreScheda() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const db = useStore((s) => s.db);
  const apri = useUI((s) => s.apri);
  const chiediConferma = useUI((s) => s.chiediConferma);
  const eliminaOperatore = useStore((s) => s.eliminaOperatore);
  const mostra = useToast((s) => s.mostra);
  const [tab, setTab] = useState("lavori");

  const operatore = db.operatori.find((o) => o.id === id);
  const libro = useMemo(() => libroOperatore(db, id), [db, id]);

  if (!operatore) {
    return <EmptyState titolo="Operatore non trovato" testo="Forse è stato eliminato." azione={<Button onClick={() => navigate("/squadra")}>Torna alla squadra</Button>} />;
  }

  function elimina() {
    chiediConferma({ titolo: "Eliminare l'operatore?", descrizione: `${operatore!.nome} e i suoi compensi registrati.`, pericolo: true, testoConferma: "Elimina", onConfirm: () => { eliminaOperatore(id); mostra("Operatore eliminato.", "info"); navigate("/squadra"); } });
  }

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-ink"><ArrowLeft size={16} /> Indietro</button>

      {/* HERO compatto */}
      <Card className="mb-4 overflow-hidden">
        <div className="bg-gradient-to-br from-operatore-50 to-surface p-4">
          <div className="flex items-start gap-3.5">
            <Avatar nome={operatore.nome} size="lg" grad={ENTITA.operatore.grad} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-lg font-extrabold leading-tight text-ink">{operatore.nome}</h1>
                <Menu trigger={<button className="grid h-8 w-8 place-items-center rounded-[10px] text-muted hover:bg-surface"><MoreVertical size={17} /></button>} voci={[
                  { label: "Modifica", icona: <Pencil size={16} />, onClick: () => apri("operatore", { id }) },
                  { label: "Elimina", icona: <Trash2 size={16} />, pericolo: true, separa: true, onClick: elimina },
                ]} />
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge tono="info">{etichetta(operatore.ruolo)}</Badge>
                <StatusBadge genere="compenso" valore={libro.stato} />
                <span className="text-[0.78rem] text-muted">{operatore.tariffaOraria ? `${euro(operatore.tariffaOraria)}/h` : "tariffa non impostata"}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* STAT band compatta */}
      <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <RingStat
          className="sm:col-span-2 lg:col-span-1"
          accent="uscita"
          ratio={libro.dovuto > 0 ? libro.pagato / libro.dovuto : 1}
          label="Saldato"
          valore={<Cifra valore={libro.pagato} />}
          sub={`su ${euro(libro.dovuto)} dovuti`}
        />
        <StatCard accent="uscita" label="Da pagare" valore={<Cifra valore={libro.saldo} />} icona={<HandCoins size={15} />} nota={libro.saldo > 0 ? "in sospeso" : "saldato"} />
        <StatCard accent="lavoro" label="Dovuto" valore={<Cifra valore={libro.dovuto} />} icona={<Hammer size={15} />} />
        <StatCard accent="operatore" label="Ore" valore={<Conta valore={libro.ore} suffix=" h" />} icona={<Clock size={15} />} />
      </div>

      {/* azione primaria */}
      {libro.saldo > 0 ? (
        <Button variante="primary" onClick={() => apri("compenso", { operatoreId: id })} className="mb-5 w-full sm:w-auto"><HandCoins size={16} /> Paga {euro(libro.saldo)}</Button>
      ) : (
        <Button variante="soft" onClick={() => apri("compenso", { operatoreId: id })} className="mb-5 w-full sm:w-auto"><HandCoins size={16} /> Registra compenso</Button>
      )}

      {/* TUTTO SU UNO SCHERMO — schede */}
      <Segmented voci={TABS} attivo={tab} onChange={setTab} className="mb-4" />
      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
        {tab === "lavori" && <SezioneLavori id={id} />}
        {tab === "clienti" && <SezioneClienti libro={libro} />}
        {tab === "compensi" && <SezioneCompensi id={id} libro={libro} />}
      </motion.div>
    </div>
  );
}

/* ------------------------------- Lavori ------------------------------- */
function SezioneLavori({ id }: { id: string }) {
  const db = useStore((s) => s.db);
  const apriScheda = useUI((s) => s.apriSchedaLavoro);
  const lavori = useMemo(() => db.lavori.filter((l) => l.operatoreId === id).sort((a, b) => b.data.localeCompare(a.data)), [db, id]);
  const nomeCliente = (cid: string) => { const c = db.clienti.find((x) => x.id === cid); return c ? `${c.nome} ${c.cognome}` : "—"; };
  if (lavori.length === 0) return <EmptyState icona={<Hammer size={24} />} testo="Nessun lavoro assegnato." />;
  return (
    <Card className="divide-y divide-line overflow-hidden">
      {lavori.map((l) => (
        <button key={l.id} onClick={() => apriScheda(l.id)} className="flex w-full items-center gap-3 p-3.5 text-left transition hover:bg-brand-50/50">
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[11px] ${ENTITA.lavoro.soft}`}><Hammer size={16} /></span>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold text-ink">{l.titolo}</div>
            <div className="text-[0.74rem] text-muted">{dataIT(l.data)} · {nomeCliente(l.clienteId)}</div>
          </div>
          <StatusBadge genere="lavoro" valore={l.stato} />
          <ChevronRight size={16} className="shrink-0 text-muted/40" />
        </button>
      ))}
    </Card>
  );
}

/* ----------------------------- Per cliente ----------------------------- */
function SezioneClienti({ libro }: { libro: ReturnType<typeof libroOperatore> }) {
  if (libro.perCliente.length === 0) return <EmptyState icona={<Users size={24} />} testo="Nessuna ora registrata." />;
  return (
    <Card className="divide-y divide-line overflow-hidden">
      {libro.perCliente.map((v) => (
        <Link key={v.clienteId} to={`/cliente/${v.clienteId}`} className="flex items-center justify-between gap-3 p-3.5 transition hover:bg-brand-50/50">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar nome={v.nome} size="sm" grad={ENTITA.cliente.grad} />
            <div className="min-w-0">
              <div className="truncate font-semibold text-ink">{v.nome}</div>
              <div className="text-[0.74rem] text-muted">{fmtOre(v.ore)}</div>
            </div>
          </div>
          <b className="shrink-0 tabular-nums text-ink">{euro(v.importo)}</b>
        </Link>
      ))}
    </Card>
  );
}

/* ------------------------------ Compensi ------------------------------ */
function SezioneCompensi({ id, libro }: { id: string; libro: ReturnType<typeof libroOperatore> }) {
  const apri = useUI((s) => s.apri);
  const chiediConferma = useUI((s) => s.chiediConferma);
  const eliminaCompenso = useStore((s) => s.eliminaCompenso);
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button variante="soft" dim="sm" onClick={() => apri("compenso", { operatoreId: id })}><HandCoins size={15} /> Nuovo compenso</Button>
      </div>
      {libro.compensi.length === 0 ? <EmptyState icona={<HandCoins size={24} />} testo="Nessun compenso ancora." /> : (
        <Card className="divide-y divide-line overflow-hidden">
          {libro.compensi.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 p-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[11px] ${ENTITA.uscita.soft}`}><HandCoins size={16} /></span>
                <div className="min-w-0 text-sm">
                  <div className="font-semibold text-ink">{euro(c.importo)} <span className="font-normal text-muted">· {etichetta(c.metodo ?? undefined)}</span></div>
                  <div className="text-[0.74rem] text-muted">{dataIT(c.data)}{c.note ? ` · ${c.note}` : ""}</div>
                </div>
              </div>
              <button onClick={() => chiediConferma({ titolo: "Eliminare il compenso?", pericolo: true, testoConferma: "Elimina", onConfirm: () => eliminaCompenso(c.id) })} className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] text-muted hover:bg-danger-soft hover:text-danger"><Trash2 size={15} /></button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
