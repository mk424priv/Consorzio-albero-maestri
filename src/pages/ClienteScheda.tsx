import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Banknote,
  Clock,
  Fuel,
  Hammer,
  Hourglass,
  Mail,
  MapPin,
  MoreVertical,
  Pencil,
  Phone,
  Plus,
  ReceiptText,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { useStore } from "@/store/store";
import { useUI } from "@/store/ui";
import { useToast } from "@/store/toast";
import { codiceCliente, leggiCodice } from "@/lib/codice-parlante";
import { riepilogoCliente, statoCalcolato } from "@/lib/conti";
import { feedCliente, type TipoEvento } from "@/lib/movimenti";
import { dataIT, euro, ore as fmtOre } from "@/lib/format";
import { etichetta } from "@/lib/dominio";
import { ENTITA } from "@/lib/entita";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Cifra,
  Codice,
  EmptyState,
  Menu,
  RingStat,
  Segmented,
  StatCard,
  StatusBadge,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/ui";

const TABS = [
  { k: "panoramica", label: "Panoramica" },
  { k: "lavori", label: "Lavori" },
  { k: "pagamenti", label: "Pagamenti" },
  { k: "ore", label: "Ore" },
  { k: "spese", label: "Spese" },
];

export function ClienteScheda() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const db = useStore((s) => s.db);
  const apri = useUI((s) => s.apri);
  const chiediConferma = useUI((s) => s.chiediConferma);
  const eliminaCliente = useStore((s) => s.eliminaCliente);
  const mostra = useToast((s) => s.mostra);
  const [tab, setTab] = useState("panoramica");

  const cliente = db.clienti.find((c) => c.id === id);
  const dati = useMemo(() => {
    if (!cliente) return null;
    const codice = codiceCliente(db, id);
    return { codice, parti: leggiCodice(codice), r: riepilogoCliente(db, id) };
  }, [db, id, cliente]);

  if (!cliente || !dati) {
    return <EmptyState titolo="Cliente non trovato" testo="Forse è stato eliminato." azione={<Button onClick={() => navigate("/")}>Torna allo Spazio</Button>} />;
  }
  const { codice, parti, r } = dati;
  const nomeCompl = `${cliente.nome} ${cliente.cognome}`;

  function elimina() {
    chiediConferma({
      titolo: "Eliminare il cliente?",
      descrizione: `${nomeCompl} e tutti i suoi lavori, ore e pagamenti.`,
      pericolo: true,
      testoConferma: "Elimina",
      onConfirm: () => { eliminaCliente(id); mostra("Cliente eliminato.", "info"); navigate("/"); },
    });
  }

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-ink">
        <ArrowLeft size={16} /> Indietro
      </button>

      {/* Hero */}
      <Card className="mb-5 overflow-hidden">
        <div className="bg-gradient-to-br from-cliente-50 to-surface p-5">
          <div className="flex items-start gap-4">
            <Avatar nome={nomeCompl} size="xl" grad="bg-gradient-to-br from-cliente-500 to-brand-700" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-xl font-extrabold leading-tight text-ink">{nomeCompl}</h1>
                <Menu
                  trigger={<button className="grid h-9 w-9 place-items-center rounded-[11px] text-muted hover:bg-surface"><MoreVertical size={18} /></button>}
                  voci={[
                    { label: "Modifica", icona: <Pencil size={16} />, onClick: () => apri("cliente", { id }) },
                    { label: "Elimina", icona: <Trash2 size={16} />, pericolo: true, separa: true, onClick: elimina },
                  ]}
                />
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Codice codice={codice} />
                <Badge tono="brand">{etichetta(cliente.modalitaPredefinita)}</Badge>
                {cliente.tariffaOraria ? <span className="text-[0.78rem] text-muted">{euro(cliente.tariffaOraria)}/h</span> : null}
              </div>
            </div>
          </div>

          {/* codice decodificato */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { l: "Paga in", v: `${parti.giorni} giorni` },
              { l: "Spesa media", v: euro(parti.spesaMedia) },
              { l: "Insieme da", v: `${parti.anni} ${parti.anni === 1 ? "anno" : "anni"}` },
            ].map((s) => (
              <div key={s.l} className="rounded-[12px] border border-line bg-surface/70 px-3 py-2 text-center">
                <div className="text-[0.64rem] font-semibold uppercase tracking-wide text-muted">{s.l}</div>
                <div className="text-sm font-bold text-ink">{s.v}</div>
              </div>
            ))}
          </div>

          {/* contatti */}
          <div className="mt-3 flex flex-wrap gap-2">
            {cliente.telefono && <a href={`tel:${cliente.telefono}`} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[0.8rem] font-semibold text-ink-soft transition hover:border-brand-200 hover:text-brand-600"><Phone size={14} /> {cliente.telefono}</a>}
            {cliente.email && <a href={`mailto:${cliente.email}`} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[0.8rem] font-semibold text-ink-soft transition hover:border-brand-200 hover:text-brand-600"><Mail size={14} /> Email</a>}
            {cliente.luogo && <a href={`https://maps.google.com/?q=${encodeURIComponent(cliente.luogo)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[0.8rem] font-semibold text-ink-soft transition hover:border-brand-200 hover:text-brand-600"><MapPin size={14} /> {cliente.luogo}</a>}
          </div>
        </div>
      </Card>

      {/* Stat band — ogni dato con la sua forma e gerarchia */}
      <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <RingStat
          className="sm:col-span-2 lg:col-span-1"
          accent="entrata"
          ratio={r.totaleAtteso > 0 ? r.totaleIncassato / r.totaleAtteso : 0}
          label="Incassato"
          valore={<Cifra valore={r.totaleIncassato} />}
          sub={`su ${euro(r.totaleAtteso)} attesi`}
        />
        <StatCard accent="uscita" label="Da incassare" valore={<Cifra valore={r.saldoDaIncassare} />} icona={<Hourglass size={15} />} nota={r.saldoDaIncassare > 0 ? "ancora aperto" : "tutto in regola"} />
        <StatCard accent="spesa" label="Spese" valore={<Cifra valore={r.spese} />} icona={<Fuel size={15} />} nota="attribuite al cliente" />
        <StatCard accent={r.margine >= 0 ? "entrata" : "spesa"} label="Margine" valore={<Cifra valore={r.margine} />} icona={<TrendingUp size={15} />} nota="incassato − spese − manodopera" />
      </div>

      {/* striscia di relazioni: lavori, ore, costo manodopera, fatturabile */}
      <div className="mb-5 flex flex-wrap gap-2 text-[0.74rem] font-semibold">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-ink-soft"><Hammer size={13} className="text-lavoro-500" /> {r.numeroLavori} lavori</span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-ink-soft"><Clock size={13} className="text-operatore-500" /> {fmtOre(r.oreTotali)}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-ink-soft"><Users size={13} className="text-uscita-500" /> Manodopera {euro(r.costoManodopera)}</span>
        {r.valoreFatturabile > 0 && <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-ink-soft"><ReceiptText size={13} className="text-preventivo-500" /> Fatturabile {euro(r.valoreFatturabile)}</span>}
      </div>

      <Segmented voci={TABS} attivo={tab} onChange={setTab} className="mb-5" />

      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
        {tab === "panoramica" && <Panoramica id={id} />}
        {tab === "lavori" && <SezioneLavori id={id} />}
        {tab === "pagamenti" && <SezionePagamenti id={id} />}
        {tab === "ore" && <SezioneOre id={id} />}
        {tab === "spese" && <SezioneSpese id={id} />}
      </motion.div>
    </div>
  );
}

/* ----------------------------- Panoramica ----------------------------- */
const ICONA_EVENTO: Record<TipoEvento, keyof typeof ENTITA> = {
  lavoro: "lavoro", ore: "ore", pagamento: "entrata", spesa: "spesa", preventivo: "preventivo",
};
function Panoramica({ id }: { id: string }) {
  const db = useStore((s) => s.db);
  const apri = useUI((s) => s.apri);
  const eventi = useMemo(() => feedCliente(db, id), [db, id]);
  const azioni = [
    { tipo: "lavoro" as const, label: "Lavoro", Icona: Hammer, c: ENTITA.lavoro.soft },
    { tipo: "preventivo" as const, label: "Preventivo", Icona: ReceiptText, c: ENTITA.preventivo.soft },
    { tipo: "ore" as const, label: "Ore", Icona: Clock, c: ENTITA.operatore.soft },
    { tipo: "spesa" as const, label: "Spesa", Icona: Fuel, c: ENTITA.spesa.soft },
  ];
  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {azioni.map((a) => (
          <button key={a.tipo} onClick={() => apri(a.tipo, { clienteId: id })} className="flex flex-col items-center gap-2 rounded-[14px] border border-line bg-surface p-3.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
            <span className={`grid h-10 w-10 place-items-center rounded-[12px] ${a.c}`}><a.Icona size={18} /></span>
            {a.label}
          </button>
        ))}
      </div>
      <div>
        <h3 className="mb-3 text-[0.95rem] font-bold text-ink">Attività recente</h3>
        {eventi.length === 0 ? (
          <EmptyState testo="Ancora nessuna attività." />
        ) : (
          <Card className="divide-y divide-line overflow-hidden">
            {eventi.map((e) => {
              const meta = ENTITA[ICONA_EVENTO[e.tipo]];
              return (
                <div key={e.id} className="flex items-center gap-3 p-3.5">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[11px] ${meta.soft}`}><meta.Icon size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-ink">{meta.label}: {etichetta(e.titolo)}</div>
                    <div className="text-[0.74rem] text-muted">{dataIT(e.data)}{e.dettaglio ? ` · ${etichetta(e.dettaglio)}` : ""}</div>
                  </div>
                </div>
              );
            })}
          </Card>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- Lavori ------------------------------- */
