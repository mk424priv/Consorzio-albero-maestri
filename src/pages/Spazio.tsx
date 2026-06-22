import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock,
  ChevronDown,
  Clock,
  LayoutGrid,
  Phone,
  Plus,
  ReceiptText,
  Rows3,
  Sprout,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { listaContenitore, listaElemento } from "@/lib/motion";
import { useStore } from "@/store/store";
import { useUI } from "@/store/ui";
import { codiceCliente, leggiCodice } from "@/lib/codice-parlante";
import { riepilogoCliente, statoCalcolato } from "@/lib/conti";
import { panoramicaSpazio } from "@/lib/movimenti";
import { dataIT, euro } from "@/lib/format";
import { etichetta } from "@/lib/dominio";
import type { Cliente, Lavoro } from "@/lib/types";
import {
  Avatar,
  Badge,
  Button,
  Codice,
  EmptyState,
  FilterChip,
  HeroStat,
  IconButton,
  LinkButton,
  PageHero,
  Select,
  StatusBadge,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/ui";

type Filtro = "tutti" | "da_incassare" | "in_ritardo" | "ore" | "preventivo";
type Ordine = "nome" | "saldo" | "recente";

function prossimoLavoro(lavori: Lavoro[]): Lavoro | undefined {
  const oggi = new Date().toISOString().slice(0, 10);
  const futuri = lavori.filter((l) => l.data >= oggi && l.stato !== "fatto").sort((a, b) => a.data.localeCompare(b.data));
  if (futuri[0]) return futuri[0];
  return [...lavori].sort((a, b) => b.data.localeCompare(a.data))[0];
}

export function Spazio() {
  const db = useStore((s) => s.db);
  const apri = useUI((s) => s.apri);
  const vista = useUI((s) => s.vista);
  const setVista = useUI((s) => s.setVista);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";

  const [filtro, setFiltro] = useState<Filtro>("tutti");
  const [ordine, setOrdine] = useState<Ordine>("nome");

  const pan = useMemo(() => panoramicaSpazio(db), [db]);

  const righe = useMemo(() => {
    const dati = db.clienti.map((cliente) => {
      const codice = codiceCliente(db, cliente.id);
      const r = riepilogoCliente(db, cliente.id);
      const lavoriCli = db.lavori.filter((l) => l.clienteId === cliente.id);
      const inRitardo = db.pagamenti.some((p) => p.clienteId === cliente.id && statoCalcolato(p) === "in_ritardo");
      return { cliente, codice, parti: leggiCodice(codice), saldo: r.saldoDaIncassare, prossimo: prossimoLavoro(lavoriCli), inRitardo, ultimo: lavoriCli.sort((a, b) => b.data.localeCompare(a.data))[0]?.data ?? "" };
    });
    const fl = q.trim().toLowerCase();
    let out = dati.filter((d) => {
      if (fl && !`${d.cliente.nome} ${d.cliente.cognome} ${d.cliente.luogo ?? ""}`.toLowerCase().includes(fl)) return false;
      if (filtro === "da_incassare") return d.saldo > 0;
      if (filtro === "in_ritardo") return d.inRitardo;
      if (filtro === "ore") return d.cliente.modalitaPredefinita === "ore";
      if (filtro === "preventivo") return d.cliente.modalitaPredefinita === "preventivo";
      return true;
    });
    out = out.sort((a, b) => {
      if (ordine === "saldo") return b.saldo - a.saldo;
      if (ordine === "recente") return (b.ultimo || "").localeCompare(a.ultimo || "");
      return (a.cliente.cognome + a.cliente.nome).localeCompare(b.cliente.cognome + b.cliente.nome, "it");
    });
    return out;
  }, [db, q, filtro, ordine]);

  const FILTRI: { k: Filtro; label: string }[] = [
    { k: "tutti", label: "Tutti" },
    { k: "da_incassare", label: "Da incassare" },
    { k: "in_ritardo", label: "In ritardo" },
    { k: "ore", label: "A ore" },
    { k: "preventivo", label: "A preventivo" },
  ];

  return (
    <div>
      <PageHero
        grad="bg-gradient-to-br from-brand-500 via-brand-500 to-cliente-700"
        eyebrow="Spazio di lavoro"
        titolo="I tuoi clienti"
        sottotitolo="Il cuore di tutto. Tocca un indicatore per filtrare."
        icona={<Sprout size={22} />}
        azione={
          <div className="hidden items-center gap-2 sm:flex">
            <div className="flex rounded-[11px] bg-white/12 p-1 backdrop-blur">
              <button onClick={() => setVista("carte")} aria-label="Carte" className={cn("grid h-8 w-8 place-items-center rounded-[8px] text-white/75 transition", vista === "carte" && "bg-white/25 text-white")}><LayoutGrid size={16} /></button>
              <button onClick={() => setVista("tabella")} aria-label="Tabella" className={cn("grid h-8 w-8 place-items-center rounded-[8px] text-white/75 transition", vista === "tabella" && "bg-white/25 text-white")}><Rows3 size={16} /></button>
            </div>
            <Button variante="glass" onClick={() => apri("cliente")}><Plus size={16} /> Nuovo cliente</Button>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <HeroStat label="Da incassare" valore={euro(pan.daIncassare)} nota={pan.clientiInRitardo ? `${pan.clientiInRitardo} in ritardo` : "in regola"} onClick={() => setFiltro("da_incassare")} />
          <HeroStat label="Incassato mese" valore={euro(pan.incassatoMese)} onClick={() => navigate("/soldi")} />
          <HeroStat label="Lavori oggi" valore={String(pan.lavoriOggi)} onClick={() => navigate("/agenda")} />
          <HeroStat label="Da pagare team" valore={euro(pan.daPagareSquadra)} onClick={() => navigate("/squadra")} />
        </div>
      </PageHero>

      {/* filtri */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {FILTRI.map((f) => <FilterChip key={f.k} attivo={filtro === f.k} onClick={() => setFiltro(f.k)}>{f.label}</FilterChip>)}
        <div className="ml-auto w-36 shrink-0">
          <Select
            value={ordine}
            onChange={(v) => setOrdine(v as Ordine)}
            className="!h-9 !rounded-full"
            ariaLabel="Ordina"
            options={[
              { value: "nome", label: "Ordina: Nome" },
              { value: "saldo", label: "Ordina: Saldo" },
              { value: "recente", label: "Ordina: Recente" },
            ]}
          />
        </div>
      </div>

      {righe.length === 0 ? (
        <EmptyState icona={<Sprout size={26} />} titolo={q || filtro !== "tutti" ? "Nessun cliente" : "Inizia da qui"} testo={q || filtro !== "tutti" ? "Nessun cliente con questi criteri." : "Aggiungi il primo cliente: tutto il resto cresce da lui."} azione={<Button variante="primary" onClick={() => apri("cliente")}><Plus size={16} /> Nuovo cliente</Button>} />
      ) : vista === "tabella" ? (
        <TabellaClienti righe={righe} />
      ) : (
        <motion.div variants={listaContenitore} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {righe.map((r) => <ClienteCard key={r.cliente.id} {...r} />)}
        </motion.div>
      )}

      {/* nuovo cliente mobile */}
      <div className="sm:hidden">
        <button onClick={() => apri("cliente")} className="mt-4 flex w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-brand-200 bg-brand-50/50 py-3 text-sm font-bold text-brand-600">
          <Plus size={17} /> Nuovo cliente
        </button>
      </div>
    </div>
  );
}

type RigaCliente = {
  cliente: Cliente;
  codice: string;
  parti: ReturnType<typeof leggiCodice>;
  saldo: number;
  prossimo?: Lavoro;
  inRitardo: boolean;
};

function ClienteCard({ cliente, codice, parti, saldo, prossimo, inRitardo }: RigaCliente) {
  const apri = useUI((s) => s.apri);
  const db = useStore((s) => s.db);
  const [aperto, setAperto] = useState(false);

  const pagamenti = useMemo(
    () => db.pagamenti.filter((p) => p.clienteId === cliente.id).sort((a, b) => b.dataEmissione.localeCompare(a.dataEmissione)).slice(0, 3),
    [db, cliente.id],
  );

  return (
    <motion.div variants={listaElemento} className="flex flex-col rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]">
      <Link to={`/cliente/${cliente.id}`} className="flex items-start gap-3 p-4 pb-3">
        <Avatar nome={`${cliente.nome} ${cliente.cognome}`} grad="bg-gradient-to-br from-cliente-500 to-brand-700" size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate font-bold text-ink">{cliente.nome} {cliente.cognome}</h3>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Codice codice={codice} />
            <span className="text-[0.72rem] text-muted">{etichetta(cliente.modalitaPredefinita)}</span>
          </div>
        </div>
      </Link>

      <div className="grid grid-cols-3 gap-2 px-4">
        {[
          { l: "Paga in", v: `${parti.giorni}g` },
          { l: "Spesa media", v: euro(parti.spesaMedia) },
          { l: "Insieme da", v: `${parti.anni}a` },
        ].map((s) => (
          <div key={s.l} className="rounded-[11px] bg-surface-2 px-2 py-1.5 text-center">
            <div className="text-[0.62rem] font-semibold uppercase tracking-wide text-muted">{s.l}</div>
            <div className="text-[0.82rem] font-bold text-ink">{s.v}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 px-4 py-3">
        {saldo > 0 ? (
          <Badge tono={inRitardo ? "danger" : "warn"}>{euro(saldo)} da incassare</Badge>
        ) : (
          <Badge tono="success">In pari</Badge>
        )}
        <div className="flex items-center gap-1 text-[0.74rem] text-muted">
          <CalendarClock size={13} />
          {prossimo ? <span className="truncate">{dataIT(prossimo.data).slice(0, 5)} · {prossimo.titolo}</span> : "nessun lavoro"}
        </div>
      </div>

      <div className="mt-auto flex items-center gap-1 border-t border-line p-2">
        <LinkButton to={`/cliente/${cliente.id}`} variante="soft" dim="sm" className="flex-1">Apri</LinkButton>
        <IconButton label="Registra ore" onClick={() => apri("ore", { clienteId: cliente.id })}><Clock size={16} /></IconButton>
        <IconButton label="Nuovo preventivo" onClick={() => apri("preventivo", { clienteId: cliente.id })}><ReceiptText size={16} /></IconButton>
        {cliente.telefono && (
          <a href={`tel:${cliente.telefono}`} className="grid h-9 w-9 place-items-center rounded-[11px] text-muted transition hover:bg-brand-50 hover:text-brand-600" aria-label="Chiama"><Phone size={16} /></a>
        )}
        <IconButton label="Espandi" onClick={() => setAperto((a) => !a)}>
          <motion.span animate={{ rotate: aperto ? 180 : 0 }}><ChevronDown size={16} /></motion.span>
        </IconButton>
      </div>

      <AnimatePresence initial={false}>
        {aperto && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden border-t border-line">
            <div className="p-4">
              <div className="mb-2 text-[0.7rem] font-bold uppercase tracking-wide text-muted">Ultimi pagamenti</div>
              {pagamenti.length === 0 ? (
                <p className="text-sm text-muted">Nessun pagamento.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {pagamenti.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-ink-soft"><StatusBadge genere="pagamento" valore={statoCalcolato(p)} />{etichetta(p.origine)}</span>
                      <b className="tabular-nums">{euro(p.importoAtteso)}</b>
                    </div>
                  ))}
                </div>
              )}
              <Link to={`/cliente/${cliente.id}`} className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">Apri scheda completa →</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TabellaClienti({ righe }: { righe: RigaCliente[] }) {
  const navigate = useNavigate();
  return (
    <Table>
      <thead>
        <tr>
          <Th>Cliente</Th>
          <Th>Codice</Th>
          <Th className="hidden md:table-cell">Accordo</Th>
          <Th className="hidden md:table-cell">Prossimo lavoro</Th>
          <Th className="text-right">Saldo</Th>
          <Th>Stato</Th>
        </tr>
      </thead>
      <tbody>
        {righe.map(({ cliente, codice, saldo, prossimo, inRitardo }) => (
          <Tr key={cliente.id} onClick={() => navigate(`/cliente/${cliente.id}`)}>
            <Td>
              <div className="flex items-center gap-2.5">
                <Avatar nome={`${cliente.nome} ${cliente.cognome}`} size="sm" />
                <span className="font-semibold text-ink">{cliente.nome} {cliente.cognome}</span>
              </div>
            </Td>
            <Td><Codice codice={codice} /></Td>
            <Td className="hidden text-muted md:table-cell">{etichetta(cliente.modalitaPredefinita)}</Td>
            <Td className="hidden text-muted md:table-cell">{prossimo ? `${dataIT(prossimo.data).slice(0, 5)} · ${prossimo.titolo}` : "—"}</Td>
            <Td className="text-right">{saldo > 0 ? <b className="text-danger">{euro(saldo)}</b> : <span className="text-muted">—</span>}</Td>
            <Td>{saldo > 0 ? <Badge tono={inRitardo ? "danger" : "warn"}>{inRitardo ? "In ritardo" : "Aperto"}</Badge> : <Badge tono="success">In pari</Badge>}</Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}
