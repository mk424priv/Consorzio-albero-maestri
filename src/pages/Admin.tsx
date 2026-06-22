import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, Pencil, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAdmin } from "@/store/admin";
import { useUI } from "@/store/ui";
import { useToast } from "@/store/toast";
import { MODULI, getModulo, tonoStato, type Campo, type Item, type Modulo, type Valore } from "@/lib/admin-moduli";
import {
  AreaIcona, Badge, Button, CampoIcona, Card, EmptyState, Field, IconButton,
  PageHero, Select, Sheet, SheetFooter, Switch, Table, Td, Th, Tr,
} from "@/components/ui";

/* ----------------- helper rendering valori in tabella ---------------- */
function labelOpz(campo: Campo | undefined, v: Valore): string {
  if (campo?.opzioni) return campo.opzioni.find((o) => o.value === v)?.label ?? String(v ?? "—");
  return String(v ?? "—");
}
function CellaValore({ modulo, campo, item }: { modulo: Modulo; campo?: Campo; item: Item }) {
  if (!campo) return <>—</>;
  const v = item[campo.nome];
  if (campo.tipo === "switch") return <Badge tono={tonoStato(v)}>{v ? "Sì" : "No"}</Badge>;
  if (campo.nome === modulo.badge || campo.tipo === "select") return <Badge tono={tonoStato(v)}>{labelOpz(campo, v)}</Badge>;
  if (Array.isArray(v)) return <span className="text-muted">{v.join(", ") || "—"}</span>;
  if (campo.tipo === "number") return <span className="tabular-nums">{v == null || v === "" ? "—" : String(v)}</span>;
  return <span className="text-ink-soft">{v == null || v === "" ? "—" : String(v)}</span>;
}

/* ============================ FORM RECORD =========================== */
function RecordSheet({ modulo, item, onClose }: { modulo: Modulo; item: Item | null; onClose: () => void }) {
  const upsert = useAdmin((s) => s.upsert);
  const mostra = useToast((s) => s.mostra);
  const [f, setF] = useState<Record<string, string | boolean>>(() => {
    const o: Record<string, string | boolean> = {};
    for (const c of modulo.campi) {
      const v = item?.[c.nome];
      o[c.nome] = c.tipo === "switch" ? !!v : Array.isArray(v) ? v.join(", ") : v == null ? "" : String(v);
    }
    return o;
  });
  const set = (k: string, v: string | boolean) => setF((s) => ({ ...s, [k]: v }));

  function salva(e: React.FormEvent) {
    e.preventDefault();
    const out: Item = { id: item?.id ?? "" };
    for (const c of modulo.campi) {
      const raw = f[c.nome];
      if (c.tipo === "switch") out[c.nome] = !!raw;
      else if (c.tipo === "number") out[c.nome] = raw === "" ? null : Number(String(raw).replace(",", "."));
      else if (c.tipo === "tags") out[c.nome] = String(raw).split(",").map((t) => t.trim()).filter(Boolean);
      else out[c.nome] = String(raw);
    }
    if (modulo.titolo && !String(f[modulo.titolo] ?? "").trim()) return mostra("Compila almeno il campo principale.", "error");
    upsert(modulo.coll, out);
    mostra(item ? "Aggiornato!" : "Creato!");
    onClose();
  }

  return (
    <Sheet aperto onClose={onClose} titolo={`${item ? "Modifica" : "Nuovo"} · ${modulo.label}`} sottotitolo={modulo.descrizione} accent="bg-gradient-to-br from-brand-500 to-brand-700" icona={<modulo.Icona size={20} />} motivo={<modulo.Icona size={120} strokeWidth={1.1} />}>
      <form onSubmit={salva} className="grid grid-cols-2 gap-3">
        {modulo.campi.map((c) => (
          <CampoForm key={c.nome} campo={c} valore={f[c.nome]} onChange={(v) => set(c.nome, v)} />
        ))}
        <div className="col-span-2"><SheetFooter><Button type="button" onClick={onClose}>Annulla</Button><Button variante="primary" type="submit"><Save size={16} /> {item ? "Salva" : "Crea"}</Button></SheetFooter></div>
      </form>
    </Sheet>
  );
}

