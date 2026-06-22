import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Clock, Save, Sparkles } from "lucide-react";
import { useStore } from "@/store/store";
import { dataIT, euro, meseAnnoIT, ore as fmtOre } from "@/lib/format";
import { Button, Card, EmptyState, Field, Input, LinkCliente, PageHeader, Select } from "@/components/ui";
import { useToast } from "@/store/toast";

const oggiISO = () => new Date().toISOString().slice(0, 10);

export function Ore() {
  const db = useStore((s) => s.db);
  const registraOre = useStore((s) => s.registraOre);
  const generaCompensoMese = useStore((s) => s.generaCompensoMese);
  const mostra = useToast((s) => s.mostra);
  const [params] = useSearchParams();

  const oggi = new Date();
  const [f, setF] = useState({
    clienteId: params.get("clienteId") ?? "",
    data: oggiISO(),
    ore: "",
    personaId: "",
    note: "",
  });

  const { perCliente, recenti } = useMemo(() => {
    const inizioMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1);
    const perCliente = new Map<string, { nome: string; ore: number; tariffa: number | null }>();
    for (const r of db.ore) {
      if (new Date(r.data) < inizioMese) continue;
      const cl = db.clienti.find((c) => c.id === r.clienteId);
      if (!cl) continue;
      const e = perCliente.get(r.clienteId) ?? { nome: `${cl.nome} ${cl.cognome}`, ore: 0, tariffa: cl.tariffaOraria ?? null };
      e.ore += r.ore;
      perCliente.set(r.clienteId, e);
    }
    const recenti = [...db.ore].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 15);
    return { perCliente, recenti };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);

  const nomeCliente = (id: string) => {
    const c = db.clienti.find((x) => x.id === id);
    return c ? `${c.nome} ${c.cognome}` : "—";
  };
  const persona = (pid?: string | null) => db.persone.find((p) => p.id === pid)?.nome;

  function salva(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(f.ore.replace(",", "."));
    if (!f.clienteId || !Number.isFinite(n) || n <= 0) {
      mostra("Scegli un cliente e indica le ore.", "error");
      return;
    }
    registraOre({
      clienteId: f.clienteId,
      data: f.data || oggiISO(),
      ore: n,
      personaId: f.personaId || null,
      note: f.note || null,
    });
    mostra("Ore salvate!");
    setF({ ...f, ore: "", note: "" });
  }

  function compenso(clienteId: string) {
    const r = generaCompensoMese(clienteId, oggi.getFullYear(), oggi.getMonth() + 1);
    mostra(r.messaggio, r.ok ? "success" : "error");
  }

  return (
    <div>
      <PageHeader titolo="Ore" sottotitolo="Segna le ore giorno per giorno" icona={<Clock size={22} />} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-semibold text-ink">Registra ore</h2>
          <Card className="p-5">
            <form className="grid gap-4" onSubmit={salva}>
              <Field label="Cliente *">
                <Select value={f.clienteId} onChange={(e) => setF({ ...f, clienteId: e.target.value })} required>
                  <option value="">— scegli —</option>
                  {db.clienti.map((c) => <option key={c.id} value={c.id}>{c.nome} {c.cognome}</option>)}
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Data"><Input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} /></Field>
                <Field label="Ore *"><Input type="number" step="0.5" value={f.ore} onChange={(e) => setF({ ...f, ore: e.target.value })} placeholder="es. 3.5" required /></Field>
              </div>
              <Field label="Persona">
                <Select value={f.personaId} onChange={(e) => setF({ ...f, personaId: e.target.value })}>
                  <option value="">— nessuno —</option>
                  {db.persone.filter((p) => p.attivo).map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </Select>
              </Field>
              <Field label="Nota"><Input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
              <div><Button variante="primary" type="submit"><Save size={16} /> Salva ore</Button></div>
            </form>
          </Card>
        </section>

        <section>
          <h2 className="mb-3 font-semibold text-ink">Ore di {meseAnnoIT(oggi.getFullYear(), oggi.getMonth() + 1)}</h2>
          {perCliente.size === 0 ? (
            <EmptyState testo="Nessuna ora registrata questo mese." />
          ) : (
            <Card className="divide-y divide-line overflow-hidden">
              {[...perCliente.entries()].map(([id, e]) => (
                <div key={id} className="flex items-center justify-between gap-3 p-3.5">
                  <div className="min-w-0">
                    <LinkCliente id={id} nome={e.nome} />
                    <div className="text-xs text-muted">
                      {fmtOre(e.ore)}
                      {e.tariffa ? ` × ${euro(e.tariffa)}/h = ${euro(e.ore * e.tariffa)}` : " · nessuna tariffa"}
                    </div>
                  </div>
                  {e.tariffa ? (
                    <Button dim="sm" onClick={() => compenso(id)}><Sparkles size={14} /> Genera compenso</Button>
                  ) : (
                    <span className="text-xs text-muted">imposta tariffa</span>
                  )}
                </div>
              ))}
            </Card>
          )}

          <h2 className="mb-3 mt-6 font-semibold text-ink">Ultime registrazioni</h2>
          {recenti.length === 0 ? (
            <EmptyState testo="Ancora nulla." />
          ) : (
            <Card className="divide-y divide-line overflow-hidden">
              {recenti.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3.5 text-sm">
                  <span className="text-ink-soft">
                    {dataIT(r.data)} · {nomeCliente(r.clienteId)}
                    {persona(r.personaId) ? ` · ${persona(r.personaId)}` : ""}
                  </span>
                  <b className="text-ink">{fmtOre(r.ore)}</b>
                </div>
              ))}
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
