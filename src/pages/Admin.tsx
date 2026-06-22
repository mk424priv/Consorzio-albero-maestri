import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, Pencil, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAdmin } from "@/store/admin";
import { useStore } from "@/store/store";
import { useUI } from "@/store/ui";
import { useToast } from "@/store/toast";
import { MODULI, getModulo, tonoStato, type Campo, type Item, type Modulo, type Valore } from "@/lib/admin-moduli";
import type { Database } from "@/lib/types";
import {
  AreaIcona, Badge, Button, CampoIcona, Card, EmptyState, Field, IconButton,
  PageHero, Select, Sheet, SheetFooter, Switch, Table, Td, Th, Tr,
} from "@/components/ui";

type Opz = { value: string; label: string }[];
const labelOpz = (opzioni: Opz | undefined, v: Valore): string =>
  opzioni?.find((o) => o.value === v)?.label ?? String(v ?? "—");

function CellaValore({ modulo, campo, item, opzioni }: { modulo: Modulo; campo?: Campo; item: Item; opzioni?: Opz }) {
  if (!campo) return <>—</>;
  const v = item[campo.nome];
  if (campo.tipo === "switch") return <Badge tono={tonoStato(v)}>{v ? "Sì" : "No"}</Badge>;
  if (campo.nome === modulo.badge) return <Badge tono={tonoStato(v)}>{labelOpz(opzioni, v)}</Badge>;
  if (campo.tipo === "select" || campo.opzioniDa) return <span className="text-ink-soft">{labelOpz(opzioni, v)}</span>;
  if (Array.isArray(v)) return <span className="text-muted">{v.join(", ") || "—"}</span>;
  if (campo.tipo === "number") return <span className="tabular-nums">{v == null || v === "" ? "—" : String(v)}</span>;
  return <span className="text-ink-soft">{v == null || v === "" ? "—" : String(v)}</span>;
}

/* ----------------------------- campo form ---------------------------- */
function CampoForm({ campo, valore, onChange, opzioni }: { campo: Campo; valore: string | boolean; onChange: (v: string | boolean) => void; opzioni?: Opz }) {
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
  if (campo.tipo === "select" || campo.opzioniDa) {
    return (
      <div className={span}>
        <Field label={campo.label}>
          <Select value={String(valore)} onChange={onChange} options={[{ value: "", label: "— scegli —" }, ...(opzioni ?? [])]} placeholder="— scegli —" />
        </Field>
      </div>
    );
  }
  const tipoInput = campo.tipo === "number" ? "number" : campo.tipo === "date" ? "date" : campo.tipo === "email" ? "email" : campo.tipo === "url" ? "url" : "text";
  return <div className={span}><CampoIcona label={campo.label} type={tipoInput} value={String(valore)} placeholder={campo.placeholder} onChange={(e) => onChange(e.target.value)} /></div>;
}

