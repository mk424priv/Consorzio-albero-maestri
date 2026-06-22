import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, ReceiptText } from "lucide-react";
import { useStore } from "@/store/store";
import { dataIT, euro, inputData } from "@/lib/format";
import { etichetta, TIPO_PREVENTIVO } from "@/lib/dominio";
import type { TipoPreventivo } from "@/lib/dominio";
import { statoCalcolato } from "@/lib/conti";
import { BadgePagamento, Button, Card, EmptyState, Field, Input, LinkCliente, PageHeader, Select, Textarea } from "@/components/ui";
import RigaEditabile, { type Cella } from "@/components/RigaEditabile";
import { Modal } from "@/components/Modal";
import { useToast } from "@/store/toast";

const oggiISO = () => new Date().toISOString().slice(0, 10);

export function Preventivi() {
  const db = useStore((s) => s.db);
  const creaPreventivo = useStore((s) => s.creaPreventivo);
  const aggiornaPreventivo = useStore((s) => s.aggiornaPreventivo);
  const mostra = useToast((s) => s.mostra);
  const [params, setParams] = useSearchParams();

  const [modale, setModale] = useState(false);
  const [f, setF] = useState({
    clienteId: "",
    tipo: "unico" as TipoPreventivo,
    importoTotale: "",
    importoAcconto: "",
    dataEmissione: oggiISO(),
    dataScadenza: "",
    note: "",
  });

  // apertura automatica con cliente preselezionato (?clienteId=…)
  useEffect(() => {
    const cid = params.get("clienteId");
    if (cid) {
      setF((s) => ({ ...s, clienteId: cid }));
      setModale(true);
      params.delete("clienteId");
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const preventivi = useMemo(
    () =>
      [...db.preventivi]
        .sort((a, b) => b.dataEmissione.localeCompare(a.dataEmissione))
        .map((p) => ({
          p,
          cliente: db.clienti.find((c) => c.id === p.clienteId),
          pagamenti: db.pagamenti.filter((pag) => pag.preventivoId === p.id),
        })),
    [db],
  );

  function salva(e: React.FormEvent) {
    e.preventDefault();
    const tot = Number(f.importoTotale.replace(",", "."));
    if (!f.clienteId || !Number.isFinite(tot) || tot <= 0) {
      mostra("Scegli un cliente e un importo valido.", "error");
      return;
    }
    const acc = f.importoAcconto.trim() === "" ? null : Number(f.importoAcconto.replace(",", "."));
    creaPreventivo({
      clienteId: f.clienteId,
      tipo: f.tipo,
      importoTotale: tot,
      importoAcconto: acc,
      dataEmissione: f.dataEmissione || oggiISO(),
      dataScadenza: f.dataScadenza || null,
      note: f.note || null,
    });
    mostra("Preventivo creato: pagamenti generati.");
    setModale(false);
    setF({ clienteId: "", tipo: "unico", importoTotale: "", importoAcconto: "", dataEmissione: oggiISO(), dataScadenza: "", note: "" });
  }

  return (
    <div>
      <PageHeader
        titolo="Preventivi"
        sottotitolo="Prezzi concordati → pagamenti attesi"
        icona={<ReceiptText size={22} />}
        azione={<Button variante="primary" onClick={() => setModale(true)}><Plus size={16} /> Nuovo preventivo</Button>}
      />

      {preventivi.length === 0 ? (
        <EmptyState icona={<ReceiptText size={26} />} titolo="Nessun preventivo" testo="Crea il primo preventivo: i pagamenti attesi si generano da soli." azione={<Button variante="primary" onClick={() => setModale(true)}><Plus size={16} /> Nuovo preventivo</Button>} />
      ) : (
        <Card className="overflow-x-auto">
          <table className="am-table">
            <thead>
              <tr><th></th><th>Data</th><th>Cliente</th><th>Tipo</th><th className="text-right">Importo</th><th>Pagamenti</th></tr>
            </thead>
            <tbody>
              {preventivi.map(({ p, cliente, pagamenti }) => {
                const celle: Cella[] = [
                  { tipo: "data", nome: "dataEmissione", valore: inputData(p.dataEmissione), display: dataIT(p.dataEmissione) },
                  { tipo: "statico", nodo: cliente ? <LinkCliente id={cliente.id} nome={`${cliente.nome} ${cliente.cognome}`} /> : "—" },
                  {
                    tipo: "select", nome: "tipo", valore: p.tipo,
                    opzioni: TIPO_PREVENTIVO.map((t) => ({ v: t, l: etichetta(t) })),
                    display: (
                      <>
                        {etichetta(p.tipo)}
                        {p.tipo === "acconto_saldo" && (
                          <span className="text-xs text-muted"> ({euro(p.importoAcconto ?? 0)} + {euro(p.importoSaldo ?? 0)})</span>
                        )}
                      </>
                    ),
                  },
                  { tipo: "numero", nome: "importoTotale", valore: String(p.importoTotale), step: "0.01", classe: "text-right", display: <span className="font-semibold">{euro(p.importoTotale)}</span> },
                  {
                    tipo: "statico",
                    nodo: <div className="flex flex-wrap gap-1">{pagamenti.map((pag) => <BadgePagamento key={pag.id} stato={statoCalcolato(pag)} />)}</div>,
                  },
                ];
                return (
                  <RigaEditabile
                    key={p.id}
                    celle={celle}
                    onSave={(v) => {
                      aggiornaPreventivo(p.id, {
                        dataEmissione: v.dataEmissione || p.dataEmissione,
                        tipo: v.tipo as TipoPreventivo,
                        importoTotale: Number(v.importoTotale.replace(",", ".")) || p.importoTotale,
                      });
                      mostra("Preventivo aggiornato.");
                    }}
                  />
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
      <p className="mt-3 text-xs text-muted">Tocca la matita per modificare una riga. Le modifiche aggiornano subito i totali ovunque.</p>

      <Modal aperto={modale} onClose={() => setModale(false)} titolo="Nuovo preventivo" sottotitolo="Genera i pagamenti attesi">
        <form className="grid gap-4" onSubmit={salva}>
          <Field label="Cliente *">
            <Select value={f.clienteId} onChange={(e) => setF({ ...f, clienteId: e.target.value })} required>
              <option value="">— scegli —</option>
              {db.clienti.map((c) => <option key={c.id} value={c.id}>{c.nome} {c.cognome}</option>)}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo *">
              <Select value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value as TipoPreventivo })}>
                {TIPO_PREVENTIVO.map((t) => <option key={t} value={t}>{etichetta(t)}</option>)}
              </Select>
            </Field>
            <Field label="Importo totale (€) *"><Input type="number" step="0.01" value={f.importoTotale} onChange={(e) => setF({ ...f, importoTotale: e.target.value })} required /></Field>
          </div>
          {f.tipo === "acconto_saldo" && (
            <Field label="Acconto (€)" hint="Il saldo è calcolato come totale − acconto. Vuoto = metà.">
              <Input type="number" step="0.01" value={f.importoAcconto} onChange={(e) => setF({ ...f, importoAcconto: e.target.value })} placeholder="vuoto = metà" />
            </Field>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Data emissione"><Input type="date" value={f.dataEmissione} onChange={(e) => setF({ ...f, dataEmissione: e.target.value })} /></Field>
            <Field label="Scadenza incasso"><Input type="date" value={f.dataScadenza} onChange={(e) => setF({ ...f, dataScadenza: e.target.value })} /></Field>
          </div>
          <Field label="Note"><Textarea rows={2} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" onClick={() => setModale(false)}>Annulla</Button>
            <Button variante="primary" type="submit"><Plus size={16} /> Crea preventivo</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