const CICLO = { da_fare: "in_corso", in_corso: "fatto", fatto: "da_fare" } as const;
function SezioneLavori({ id }: { id: string }) {
  const db = useStore((s) => s.db);
  const apri = useUI((s) => s.apri);
  const cambia = useStore((s) => s.cambiaStatoLavoro);
  const chiediConferma = useUI((s) => s.chiediConferma);
  const elimina = useStore((s) => s.eliminaLavoro);
  const lavori = db.lavori.filter((l) => l.clienteId === id).sort((a, b) => b.data.localeCompare(a.data));
  const operatore = (oid?: string | null) => db.operatori.find((o) => o.id === oid);
  return (
    <div>
      <div className="mb-3 flex justify-end"><Button variante="soft" dim="sm" onClick={() => apri("lavoro", { clienteId: id })}><Plus size={15} /> Lavoro</Button></div>
      {lavori.length === 0 ? <EmptyState icona={<Hammer size={24} />} testo="Nessun lavoro." /> : (
        <Card className="divide-y divide-line overflow-hidden">
          {lavori.map((l) => {
            const op = operatore(l.operatoreId);
            const oreReali = db.ore.filter((o) => o.lavoroId === l.id).reduce((a, o) => a + o.ore, 0);
            return (
              <div key={l.id} className="flex items-center gap-3 p-3.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-ink">{l.titolo}</div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.76rem] text-muted">
                    {dataIT(l.data)} · {etichetta(l.tipoCompenso)}
                    {op && <span className="inline-flex items-center gap-1"><Avatar nome={op.nome} size="sm" grad={ENTITA.operatore.grad} className="!h-4 !w-4 !text-[0.5rem]" /> {op.nome}</span>}
                    {(oreReali > 0 || l.durataPrevistaOre != null) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-operatore-50 px-2 py-0.5 font-semibold text-operatore-600">
                        <Clock size={11} /> {oreReali > 0 ? `${oreReali}h` : "0h"}{l.durataPrevistaOre != null ? ` / ${l.durataPrevistaOre}h` : ""}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => cambia(l.id, CICLO[l.stato])} title="Cambia stato"><StatusBadge genere="lavoro" valore={l.stato} /></button>
                <Menu trigger={<button className="grid h-8 w-8 place-items-center rounded-[10px] text-muted hover:bg-canvas"><MoreVertical size={16} /></button>} voci={[
                  { label: "Registra ore", icona: <Clock size={15} />, onClick: () => apri("ore", { clienteId: id, operatoreId: l.operatoreId ?? undefined, lavoroId: l.id, data: l.data }) },
                  { label: "Modifica", icona: <Pencil size={15} />, onClick: () => apri("lavoro", { id: l.id }) },
                  { label: "Elimina", icona: <Trash2 size={15} />, pericolo: true, separa: true, onClick: () => chiediConferma({ titolo: "Eliminare il lavoro?", pericolo: true, testoConferma: "Elimina", onConfirm: () => elimina(l.id) }) },
                ]} />
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

/* ----------------------------- Pagamenti ----------------------------- */
function SezionePagamenti({ id }: { id: string }) {
  const db = useStore((s) => s.db);
  const apri = useUI((s) => s.apri);
  const registra = useStore((s) => s.registraIncasso);
  const mostra = useToast((s) => s.mostra);
  const pagamenti = db.pagamenti.filter((p) => p.clienteId === id).sort((a, b) => b.dataEmissione.localeCompare(a.dataEmissione));
  return (
    <div>
      <div className="mb-3 flex justify-end gap-2">
        <Button variante="soft" dim="sm" onClick={() => apri("preventivo", { clienteId: id })}><ReceiptText size={15} /> Preventivo</Button>
        <Button variante="soft" dim="sm" onClick={() => apri("incasso", { clienteId: id })}><Banknote size={15} /> Incasso</Button>
      </div>
      {pagamenti.length === 0 ? <EmptyState icona={<Banknote size={24} />} testo="Nessun pagamento." /> : (
        <Table>
          <thead><tr><Th>Emesso</Th><Th>Origine</Th><Th className="text-right">Atteso</Th><Th className="text-right">Incassato</Th><Th>Stato</Th><Th></Th></tr></thead>
          <tbody>
            {pagamenti.map((p) => {
              const st = statoCalcolato(p);
              return (
                <Tr key={p.id}>
                  <Td>{dataIT(p.dataEmissione)}</Td>
                  <Td>{etichetta(p.origine)}</Td>
                  <Td className="text-right tabular-nums">{euro(p.importoAtteso)}</Td>
                  <Td className="text-right tabular-nums">{euro(p.importoIncassato)}</Td>
                  <Td><StatusBadge genere="pagamento" valore={st} /></Td>
                  <Td className="text-right">{st !== "pagato" && <Button dim="sm" onClick={() => { registra(p.id); mostra("Incasso registrato."); }}>Incassa</Button>}</Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}

/* -------------------------------- Ore -------------------------------- */
function SezioneOre({ id }: { id: string }) {
  const db = useStore((s) => s.db);
  const apri = useUI((s) => s.apri);
  const genera = useStore((s) => s.generaCompensoCliente);
  const mostra = useToast((s) => s.mostra);
  const ore = db.ore.filter((o) => o.clienteId === id).sort((a, b) => b.data.localeCompare(a.data));
  const operatore = (oid?: string | null) => db.operatori.find((o) => o.id === oid)?.nome ?? "—";
  const r = riepilogoCliente(db, id);
  const oggi = new Date();
  function compenso() {
    const res = genera(id, oggi.getFullYear(), oggi.getMonth() + 1);
    mostra(res.messaggio, res.ok ? "success" : "error");
  }
  return (
    <div>
      <div className="mb-3 grid grid-cols-3 gap-2">
        <div className="rounded-[12px] border border-line bg-surface p-2.5 text-center"><div className="text-[0.6rem] font-bold uppercase tracking-wide text-muted">Ore</div><div className="font-display text-[1rem] font-bold text-ink">{fmtOre(r.oreTotali)}</div></div>
        <div className="rounded-[12px] border border-line bg-surface p-2.5 text-center"><div className="text-[0.6rem] font-bold uppercase tracking-wide text-muted">Manodopera</div><div className="font-display text-[1rem] font-bold text-uscita-600">{euro(r.costoManodopera)}</div></div>
        <div className="rounded-[12px] border border-line bg-surface p-2.5 text-center"><div className="text-[0.6rem] font-bold uppercase tracking-wide text-muted">Fatturabile</div><div className="font-display text-[1rem] font-bold text-preventivo-600">{euro(r.valoreFatturabile)}</div></div>
      </div>
      <div className="mb-3 flex justify-end gap-2">
        <Button variante="outline" dim="sm" onClick={compenso}><Sparkles size={15} /> Genera incasso del mese</Button>
        <Button variante="soft" dim="sm" onClick={() => apri("ore", { clienteId: id })}><Plus size={15} /> Ore</Button>
      </div>
      {ore.length === 0 ? <EmptyState icona={<Clock size={24} />} testo="Nessuna ora registrata." /> : (
        <Card className="divide-y divide-line overflow-hidden">
          {ore.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-3 p-3.5 text-sm">
              <span className="text-ink-soft">{dataIT(o.data)} · {operatore(o.operatoreId)}{o.note ? ` · ${o.note}` : ""}</span>
              <b className="text-ink">{fmtOre(o.ore)}</b>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

/* ------------------------------- Spese ------------------------------- */
function SezioneSpese({ id }: { id: string }) {
  const db = useStore((s) => s.db);
  const apri = useUI((s) => s.apri);
  const spese = db.spese.filter((s) => s.clienteId === id).sort((a, b) => b.data.localeCompare(a.data));
  const totale = spese.reduce((a, s) => a + s.importo, 0);
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink-soft">Totale <b className="text-spesa-600">{euro(totale)}</b></span>
        <Button variante="soft" dim="sm" onClick={() => apri("spesa", { clienteId: id })}><Plus size={15} /> Spesa</Button>
      </div>
      {spese.length === 0 ? <EmptyState icona={<Fuel size={24} />} testo="Nessuna spesa attribuita." /> : (
        <Card className="divide-y divide-line overflow-hidden">
          {spese.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 p-3.5 text-sm">
              <span className="text-ink-soft">{dataIT(s.data)} · {etichetta(s.categoria)}{s.descrizione ? ` · ${s.descrizione}` : ""}</span>
              <b className="text-spesa-600">{euro(s.importo)}</b>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