function CampoForm({ campo, valore, onChange }: { campo: Campo; valore: string | boolean; onChange: (v: string | boolean) => void }) {
  const span = campo.larga || campo.tipo === "textarea" ? "col-span-2" : "col-span-2 sm:col-span-1";
  if (campo.tipo === "switch") {
    return (
      <div className={cn(span, "flex items-center justify-between rounded-[13px] border border-line-strong bg-surface px-3.5 py-2.5")}>
        <span className="text-[0.82rem] font-semibold text-ink-soft">{campo.label}</span>
        <Switch checked={!!valore} onCheckedChange={(v) => onChange(v)} />
      </div>
    );
  }
  if (campo.tipo === "textarea") {
    return <div className={span}><AreaIcona label={campo.label} rows={3} value={String(valore)} placeholder={campo.placeholder} onChange={(e) => onChange(e.target.value)} /></div>;
  }
  if (campo.tipo === "select") {
    return (
      <div className={span}>
        <Field label={campo.label}>
          <Select value={String(valore)} onChange={onChange} options={[{ value: "", label: "— scegli —" }, ...(campo.opzioni ?? [])]} placeholder="— scegli —" />
        </Field>
      </div>
    );
  }
  const tipoInput = campo.tipo === "number" ? "number" : campo.tipo === "date" ? "date" : campo.tipo === "email" ? "email" : campo.tipo === "url" ? "url" : "text";
  return <div className={span}><CampoIcona label={campo.label} type={tipoInput} value={String(valore)} placeholder={campo.placeholder} onChange={(e) => onChange(e.target.value)} /></div>;
}

/* ============================ CONFIG VIEW =========================== */
function ConfigView({ modulo }: { modulo: Modulo }) {
  const config = useAdmin((s) => s.config);
  const setConfig = useAdmin((s) => s.setConfig);
  const mostra = useToast((s) => s.mostra);
  const [f, setF] = useState<Record<string, string | boolean>>(() => {
    const o: Record<string, string | boolean> = {};
    for (const c of modulo.campi) o[c.nome] = c.tipo === "switch" ? !!config[c.nome] : config[c.nome] == null ? "" : String(config[c.nome]);
    return o;
  });
  function salva(e: React.FormEvent) {
    e.preventDefault();
    const out: Record<string, Valore> = {};
    for (const c of modulo.campi) out[c.nome] = c.tipo === "switch" ? !!f[c.nome] : String(f[c.nome]);
    setConfig(out);
    mostra("Impostazioni salvate!");
  }
  return (
    <Card className="p-5">
      <form onSubmit={salva} className="grid grid-cols-2 gap-3">
        {modulo.campi.map((c) => (
          <CampoForm key={c.nome} campo={c} valore={f[c.nome]} onChange={(v) => setF((s) => ({ ...s, [c.nome]: v }))} />
        ))}
        <div className="col-span-2 flex justify-end"><Button variante="primary" type="submit"><Save size={16} /> Salva impostazioni</Button></div>
      </form>
    </Card>
  );
}