/* ----------------------------- record sheet -------------------------- */
function RecordSheet({ modulo, item, opzioniPer, onSalva, onClose }: {
  modulo: Modulo; item: Item | null; opzioniPer: (c: Campo) => Opz | undefined; onSalva: (i: Item) => void; onClose: () => void;
}) {
  const mostra = useToast((s) => s.mostra);
  const [f, setF] = useState<Record<string, string | boolean>>(() => {
    const o: Record<string, string | boolean> = {};
    for (const c of modulo.campi) {
      const v = item?.[c.nome];
      o[c.nome] = c.tipo === "switch" ? !!v : Array.isArray(v) ? v.join(", ") : v == null ? "" : String(v);
    }
    return o;
  });
  function salva(e: React.FormEvent) {
    e.preventDefault();
    if (modulo.titolo && !String(f[modulo.titolo] ?? "").trim()) return mostra("Compila almeno il campo principale.", "error");
    const out: Item = { id: item?.id ?? "" };
    for (const c of modulo.campi) {
      const raw = f[c.nome];
      if (c.tipo === "switch") out[c.nome] = !!raw;
      else if (c.tipo === "number") out[c.nome] = raw === "" ? null : Number(String(raw).replace(",", "."));
      else if (c.tipo === "tags") out[c.nome] = String(raw).split(",").map((t) => t.trim()).filter(Boolean);
      else out[c.nome] = String(raw);
    }
    onSalva(out);
    mostra(item ? "Aggiornato!" : "Creato!");
    onClose();
  }
  return (
    <Sheet aperto onClose={onClose} titolo={`${item ? "Modifica" : "Nuovo"} · ${modulo.label}`} sottotitolo={modulo.descrizione} accent="bg-gradient-to-br from-brand-500 to-brand-700" icona={<modulo.Icona size={20} />} motivo={<modulo.Icona size={120} strokeWidth={1.1} />}>
      <form onSubmit={salva} className="grid grid-cols-2 gap-3">
        {modulo.campi.map((c) => (
          <CampoForm key={c.nome} campo={c} valore={f[c.nome]} opzioni={opzioniPer(c)} onChange={(v) => setF((s) => ({ ...s, [c.nome]: v }))} />
        ))}
        <div className="col-span-2"><SheetFooter><Button type="button" onClick={onClose}>Annulla</Button><Button variante="primary" type="submit"><Save size={16} /> {item ? "Salva" : "Crea"}</Button></SheetFooter></div>
      </form>
    </Sheet>
  );
}

