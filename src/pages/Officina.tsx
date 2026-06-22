import { useMemo, useState } from "react";
import { Plus, Trash2, Wrench } from "lucide-react";
import { useStore } from "@/store/store";
import { dataIT, euro, inputData } from "@/lib/format";
import { etichetta, STATO_ATTREZZO } from "@/lib/dominio";
import type { StatoAttrezzo } from "@/lib/dominio";
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Select, Stat } from "@/components/ui";
import RigaEditabile, { type Cella } from "@/components/RigaEditabile";
import { Modal } from "@/components/Modal";
import { useToast } from "@/store/toast";

export function Officina() {
  const db = useStore((s) => s.db);
  const creaAttrezzo = useStore((s) => s.creaAttrezzo);
  const aggiornaAttrezzo = useStore((s) => s.aggiornaAttrezzo);
  const eliminaAttrezzo = useStore((s) => s.eliminaAttrezzo);
  const mostra = useToast((s) => s.mostra);
  const [modale, setModale] = useState(false);
  const [f, setF] = useState({ nome: "", costoAcquisto: "", dataAcquisto: "", stato: "ok" as StatoAttrezzo });

  const attrezzi = useMemo(
    () => [...db.attrezzi].sort((a, b) => a.nome.localeCompare(b.nome, "it")),
    [db],
  );
  const valore = attrezzi.reduce((a, x) => a + (x.costoAcquisto ?? 0), 0);

  function salva(e: React.FormEvent) {
    e.preventDefault();
    if (!f.nome.trim()) {
      mostra("Il nome è obbligatorio.", "error");
      return;
    }
    creaAttrezzo({
      nome: f.nome.trim(),
      costoAcquisto: f.costoAcquisto.trim() === "" ? null : Number(f.costoAcquisto.replace(",", ".")),
      dataAcquisto: f.dataAcquisto || null,
      stato: f.stato,
    });
    mostra("Attrezzo aggiunto!");
    setModale(false);
    setF({ nome: "", costoAcquisto: "", dataAcquisto: "", stato: "ok" });
  }

  const badgeTono = (s: string): "success" | "warn" | "muted" =>
    s === "ok" ? "success" : s === "manutenzione" ? "warn" : "muted";

  return (
    <div>
      <PageHeader
        titolo="Officina"
        sottotitolo="Gli strumenti di lavoro"
        icona={<Wrench size={22} />}
        azione={<Button variante="primary" onClick={() => setModale(true)}><Plus size={16} /> Nuovo attrezzo</Button>}
      />

      <div className="mb-6 grid max-w-md grid-cols-2 gap-3">
        <Stat etichetta="Attrezzi" valore={String(attrezzi.length)} icona={<Wrench size={16} />} />
        <Stat etichetta="Valore totale" valore={euro(valore)} tono="brand" />
      </div>

      {attrezzi.length === 0 ? (
        <EmptyState icona={<Wrench size={26} />} testo="Nessun attrezzo registrato." azione={<Button variante="primary" onClick={() => setModale(true)}><Plus size={16} /> Nuovo attrezzo</Button>} />
      ) : (
        <Card className="overflow-x-auto">
          <table className="am-table">
            <thead>
              <tr><th></th><th>Attrezzo</th><th>Acquisto</th><th className="text-right">Costo</th><th>Stato</th><th></th></tr>
            </thead>
            <tbody>
              {attrezzi.map((a) => {
                const celle: Cella[] = [
                  { tipo: "testo", nome: "nome", valore: a.nome, classe: "font-medium text-ink", display: a.nome },
                  { tipo: "data", nome: "dataAcquisto", valore: inputData(a.dataAcquisto), display: a.dataAcquisto ? dataIT(a.dataAcquisto) : "—" },
                  { tipo: "numero", nome: "costoAcquisto", valore: a.costoAcquisto != null ? String(a.costoAcquisto) : "", step: "0.01", classe: "text-right", display: a.costoAcquisto ? euro(a.costoAcquisto) : "—" },
                  {
                    tipo: "select", nome: "stato", valore: a.stato, opzioni: STATO_ATTREZZO.map((s) => ({ v: s, l: etichetta(s) })),
                    display: <Badge tono={badgeTono(a.stato)}>{etichetta(a.stato)}</Badge>,
                  },
                  {
                    tipo: "statico", classe: "text-right",
                    nodo: (
                      <button onClick={() => { eliminaAttrezzo(a.id); mostra("Attrezzo eliminato.", "info"); }} className="inline-flex items-center gap-1 text-xs font-medium text-danger hover:underline">
                        <Trash2 size={13} /> Elimina
                      </button>
                    ),
                  },
                ];
                return (
                  <RigaEditabile
                    key={a.id}
                    celle={celle}
                    onSave={(v) => {
                      aggiornaAttrezzo(a.id, {
                        nome: v.nome.trim() || a.nome,
                        dataAcquisto: v.dataAcquisto || null,
                        costoAcquisto: v.costoAcquisto.trim() === "" ? null : Number(v.costoAcquisto.replace(",", ".")),
                        stato: v.stato as StatoAttrezzo,
                      });
                      mostra("Attrezzo aggiornato.");
                    }}
                  />
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Modal aperto={modale} onClose={() => setModale(false)} titolo="Nuovo attrezzo">
        <form className="grid gap-4" onSubmit={salva}>
          <Field label="Nome *"><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} required /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Costo (€)"><Input type="number" step="0.01" value={f.costoAcquisto} onChange={(e) => setF({ ...f, costoAcquisto: e.target.value })} /></Field>
            <Field label="Data acquisto"><Input type="date" value={f.dataAcquisto} onChange={(e) => setF({ ...f, dataAcquisto: e.target.value })} /></Field>
          </div>
          <Field label="Stato">
            <Select value={f.stato} onChange={(e) => setF({ ...f, stato: e.target.value as StatoAttrezzo })}>
              {STATO_ATTREZZO.map((s) => <option key={s} value={s}>{etichetta(s)}</option>)}
            </Select>
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" onClick={() => setModale(false)}>Annulla</Button>
            <Button variante="primary" type="submit"><Plus size={16} /> Aggiungi</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
