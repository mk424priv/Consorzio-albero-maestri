import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useStore } from "@/store/store";
import { dataIT } from "@/lib/format";
import { etichetta, TIPO_COMPENSO } from "@/lib/dominio";
import type { StatoLavoro, TipoCompenso } from "@/lib/dominio";
import { Badge, Button, Card, Field, Input, PageHeader, Select } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { useToast } from "@/store/toast";

const NOMI_GIORNI = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

function lunedi(offsetSettimane: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const giorno = (d.getDay() + 6) % 7; // 0 = lunedì
  d.setDate(d.getDate() - giorno + offsetSettimane * 7);
  return d;
}
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const prossimoStato: Record<StatoLavoro, StatoLavoro> = {
  da_fare: "in_corso",
  in_corso: "fatto",
  fatto: "da_fare",
};

export function Calendario() {
  const db = useStore((s) => s.db);
  const creaLavoro = useStore((s) => s.creaLavoro);
  const cambiaStatoLavoro = useStore((s) => s.cambiaStatoLavoro);
  const mostra = useToast((s) => s.mostra);

  const [offset, setOffset] = useState(0);
  const [modale, setModale] = useState(false);

  const { giorni, inizio, fine } = useMemo(() => {
    const inizio = lunedi(offset);
    const fine = new Date(inizio.getTime() + 6 * 86_400_000);
    const giorni = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(inizio.getTime() + i * 86_400_000);
      const key = d.toDateString();
      const lavoriGiorno = db.lavori
        .filter((l) => new Date(l.data).toDateString() === key)
        .sort((a, b) => (a.ordineNelGiorno ?? 99) - (b.ordineNelGiorno ?? 99));
      return { d, lavoriGiorno };
    });
    return { giorni, inizio, fine };
  }, [db, offset]);

  const oggi = new Date();
  const isOggi = (d: Date) => d.toDateString() === oggi.toDateString();
  const nomeCliente = (cid: string) => {
    const c = db.clienti.find((x) => x.id === cid);
    return c ? `${c.nome} ${c.cognome}` : "—";
  };
  const persona = (pid?: string | null) => db.persone.find((p) => p.id === pid)?.nome;

  // form nuovo lavoro
  const [f, setF] = useState({ clienteId: "", titolo: "", data: iso(oggi), tipoCompenso: "preventivo" as TipoCompenso, personaId: "", luogo: "" });

  function salvaLavoro(e: React.FormEvent) {
    e.preventDefault();
    if (!f.clienteId || !f.titolo.trim()) {
      mostra("Cliente e titolo sono obbligatori.", "error");
      return;
    }
    creaLavoro({
      clienteId: f.clienteId,
      titolo: f.titolo.trim(),
      data: f.data,
      tipoCompenso: f.tipoCompenso,
      personaId: f.personaId || null,
      luogo: f.luogo || null,
    });
    mostra("Lavoro aggiunto al calendario!");
    setModale(false);
    setF({ clienteId: "", titolo: "", data: iso(oggi), tipoCompenso: "preventivo", personaId: "", luogo: "" });
  }

  return (
    <div>
      <PageHeader
        titolo="Calendario"
        sottotitolo={`${dataIT(inizio)} — ${dataIT(fine)}`}
        icona={<CalendarDays size={22} />}
        azione={
          <>
            <Button dim="icon" onClick={() => setOffset((o) => o - 1)} aria-label="Settimana precedente"><ChevronLeft size={18} /></Button>
            {offset !== 0 && <Button onClick={() => setOffset(0)}>Oggi</Button>}
            <Button dim="icon" onClick={() => setOffset((o) => o + 1)} aria-label="Settimana successiva"><ChevronRight size={18} /></Button>
            <Button variante="primary" onClick={() => setModale(true)}><Plus size={16} /> Nuovo lavoro</Button>
          </>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
        {giorni.map(({ d, lavoriGiorno }) => (
          <Card key={d.toISOString()} className={`p-4 ${isOggi(d) ? "ring-2 ring-brand-300" : ""}`}>
            <div className="mb-2.5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold text-ink">
                {NOMI_GIORNI[(d.getDay() + 6) % 7]} {d.getDate()}
                {isOggi(d) && <Badge tono="success">Oggi</Badge>}
              </h3>
              <span className="text-xs text-muted">
                {lavoriGiorno.length} {lavoriGiorno.length === 1 ? "lavoro" : "lavori"}
              </span>
            </div>
            {lavoriGiorno.length === 0 ? (
              <p className="text-sm text-muted">—</p>
            ) : (
              <div className="grid gap-2">
                {lavoriGiorno.map((l) => (
                  <div key={l.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 p-3 transition hover:border-brand-200">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-ink">{l.titolo}</div>
                      <div className="truncate text-xs text-muted">
                        {nomeCliente(l.clienteId)}
                        {persona(l.personaId) ? ` · ${persona(l.personaId)}` : ""}
                      </div>
                    </div>
                    <button
                      onClick={() => cambiaStatoLavoro(l.id, prossimoStato[l.stato])}
                      title="Cambia stato"
                      className={`badge ${l.stato === "fatto" ? "badge-success" : l.stato === "in_corso" ? "badge-warn" : "badge-muted"} shrink-0 cursor-pointer transition hover:brightness-95`}
                    >
                      {etichetta(l.stato)}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      <Modal aperto={modale} onClose={() => setModale(false)} titolo="Nuovo lavoro" sottotitolo="Aggiungilo alla settimana">
        <form className="grid gap-4" onSubmit={salvaLavoro}>
          <Field label="Cliente *">
            <Select value={f.clienteId} onChange={(e) => setF({ ...f, clienteId: e.target.value })} required>
              <option value="">— scegli —</option>
              {db.clienti.map((c) => <option key={c.id} value={c.id}>{c.nome} {c.cognome}</option>)}
            </Select>
          </Field>
          <Field label="Titolo *"><Input value={f.titolo} onChange={(e) => setF({ ...f, titolo: e.target.value })} placeholder="es. Potatura olivi" required /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Data *"><Input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} required /></Field>
            <Field label="Tipo compenso">
              <Select value={f.tipoCompenso} onChange={(e) => setF({ ...f, tipoCompenso: e.target.value as TipoCompenso })}>
                {TIPO_COMPENSO.map((t) => <option key={t} value={t}>{etichetta(t)}</option>)}
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Assegnato a">
              <Select value={f.personaId} onChange={(e) => setF({ ...f, personaId: e.target.value })}>
                <option value="">— nessuno —</option>
                {db.persone.filter((p) => p.attivo).map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </Select>
            </Field>
            <Field label="Luogo"><Input value={f.luogo} onChange={(e) => setF({ ...f, luogo: e.target.value })} /></Field>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" onClick={() => setModale(false)}>Annulla</Button>
            <Button variante="primary" type="submit"><Plus size={16} /> Aggiungi</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