/* ============================== DASHBOARD =========================== */
export function Admin() {
  const collezioni = useAdmin((s) => s.collezioni);
  const rimuovi = useAdmin((s) => s.rimuovi);
  const reseedAdmin = useAdmin((s) => s.reseedAdmin);
  const chiediConferma = useUI((s) => s.chiediConferma);
  const mostra = useToast((s) => s.mostra);

  const [modId, setModId] = useState(MODULI[0].id);
  const [sheet, setSheet] = useState<{ item: Item | null } | null>(null);

  const modulo = getModulo(modId)!;
  const items = collezioni[modulo.coll] ?? [];
  const totale = (m: Modulo) => (collezioni[m.coll]?.length ?? 0);

  const colonneCampi = useMemo(
    () => modulo.colonne.map((n) => ({ nome: n, campo: modulo.campi.find((c) => c.nome === n) })),
    [modulo],
  );

  return (
    <div>
      <PageHero
        grad="bg-gradient-to-br from-ink to-brand-700"
        eyebrow="Pannello di controllo"
        titolo="Amministrazione"
        sottotitolo="Gestisci tutto il sito da un'unica schermata"
        icona={<LayoutDashboard size={22} />}
        azione={<Button variante="glass" onClick={() => chiediConferma({ titolo: "Ricaricare i dati d'esempio?", descrizione: "Sovrascrive i contenuti del pannello.", pericolo: true, testoConferma: "Ricarica", onConfirm: () => { reseedAdmin(); mostra("Dati ricaricati.", "info"); } })}><RotateCcw size={15} /> Esempi</Button>}
      />

      <div className="grid gap-5 lg:grid-cols-[15rem_1fr]">
        {/* nav moduli */}
        <aside>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible">
            {MODULI.map((m) => {
              const sel = m.id === modId;
              return (
                <button
                  key={m.id}
                  onClick={() => setModId(m.id)}
                  className={cn(
                    "group flex shrink-0 items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-left text-sm font-semibold transition-colors lg:w-full",
                    sel ? "bg-brand-50 text-brand-600" : "text-ink-soft hover:bg-surface-2",
                  )}
                >
                  <m.Icona size={18} className={sel ? "text-brand-500" : "text-muted group-hover:text-brand-500"} />
                  <span className="whitespace-nowrap">{m.label}</span>
                  {m.vista === "tabella" && <span className={cn("ml-auto hidden rounded-full px-2 py-0.5 text-[0.66rem] font-bold lg:inline", sel ? "bg-brand-100 text-brand-600" : "bg-surface-2 text-muted")}>{totale(m)}</span>}
                </button>
              );
            })}
          </div>
        </aside>

        {/* contenuto modulo */}
        <motion.section key={modId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-brand-50 text-brand-500"><modulo.Icona size={20} /></span>
              <div>
                <h2 className="font-display text-lg font-bold text-ink">{modulo.label}</h2>
                <p className="text-[0.8rem] text-muted">{modulo.descrizione}</p>
              </div>
            </div>
            {modulo.vista === "tabella" && <Button variante="primary" onClick={() => setSheet({ item: null })}><Plus size={16} /> Nuovo</Button>}
          </div>

          {modulo.vista === "config" ? (
            <ConfigView modulo={modulo} />
          ) : items.length === 0 ? (
            <EmptyState icona={<modulo.Icona size={26} />} titolo="Vuoto" testo="Nessun elemento. Creane uno." azione={<Button variante="primary" onClick={() => setSheet({ item: null })}><Plus size={16} /> Nuovo</Button>} />
          ) : (
            <Table>
              <thead>
                <tr>
                  {modulo.anteprima && <Th></Th>}
                  {colonneCampi.map((c) => <Th key={c.nome}>{c.campo?.label ?? c.nome}</Th>)}
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <Tr key={it.id}>
                    {modulo.anteprima && (
                      <Td className="w-12">
                        {typeof it.url === "string" && it.url ? <img src={it.url} alt="" className="h-9 w-9 rounded-[8px] object-cover" /> : <span className="grid h-9 w-9 place-items-center rounded-[8px] bg-surface-2 text-muted"><modulo.Icona size={15} /></span>}
                      </Td>
                    )}
                    {colonneCampi.map((c, i) => (
                      <Td key={c.nome} className={i === 0 ? "font-semibold text-ink" : ""}>
                        <CellaValore modulo={modulo} campo={c.campo} item={it} />
                      </Td>
                    ))}
                    <Td className="text-right">
                      <div className="flex justify-end gap-1">
                        <IconButton label="Modifica" onClick={() => setSheet({ item: it })}><Pencil size={15} /></IconButton>
                        <IconButton label="Elimina" className="hover:bg-danger-soft hover:text-danger" onClick={() => chiediConferma({ titolo: "Eliminare l'elemento?", pericolo: true, testoConferma: "Elimina", onConfirm: () => rimuovi(modulo.coll, it.id) })}><Trash2 size={15} /></IconButton>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </motion.section>
      </div>

      {sheet && <RecordSheet modulo={modulo} item={sheet.item} onClose={() => setSheet(null)} />}
    </div>
  );
}