/* ----------------------------- config view --------------------------- */
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
  // store CMS (admin) + store app
  const collezioni = useAdmin((s) => s.collezioni);
  const upsertAdmin = useAdmin((s) => s.upsert);
  const rimuoviAdmin = useAdmin((s) => s.rimuovi);
  const reseedAdmin = useAdmin((s) => s.reseedAdmin);
  const db = useStore((s) => s.db);
  const patchRecord = useStore((s) => s.patchRecord);
  const addRecord = useStore((s) => s.addRecord);
  const removeRecord = useStore((s) => s.removeRecord);
  const chiediConferma = useUI((s) => s.chiediConferma);
  const mostra = useToast((s) => s.mostra);

  const [modId, setModId] = useState(MODULI[0].id);
  const [sheet, setSheet] = useState<{ item: Item | null } | null>(null);

  const modulo = getModulo(modId)!;
  const isApp = modulo.origine === "app";

  const opzioniDinamiche = useMemo<Record<string, Opz>>(() => ({
    clienti: db.clienti.map((c) => ({ value: c.id, label: `${c.nome} ${c.cognome}` })),
    operatori: db.operatori.map((o) => ({ value: o.id, label: o.nome })),
  }), [db]);
  const opzioniPer = (c: Campo): Opz | undefined => c.opzioni ?? (c.opzioniDa ? opzioniDinamiche[c.opzioniDa] : undefined);

  const items: Item[] = isApp ? (db[modulo.coll as keyof Database] as unknown as Item[]) : (collezioni[modulo.coll] ?? []);
  const totale = (m: Modulo) => (m.origine === "app" ? (db[m.coll as keyof Database] as unknown[]).length : collezioni[m.coll]?.length ?? 0);
  const colonneCampi = useMemo(() => modulo.colonne.map((n) => ({ nome: n, campo: modulo.campi.find((c) => c.nome === n) })), [modulo]);

  function salvaItem(out: Item) {
    if (isApp) {
      const { id, ...rest } = out;
      if (id) patchRecord(modulo.coll as keyof Database, id, rest);
      else addRecord(modulo.coll as keyof Database, rest);
    } else {
      upsertAdmin(modulo.coll, out);
    }
  }
  function eliminaItem(id: string) {
    chiediConferma({ titolo: "Eliminare l'elemento?", pericolo: true, testoConferma: "Elimina", onConfirm: () => (isApp ? removeRecord(modulo.coll as keyof Database, id) : rimuoviAdmin(modulo.coll, id)) });
  }

  // navigazione raggruppata
  const gruppi = useMemo(() => {
    const out: { nome: string; moduli: Modulo[] }[] = [];
    for (const m of MODULI) {
      const g = m.gruppo ?? "Sito";
      let blocco = out.find((b) => b.nome === g);
      if (!blocco) { blocco = { nome: g, moduli: [] }; out.push(blocco); }
      blocco.moduli.push(m);
    }
    return out;
  }, []);

  return (
    <div>
      <PageHero
        grad="bg-gradient-to-br from-ink to-brand-700"
        eyebrow="Pannello di controllo"
        titolo="Amministrazione"
        sottotitolo="Gestisci app e sito da un'unica schermata"
        icona={<LayoutDashboard size={22} />}
        azione={<Button variante="glass" onClick={() => chiediConferma({ titolo: "Ricaricare i dati del sito?", descrizione: "Sovrascrive i contenuti del pannello (non tocca i dati dell'app).", pericolo: true, testoConferma: "Ricarica", onConfirm: () => { reseedAdmin(); mostra("Contenuti sito ricaricati.", "info"); } })}><RotateCcw size={15} /> Esempi sito</Button>}
      />

      <div className="grid gap-5 lg:grid-cols-[15rem_1fr]">
        {/* nav: chip orizzontali su mobile, raggruppata su desktop */}
        <aside>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {MODULI.map((m) => (
              <button key={m.id} onClick={() => setModId(m.id)} className={cn("flex shrink-0 items-center gap-2 rounded-[12px] px-3 py-2 text-sm font-semibold transition-colors", m.id === modId ? "bg-brand-50 text-brand-600" : "text-ink-soft hover:bg-surface-2")}>
                <m.Icona size={16} /> {m.label}
              </button>
            ))}
          </div>
          <div className="hidden lg:block">
            {gruppi.map((g) => (
              <div key={g.nome} className="mb-4">
                <div className="mb-1.5 px-3 text-[0.64rem] font-bold uppercase tracking-wider text-muted">{g.nome}</div>
                <div className="flex flex-col gap-1">
                  {g.moduli.map((m) => {
                    const sel = m.id === modId;
                    return (
                      <button key={m.id} onClick={() => setModId(m.id)} className={cn("group flex w-full items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-left text-sm font-semibold transition-colors", sel ? "bg-brand-50 text-brand-600" : "text-ink-soft hover:bg-surface-2")}>
                        <m.Icona size={18} className={sel ? "text-brand-500" : "text-muted group-hover:text-brand-500"} />
                        <span className="whitespace-nowrap">{m.label}</span>
                        {m.vista === "tabella" && <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[0.66rem] font-bold", sel ? "bg-brand-100 text-brand-600" : "bg-surface-2 text-muted")}>{totale(m)}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* contenuto modulo */}
        <motion.section key={modId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-brand-50 text-brand-500"><modulo.Icona size={20} /></span>
              <div>
                <h2 className="font-display text-lg font-bold text-ink">{modulo.label}</h2>
                <p className="text-[0.8rem] text-muted">{modulo.descrizione}{isApp && <span className="ml-1.5 rounded-full bg-success-soft px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-success">live</span>}</p>
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
                        <CellaValore modulo={modulo} campo={c.campo} item={it} opzioni={c.campo ? opzioniPer(c.campo) : undefined} />
                      </Td>
                    ))}
                    <Td className="text-right">
                      <div className="flex justify-end gap-1">
                        <IconButton label="Modifica" onClick={() => setSheet({ item: it })}><Pencil size={15} /></IconButton>
                        <IconButton label="Elimina" className="hover:bg-danger-soft hover:text-danger" onClick={() => eliminaItem(it.id)}><Trash2 size={15} /></IconButton>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </motion.section>
      </div>

      {sheet && <RecordSheet modulo={modulo} item={sheet.item} opzioniPer={opzioniPer} onSalva={salvaItem} onClose={() => setSheet(null)} />}
    </div>
  );
}
