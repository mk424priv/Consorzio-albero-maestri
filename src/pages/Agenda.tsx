import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MoreVertical, Pencil, Plus, Trash2, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { listaContenitore, listaElemento } from "@/lib/motion";
import { useStore } from "@/store/store";
import { useUI } from "@/store/ui";
import { dataIT } from "@/lib/format";
import type { StatoLavoro } from "@/lib/dominio";
import { ENTITA } from "@/lib/entita";
import { Button, Card, FilterChip, IconButton, Menu, PageHeader, StatusBadge } from "@/components/ui";

const NOMI = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];
const CICLO = { da_fare: "in_corso", in_corso: "fatto", fatto: "da_fare" } as const;

function lunedi(offset: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7);
  return d;
}
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function Agenda() {
  const db = useStore((s) => s.db);
  const apri = useUI((s) => s.apri);
  const cambia = useStore((s) => s.cambiaStatoLavoro);
  const elimina = useStore((s) => s.eliminaLavoro);
  const chiediConferma = useUI((s) => s.chiediConferma);
  const navigate = useNavigate();
  const [offset, setOffset] = useState(0);
  const [opFiltro, setOpFiltro] = useState<string>("tutti");

  const { giorni, inizio, fine } = useMemo(() => {
    const inizio = lunedi(offset);
    const fine = new Date(inizio.getTime() + 6 * 86_400_000);
    const giorni = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(inizio.getTime() + i * 86_400_000);
      const key = d.toDateString();
      const lavori = db.lavori
        .filter((l) => new Date(l.data).toDateString() === key && (opFiltro === "tutti" || l.operatoreId === opFiltro))
        .sort((a, b) => (a.ordineNelGiorno ?? 99) - (b.ordineNelGiorno ?? 99));
      return { d, lavori };
    });
    return { giorni, inizio, fine };
  }, [db, offset, opFiltro]);

  const oggi = new Date();
  const isOggi = (d: Date) => d.toDateString() === oggi.toDateString();
  const cliente = (cid: string) => { const c = db.clienti.find((x) => x.id === cid); return c ? `${c.nome} ${c.cognome}` : "—"; };
  const operatore = (oid?: string | null) => db.operatori.find((o) => o.id === oid);

  return (
    <div>
      <PageHeader
        titolo="Agenda"
        sottotitolo={`${dataIT(inizio)} — ${dataIT(fine)}`}
        icona={<CalendarDays size={22} />}
        azione={
          <div className="flex items-center gap-2">
            <IconButton label="Settimana precedente" onClick={() => setOffset((o) => o - 1)}><ChevronLeft size={18} /></IconButton>
            {offset !== 0 && <Button dim="sm" onClick={() => setOffset(0)}>Oggi</Button>}
            <IconButton label="Settimana successiva" onClick={() => setOffset((o) => o + 1)}><ChevronRight size={18} /></IconButton>
            <Button variante="primary" onClick={() => apri("lavoro", { data: iso(oggi) })} className="hidden sm:inline-flex"><Plus size={16} /> Lavoro</Button>
          </div>
        }
      />

      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <FilterChip attivo={opFiltro === "tutti"} onClick={() => setOpFiltro("tutti")}>Tutta la squadra</FilterChip>
        {db.operatori.filter((o) => o.attivo).map((o) => (
          <FilterChip key={o.id} attivo={opFiltro === o.id} onClick={() => setOpFiltro(o.id)}>{o.nome}</FilterChip>
        ))}
      </div>

      <motion.div variants={listaContenitore} initial="hidden" animate="show" className="grid gap-3 lg:grid-cols-2">
        {giorni.map(({ d, lavori }) => (
          <motion.div key={d.toISOString()} variants={listaElemento}>
            <Card className={cn("overflow-hidden", isOggi(d) && "ring-2 ring-brand-300")}>
              <div className="flex items-center justify-between border-b border-line bg-surface-2 px-4 py-2.5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
                  <span className={cn("grid h-8 w-8 place-items-center rounded-[10px] text-[0.7rem]", isOggi(d) ? "bg-brand-500 text-white" : "bg-surface text-muted")}>{d.getDate()}</span>
                  {NOMI[(d.getDay() + 6) % 7]}
                </h3>
                <button onClick={() => apri("lavoro", { data: iso(d) })} className="grid h-7 w-7 place-items-center rounded-[9px] text-muted transition hover:bg-brand-50 hover:text-brand-600"><Plus size={16} /></button>
              </div>
              {lavori.length === 0 ? (
                <p className="px-4 py-4 text-sm text-muted">Niente in programma.</p>
              ) : (
                <div className="divide-y divide-line">
                  {lavori.map((l) => {
                    const op = operatore(l.operatoreId);
                    return (
                      <div key={l.id} className="flex items-center gap-2.5 p-3">
                        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[11px] ${ENTITA.lavoro.soft}`}><ENTITA.lavoro.Icon size={16} /></span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-ink">{l.titolo}</div>
                          <div className="flex items-center gap-1.5 text-[0.72rem] text-muted">
                            {cliente(l.clienteId)}
                            {op && <span className="inline-flex items-center gap-1"><User size={11} /> {op.nome}</span>}
                          </div>
                        </div>
                        <button onClick={() => cambia(l.id, CICLO[l.stato as StatoLavoro])}><StatusBadge genere="lavoro" valore={l.stato} /></button>
                        <Menu trigger={<button className="grid h-8 w-8 place-items-center rounded-[10px] text-muted hover:bg-canvas"><MoreVertical size={16} /></button>} voci={[
                          { label: "Apri cliente", icona: <User size={15} />, onClick: () => navigate(`/cliente/${l.clienteId}`) },
                          { label: "Registra ore", icona: <Clock size={15} />, onClick: () => apri("ore", { clienteId: l.clienteId, operatoreId: l.operatoreId ?? undefined, data: l.data }) },
                          { label: "Modifica", icona: <Pencil size={15} />, onClick: () => apri("lavoro", { id: l.id }) },
                          { label: "Elimina", icona: <Trash2 size={15} />, pericolo: true, separa: true, onClick: () => chiediConferma({ titolo: "Eliminare il lavoro?", pericolo: true, testoConferma: "Elimina", onConfirm: () => elimina(l.id) }) },
                        ]} />
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
