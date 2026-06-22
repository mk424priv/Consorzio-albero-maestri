import { useMemo, useState } from "react";
import { Fuel, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/store/store";
import { dataIT, euro, inputData, meseAnnoIT } from "@/lib/format";
import { CATEGORIA_SPESA, etichetta } from "@/lib/dominio";
import type { CategoriaSpesa } from "@/lib/dominio";
import { Button, Card, EmptyState, Field, Input, PageHeader, Select, Stat } from "@/components/ui";
import RigaEditabile, { type Cella } from "@/components/RigaEditabile";
import { Modal } from "@/components/Modal";
import { useToast } from "@/store/toast";

const oggiISO = () => new Date().toISOString().slice(0, 10);

export function Spese() {
  const db = useStore((s) => s.db);
  const creaSpesa = useStore((s) => s.creaSpesa);
  const aggiornaSpesa = useStore((s) => s.aggiornaSpesa);
  const eliminaSpesa = useStore((s) => s.eliminaSpesa);
  const mostra = useToast((s) => s.mostra);
  const [modale, setModale] = useState(false);
  const [f, setF] = useState({ categoria: "benzina" as CategoriaSpesa, importo: "", data: oggiISO(), clienteId: "", descrizione: "" });

  const oggi = new Date();
  const { spese, totaleMese, nMese } = useMemo(() => {
    const inizioMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1);
    const spese = [...db.spese].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 60);
    const delMese = db.spese.filter((s) => new Date(s.data) >= inizioMese);
    return { spese, totaleMese: delMese.reduce((a, s) => a + s.importo, 0), nMese: delMese.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);

  function salva(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(f.importo.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) {
      mostra("Indica un importo valido.", "error");
      return;
    }
    creaSpesa({
      categoria: f.categoria,
      importo: n,
      data: f.data || oggiISO(),
      clienteId: f.clienteId || null,
      descrizione: f.descrizione || null,
    });
    mostra("Spesa aggiunta!");
    setModale(false);
    setF({ categoria: "benzina", importo: "", data: oggiISO(), clienteId: "", descrizione: "" });
  }

  const nomeCliente = (id?: string | null) => {
    const c = db.clienti.find((x) => x.id === id);
    return c ? `${c.nome} ${c.cognome}` : "—";
  };

  return (
    <div>
      <PageHeader
        titolo="Spese"
        sottotitolo="Benzina, materiali e altre uscite"
        icona={<Fuel size={22} />}
        azione={<Button variante="primary" onClick={() => setModale(true)}><Plus size={16} /> Nuova spesa</Button>}
      />

      <div className="mb-6 grid max-w-md grid-cols-2 gap-3">
        <Stat etichetta={`Spese ${meseAnnoIT(oggi.getFullYear(), oggi.getMonth() + 1)}`} valore={euro(totaleMese)} tono="negativo" icona={<Fuel size={16} />} />
        <Stat etichetta="Voci registrate" valore={String(nMese)} />
      </div>

      {spese.length === 0 ? (
        <EmptyState icona={<Fuel size={26} />} testo="Nessuna spesa registrata." azione={<Button variante="primary" onClick={() => setModale(true)}><Plus size={16} /> Nuova spesa</Button>} />
      ) : (
        <Card className="overflow-x-auto">
          <table className="am-table">
            <thead>
              <tr><th></th><th>Data</th><th>Categoria</th><th>Descrizione</th><th>Cliente</th><th className="text-right">Importo</th><th></th></tr>
            </thead>
            <tbody>
              {spese.map((s) => {
                const celle: Cella[] = [
                  { tipo: "data", nome: "data", valore: inputData(s.data), display: dataIT(s.data) },
                  { tipo: "select", nome: "categoria", valore: s.categoria, opzioni: CATEGORIA_SPESA.map((c) => ({ v: c, l: etichetta(c) })), display: etichetta(s.categoria) },
                  { tipo: "testo", nome: "descrizione", valore: s.descrizione ?? "", classe: "text-muted", display: s.descrizione ?? "—" },
                  { tipo: "statico", classe: "text-muted", nodo: s.clienteId ? nomeCliente(s.clienteId) : "—" },
                  { tipo: "numero", nome: "importo", valore: String(s.importo), step: "0.01", classe: "text-right", display: <span className="font-semibold">{euro(s.importo)}</span> },
                  {
                    tipo: "statico", classe: "text-right",
                    nodo: (
                      <button onClick={() => { eliminaSpesa(s.id); mostra("Spesa eliminata.", "info"); }} className="inline-flex items-center gap-1 text-xs font-medium text-danger hover:underline">
                        <Trash2 size={13} /> Elimina
                      </button>
                    ),
                  },
                ];
                return (
                  <RigaEditabile
                    key={s.id}
                    celle={celle}
                    onSave={(v) => {
                      aggiornaSpesa(s.id, {
                        data: v.data || s.data,
                        categoria: v.categoria as CategoriaSpesa,
                        descrizione: v.descrizione.trim() || null,
                        importo: Number(v.importo.replace(",", ".")) || s.importo,
                      });
                      mostra("Spesa aggiornata.");
                    }}
                  />
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Modal aperto={modale} onClose={() => setModale(false)} titolo="Nuova spesa">
        <form className="grid gap-4" onSubmit={salva}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Categoria">
              <Select value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value as CategoriaSpesa })}>
                {CATEGORIA_SPESA.map((c) => <option key={c} value={c}>{etichetta(c)}</option>)}
              </Select>
            </Field>
            <Field label="Importo (€) *"><Input type="number" step="0.01" value={f.importo} onChange={(e) => setF({ ...f, importo: e.target.value })} required /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Data"><Input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} /></Field>
            <Field label="Cliente (facoltativo)">
              <Select value={f.clienteId} onChange={(e) => setF({ ...f, clienteId: e.target.value })}>
                <option value="">— nessuno —</option>
                {db.clienti.map((c) => <option key={c.id} value={c.id}>{c.nome} {c.cognome}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Descrizione"><Input value={f.descrizione} onChange={(e) => setF({ ...f, descrizione: e.target.value })} placeholder="es. Pieno furgone" /></Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" onClick={() => setModale(false)}>Annulla</Button>
            <Button variante="primary" type="submit"><Plus size={16} /> Aggiungi spesa</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
