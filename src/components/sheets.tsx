// Fogli globali: menù "Crea" + form di creazione/modifica di ogni entità.
// Aperti da qualsiasi punto via useUI.apri(tipo, ctx).
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Banknote,
  Fuel,
  HandCoins,
  Hammer,
  ReceiptText,
  Save,
  Sprout,
  Users,
  Wrench,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { useStore } from "@/store/store";
import { useUI, type SheetCtx, type SheetTipo } from "@/store/ui";
import { useToast } from "@/store/toast";
import { Button, Field, Input, Select, Sheet, SheetFooter, Textarea } from "@/components/ui";
import {
  CATEGORIA_SPESA,
  METODO_PAGAMENTO,
  MODALITA,
  RUOLO_OPERATORE,
  STATO_ATTREZZO,
  TIPO_COMPENSO,
  TIPO_PREVENTIVO,
  etichetta,
} from "@/lib/dominio";
import type { CategoriaSpesa, MetodoPagamento, Modalita, RuoloOperatore, StatoAttrezzo, TipoCompenso, TipoPreventivo } from "@/lib/dominio";
import { ENTITA } from "@/lib/entita";
import { libroOperatore } from "@/lib/squadra";
import { euro } from "@/lib/format";

const oggiISO = () => new Date().toISOString().slice(0, 10);
const num = (s: string): number | null => {
  const t = s.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

function useSheet(tipo: SheetTipo) {
  const sheet = useUI((s) => s.sheet);
  const chiudi = useUI((s) => s.chiudi);
  return { aperto: sheet?.tipo === tipo, ctx: (sheet?.ctx ?? {}) as SheetCtx, seq: sheet?.seq ?? 0, chiudi };
}

/* =============================== CREA =============================== */
function CreaMenu() {
  const { aperto, chiudi } = useSheet("crea");
  const apri = useUI((s) => s.apri);
  const voci: { tipo: SheetTipo; label: string; Icona: LucideIcon; classi: string }[] = [
    { tipo: "cliente", label: "Cliente", Icona: Sprout, classi: ENTITA.cliente.soft },
    { tipo: "lavoro", label: "Lavoro", Icona: Hammer, classi: ENTITA.lavoro.soft },
    { tipo: "ore", label: "Ore", Icona: Clock, classi: ENTITA.operatore.soft },
    { tipo: "preventivo", label: "Preventivo", Icona: ReceiptText, classi: ENTITA.preventivo.soft },
    { tipo: "incasso", label: "Incasso", Icona: Banknote, classi: ENTITA.entrata.soft },
    { tipo: "spesa", label: "Spesa", Icona: Fuel, classi: ENTITA.spesa.soft },
    { tipo: "operatore", label: "Operatore", Icona: Users, classi: ENTITA.operatore.soft },
    { tipo: "compenso", label: "Compenso", Icona: HandCoins, classi: ENTITA.uscita.soft },
  ];
  return (
    <Sheet aperto={aperto} onClose={chiudi} titolo="Crea" sottotitolo="Cosa vuoi aggiungere?">
      <div className="grid grid-cols-2 gap-2.5 pb-1 sm:grid-cols-4">
        {voci.map((v) => (
          <button
            key={v.tipo}
            onClick={() => apri(v.tipo)}
            className="flex flex-col items-center gap-2 rounded-[16px] border border-line bg-surface p-4 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[var(--shadow-md)]"
          >
            <span className={`grid h-11 w-11 place-items-center rounded-[13px] ${v.classi}`}><v.Icona size={20} /></span>
            {v.label}
          </button>
        ))}
      </div>
    </Sheet>
  );
}

/* ============================== CLIENTE ============================= */
function ClienteSheet() {
  const { aperto, ctx, seq, chiudi } = useSheet("cliente");
  return (
    <Sheet aperto={aperto} onClose={chiudi} titolo={ctx.id ? "Modifica cliente" : "Nuovo cliente"} sottotitolo={ctx.id ? undefined : "Il codice parlante si genera da solo"} icona={<Sprout size={20} />}>
      {aperto && <ClienteBody key={seq} ctx={ctx} chiudi={chiudi} />}
    </Sheet>
  );
}
function ClienteBody({ ctx, chiudi }: { ctx: SheetCtx; chiudi: () => void }) {
  const db = useStore((s) => s.db);
  const creaCliente = useStore((s) => s.creaCliente);
  const aggiornaCliente = useStore((s) => s.aggiornaCliente);
  const mostra = useToast((s) => s.mostra);
  const navigate = useNavigate();
  const esistente = ctx.id ? db.clienti.find((c) => c.id === ctx.id) : undefined;

  const [v, setV] = useState({
    nome: esistente?.nome ?? "",
    cognome: esistente?.cognome ?? "",
    telefono: esistente?.telefono ?? "",
    email: esistente?.email ?? "",
    luogo: esistente?.luogo ?? "",
    modalitaPredefinita: (esistente?.modalitaPredefinita ?? "preventivo") as Modalita,
    tariffaOraria: esistente?.tariffaOraria != null ? String(esistente.tariffaOraria) : "",
    note: esistente?.note ?? "",
  });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV((s) => ({ ...s, [k]: e.target.value }));

  function salva(e: React.FormEvent) {
    e.preventDefault();
    if (!v.nome.trim() || !v.cognome.trim()) return mostra("Nome e cognome obbligatori.", "error");
    const dati = {
      telefono: v.telefono || null, email: v.email || null, luogo: v.luogo || null,
      tariffaOraria: num(v.tariffaOraria), modalitaPredefinita: v.modalitaPredefinita, note: v.note || null,
    };
    if (esistente) {
      aggiornaCliente(esistente.id, { nome: v.nome.trim(), cognome: v.cognome.trim(), ...dati });
      mostra("Cliente aggiornato!");
    } else {
      const id = creaCliente({ nome: v.nome, cognome: v.cognome, ...dati });
      mostra("Cliente creato!");
      chiudi();
      navigate(`/cliente/${id}`);
      return;
    }
    chiudi();
  }

  return (
    <form className="grid gap-4" onSubmit={salva}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome *"><Input value={v.nome} onChange={set("nome")} autoFocus /></Field>
        <Field label="Cognome *"><Input value={v.cognome} onChange={set("cognome")} /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Telefono"><Input value={v.telefono} onChange={set("telefono")} /></Field>
        <Field label="Email"><Input type="email" value={v.email} onChange={set("email")} /></Field>
      </div>
      <Field label="Luogo"><Input value={v.luogo} onChange={set("luogo")} placeholder="es. Villa Rossi, Marina di Campo" /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Accordo economico"><Select value={v.modalitaPredefinita} onChange={set("modalitaPredefinita")}>{MODALITA.map((m) => <option key={m} value={m}>{etichetta(m)}</option>)}</Select></Field>
        <Field label="Tariffa oraria (€/h)"><Input type="number" step="0.01" value={v.tariffaOraria} onChange={set("tariffaOraria")} placeholder="es. 30" /></Field>
      </div>
      <Field label="Note"><Textarea rows={2} value={v.note} onChange={set("note")} /></Field>
      <SheetFooter>
        <Button type="button" onClick={chiudi}>Annulla</Button>
        <Button variante="primary" type="submit"><Save size={16} /> {esistente ? "Salva" : "Crea cliente"}</Button>
      </SheetFooter>
    </form>
  );
}

/* ============================= OPERATORE =========================== */
function OperatoreSheet() {
  const { aperto, ctx, seq, chiudi } = useSheet("operatore");
  return (
    <Sheet aperto={aperto} onClose={chiudi} titolo={ctx.id ? "Modifica operatore" : "Nuovo operatore"} icona={<Users size={20} />}>
      {aperto && <OperatoreBody key={seq} ctx={ctx} chiudi={chiudi} />}
    </Sheet>
  );
}
function OperatoreBody({ ctx, chiudi }: { ctx: SheetCtx; chiudi: () => void }) {
  const db = useStore((s) => s.db);
  const crea = useStore((s) => s.creaOperatore);
  const aggiorna = useStore((s) => s.aggiornaOperatore);
  const mostra = useToast((s) => s.mostra);
  const navigate = useNavigate();
  const esistente = ctx.id ? db.operatori.find((o) => o.id === ctx.id) : undefined;
  const [v, setV] = useState({
    nome: esistente?.nome ?? "",
    ruolo: (esistente?.ruolo ?? "collaboratore") as RuoloOperatore,
    tariffaOraria: esistente?.tariffaOraria != null ? String(esistente.tariffaOraria) : "",
    telefono: esistente?.telefono ?? "",
    note: esistente?.note ?? "",
  });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV((s) => ({ ...s, [k]: e.target.value }));

  function salva(e: React.FormEvent) {
    e.preventDefault();
    if (!v.nome.trim()) return mostra("Il nome è obbligatorio.", "error");
    const dati = { ruolo: v.ruolo, tariffaOraria: num(v.tariffaOraria), telefono: v.telefono || null, note: v.note || null };
    if (esistente) { aggiorna(esistente.id, { nome: v.nome.trim(), ...dati }); mostra("Operatore aggiornato!"); chiudi(); }
    else { const id = crea({ nome: v.nome, ...dati }); mostra("Operatore creato!"); chiudi(); navigate(`/operatore/${id}`); }
  }
  return (
    <form className="grid gap-4" onSubmit={salva}>
      <Field label="Nome *"><Input value={v.nome} onChange={set("nome")} autoFocus /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ruolo"><Select value={v.ruolo} onChange={set("ruolo")}>{RUOLO_OPERATORE.map((r) => <option key={r} value={r}>{etichetta(r)}</option>)}</Select></Field>
        <Field label="Tariffa oraria (€/h)" hint="Quanto gli riconosci all'ora"><Input type="number" step="0.01" value={v.tariffaOraria} onChange={set("tariffaOraria")} placeholder="es. 16" /></Field>
      </div>
      <Field label="Telefono"><Input value={v.telefono} onChange={set("telefono")} /></Field>
      <Field label="Note"><Textarea rows={2} value={v.note} onChange={set("note")} /></Field>
      <SheetFooter>
        <Button type="button" onClick={chiudi}>Annulla</Button>
        <Button variante="primary" type="submit"><Save size={16} /> {esistente ? "Salva" : "Crea"}</Button>
      </SheetFooter>
    </form>
  );
}

/* ============================== LAVORO ============================= */
function LavoroSheet() {
  const { aperto, ctx, seq, chiudi } = useSheet("lavoro");
  return (
    <Sheet aperto={aperto} onClose={chiudi} titolo={ctx.id ? "Modifica lavoro" : "Nuovo lavoro"} icona={<Hammer size={20} />}>
      {aperto && <LavoroBody key={seq} ctx={ctx} chiudi={chiudi} />}
    </Sheet>
  );
}
function LavoroBody({ ctx, chiudi }: { ctx: SheetCtx; chiudi: () => void }) {
  const db = useStore((s) => s.db);
  const crea = useStore((s) => s.creaLavoro);
  const aggiorna = useStore((s) => s.aggiornaLavoro);
  const mostra = useToast((s) => s.mostra);
  const esistente = ctx.id ? db.lavori.find((l) => l.id === ctx.id) : undefined;
  const [v, setV] = useState({
    clienteId: esistente?.clienteId ?? ctx.clienteId ?? "",
    titolo: esistente?.titolo ?? "",
    data: esistente?.data ?? ctx.data ?? oggiISO(),
    tipoCompenso: (esistente?.tipoCompenso ?? "preventivo") as TipoCompenso,
    operatoreId: esistente?.operatoreId ?? "",
    luogo: esistente?.luogo ?? "",
  });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV((s) => ({ ...s, [k]: e.target.value }));

  function salva(e: React.FormEvent) {
    e.preventDefault();
    if (!v.clienteId || !v.titolo.trim()) return mostra("Cliente e titolo obbligatori.", "error");
    const dati = { clienteId: v.clienteId, titolo: v.titolo.trim(), data: v.data, tipoCompenso: v.tipoCompenso, operatoreId: v.operatoreId || null, luogo: v.luogo || null };
    if (esistente) { aggiorna(esistente.id, dati); mostra("Lavoro aggiornato!"); }
    else { crea(dati); mostra("Lavoro aggiunto!"); }
    chiudi();
  }
  return (
    <form className="grid gap-4" onSubmit={salva}>
      <Field label="Cliente *">
        <Select value={v.clienteId} onChange={set("clienteId")}><option value="">— scegli —</option>{db.clienti.map((c) => <option key={c.id} value={c.id}>{c.nome} {c.cognome}</option>)}</Select>
      </Field>
      <Field label="Titolo *"><Input value={v.titolo} onChange={set("titolo")} placeholder="es. Potatura olivi" autoFocus /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Data *"><Input type="date" value={v.data} onChange={set("data")} /></Field>
        <Field label="Tipo compenso"><Select value={v.tipoCompenso} onChange={set("tipoCompenso")}>{TIPO_COMPENSO.map((t) => <option key={t} value={t}>{etichetta(t)}</option>)}</Select></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Assegnato a"><Select value={v.operatoreId} onChange={set("operatoreId")}><option value="">— nessuno —</option>{db.operatori.filter((o) => o.attivo).map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</Select></Field>
        <Field label="Luogo"><Input value={v.luogo} onChange={set("luogo")} /></Field>
      </div>
      <SheetFooter>
        <Button type="button" onClick={chiudi}>Annulla</Button>
        <Button variante="primary" type="submit"><Save size={16} /> {esistente ? "Salva" : "Aggiungi"}</Button>
      </SheetFooter>
    </form>
  );
}

/* ============================ PREVENTIVO =========================== */
function PreventivoSheet() {
  const { aperto, ctx, seq, chiudi } = useSheet("preventivo");
  return (
    <Sheet aperto={aperto} onClose={chiudi} titolo="Nuovo preventivo" sottotitolo="Genera i pagamenti attesi" icona={<ReceiptText size={20} />}>
      {aperto && <PreventivoBody key={seq} ctx={ctx} chiudi={chiudi} />}
    </Sheet>
  );
}
function PreventivoBody({ ctx, chiudi }: { ctx: SheetCtx; chiudi: () => void }) {
  const db = useStore((s) => s.db);
  const crea = useStore((s) => s.creaPreventivo);
  const mostra = useToast((s) => s.mostra);
  const [v, setV] = useState({
    clienteId: ctx.clienteId ?? "",
    tipo: "unico" as TipoPreventivo,
    importoTotale: "",
    importoAcconto: "",
    dataEmissione: oggiISO(),
    dataScadenza: "",
    note: "",
  });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV((s) => ({ ...s, [k]: e.target.value }));
  function salva(e: React.FormEvent) {
    e.preventDefault();
    const tot = num(v.importoTotale);
    if (!v.clienteId || tot === null || tot <= 0) return mostra("Cliente e importo validi richiesti.", "error");
    crea({ clienteId: v.clienteId, tipo: v.tipo, importoTotale: tot, importoAcconto: num(v.importoAcconto), dataEmissione: v.dataEmissione, dataScadenza: v.dataScadenza || null, note: v.note || null });
    mostra("Preventivo creato: pagamenti generati.");
    chiudi();
  }
  return (
    <form className="grid gap-4" onSubmit={salva}>
      <Field label="Cliente *"><Select value={v.clienteId} onChange={set("clienteId")}><option value="">— scegli —</option>{db.clienti.map((c) => <option key={c.id} value={c.id}>{c.nome} {c.cognome}</option>)}</Select></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tipo *"><Select value={v.tipo} onChange={set("tipo")}>{TIPO_PREVENTIVO.map((t) => <option key={t} value={t}>{etichetta(t)}</option>)}</Select></Field>
        <Field label="Importo totale (€) *"><Input type="number" step="0.01" value={v.importoTotale} onChange={set("importoTotale")} /></Field>
      </div>
      {v.tipo === "acconto_saldo" && (
        <Field label="Acconto (€)" hint="Saldo = totale − acconto. Vuoto = metà."><Input type="number" step="0.01" value={v.importoAcconto} onChange={set("importoAcconto")} /></Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Data emissione"><Input type="date" value={v.dataEmissione} onChange={set("dataEmissione")} /></Field>
        <Field label="Scadenza incasso"><Input type="date" value={v.dataScadenza} onChange={set("dataScadenza")} /></Field>
      </div>
      <Field label="Note"><Textarea rows={2} value={v.note} onChange={set("note")} /></Field>
      <SheetFooter>
        <Button type="button" onClick={chiudi}>Annulla</Button>
        <Button variante="primary" type="submit"><Save size={16} /> Crea preventivo</Button>
      </SheetFooter>
    </form>
  );
}

/* =============================== ORE =============================== */
function OreSheet() {
  const { aperto, ctx, seq, chiudi } = useSheet("ore");
  return (
    <Sheet aperto={aperto} onClose={chiudi} titolo="Registra ore" icona={<Clock size={20} />}>
      {aperto && <OreBody key={seq} ctx={ctx} chiudi={chiudi} />}
    </Sheet>
  );
}
function OreBody({ ctx, chiudi }: { ctx: SheetCtx; chiudi: () => void }) {
  const db = useStore((s) => s.db);
  const registra = useStore((s) => s.registraOre);
  const mostra = useToast((s) => s.mostra);
  const [v, setV] = useState({
    clienteId: ctx.clienteId ?? "",
    operatoreId: ctx.operatoreId ?? "",
    data: ctx.data ?? oggiISO(),
    ore: "",
    note: "",
  });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV((s) => ({ ...s, [k]: e.target.value }));
  function salva(e: React.FormEvent) {
    e.preventDefault();
    const ore = num(v.ore);
    if (!v.clienteId || ore === null || ore <= 0) return mostra("Cliente e ore richiesti.", "error");
    registra({ clienteId: v.clienteId, operatoreId: v.operatoreId || null, data: v.data, ore, note: v.note || null });
    mostra("Ore registrate!");
    chiudi();
  }
  return (
    <form className="grid gap-4" onSubmit={salva}>
      <Field label="Cliente *"><Select value={v.clienteId} onChange={set("clienteId")}><option value="">— scegli —</option>{db.clienti.map((c) => <option key={c.id} value={c.id}>{c.nome} {c.cognome}</option>)}</Select></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Data"><Input type="date" value={v.data} onChange={set("data")} /></Field>
        <Field label="Ore *"><Input type="number" step="0.5" value={v.ore} onChange={set("ore")} placeholder="es. 3.5" autoFocus /></Field>
      </div>
      <Field label="Operatore"><Select value={v.operatoreId} onChange={set("operatoreId")}><option value="">— nessuno —</option>{db.operatori.filter((o) => o.attivo).map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</Select></Field>
      <Field label="Nota"><Input value={v.note} onChange={set("note")} /></Field>
      <SheetFooter>
        <Button type="button" onClick={chiudi}>Annulla</Button>
        <Button variante="primary" type="submit"><Save size={16} /> Salva ore</Button>
      </SheetFooter>
    </form>
  );
}

/* ============================== SPESA ============================= */
function SpesaSheet() {
  const { aperto, ctx, seq, chiudi } = useSheet("spesa");
  return (
    <Sheet aperto={aperto} onClose={chiudi} titolo="Nuova spesa" icona={<Fuel size={20} />}>
      {aperto && <SpesaBody key={seq} ctx={ctx} chiudi={chiudi} />}
    </Sheet>
  );
}
function SpesaBody({ ctx, chiudi }: { ctx: SheetCtx; chiudi: () => void }) {
  const db = useStore((s) => s.db);
  const crea = useStore((s) => s.creaSpesa);
  const mostra = useToast((s) => s.mostra);
  const [v, setV] = useState({
    categoria: "benzina" as CategoriaSpesa,
    importo: "",
    data: ctx.data ?? oggiISO(),
    clienteId: ctx.clienteId ?? "",
    descrizione: "",
  });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV((s) => ({ ...s, [k]: e.target.value }));
  function salva(e: React.FormEvent) {
    e.preventDefault();
    const importo = num(v.importo);
    if (importo === null || importo <= 0) return mostra("Importo non valido.", "error");
    crea({ categoria: v.categoria, importo, data: v.data, clienteId: v.clienteId || null, descrizione: v.descrizione || null });
    mostra("Spesa aggiunta!");
    chiudi();
  }
  return (
    <form className="grid gap-4" onSubmit={salva}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Categoria"><Select value={v.categoria} onChange={set("categoria")}>{CATEGORIA_SPESA.map((c) => <option key={c} value={c}>{etichetta(c)}</option>)}</Select></Field>
        <Field label="Importo (€) *"><Input type="number" step="0.01" value={v.importo} onChange={set("importo")} autoFocus /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Data"><Input type="date" value={v.data} onChange={set("data")} /></Field>
        <Field label="Cliente (facoltativo)"><Select value={v.clienteId} onChange={set("clienteId")}><option value="">— nessuno —</option>{db.clienti.map((c) => <option key={c.id} value={c.id}>{c.nome} {c.cognome}</option>)}</Select></Field>
      </div>
      <Field label="Descrizione"><Input value={v.descrizione} onChange={set("descrizione")} placeholder="es. Pieno furgone" /></Field>
      <SheetFooter>
        <Button type="button" onClick={chiudi}>Annulla</Button>
        <Button variante="primary" type="submit"><Save size={16} /> Aggiungi spesa</Button>
      </SheetFooter>
    </form>
  );
}

/* ============================= INCASSO ============================ */
function IncassoSheet() {
  const { aperto, ctx, seq, chiudi } = useSheet("incasso");
  return (
    <Sheet aperto={aperto} onClose={chiudi} titolo="Nuovo incasso atteso" sottotitolo="Pagamento manuale da un cliente" icona={<Banknote size={20} />}>
      {aperto && <IncassoBody key={seq} ctx={ctx} chiudi={chiudi} />}
    </Sheet>
  );
}
function IncassoBody({ ctx, chiudi }: { ctx: SheetCtx; chiudi: () => void }) {
  const db = useStore((s) => s.db);
  const crea = useStore((s) => s.creaPagamento);
  const mostra = useToast((s) => s.mostra);
  const [v, setV] = useState({ clienteId: ctx.clienteId ?? "", importoAtteso: "", dataScadenza: "", note: "" });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV((s) => ({ ...s, [k]: e.target.value }));
  function salva(e: React.FormEvent) {
    e.preventDefault();
    const importo = num(v.importoAtteso);
    if (!v.clienteId || importo === null || importo <= 0) return mostra("Cliente e importo richiesti.", "error");
    crea({ clienteId: v.clienteId, importoAtteso: importo, dataScadenza: v.dataScadenza || null, note: v.note || null });
    mostra("Incasso atteso creato.");
    chiudi();
  }
  return (
    <form className="grid gap-4" onSubmit={salva}>
      <Field label="Cliente *"><Select value={v.clienteId} onChange={set("clienteId")}><option value="">— scegli —</option>{db.clienti.map((c) => <option key={c.id} value={c.id}>{c.nome} {c.cognome}</option>)}</Select></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Importo atteso (€) *"><Input type="number" step="0.01" value={v.importoAtteso} onChange={set("importoAtteso")} autoFocus /></Field>
        <Field label="Scadenza"><Input type="date" value={v.dataScadenza} onChange={set("dataScadenza")} /></Field>
      </div>
      <Field label="Note"><Input value={v.note} onChange={set("note")} /></Field>
      <SheetFooter>
        <Button type="button" onClick={chiudi}>Annulla</Button>
        <Button variante="primary" type="submit"><Save size={16} /> Crea</Button>
      </SheetFooter>
    </form>
  );
}

/* ============================ COMPENSO ============================ */
function CompensoSheet() {
  const { aperto, ctx, seq, chiudi } = useSheet("compenso");
  return (
    <Sheet aperto={aperto} onClose={chiudi} titolo="Paga operatore" sottotitolo="Registra un compenso alla squadra" icona={<HandCoins size={20} />}>
      {aperto && <CompensoBody key={seq} ctx={ctx} chiudi={chiudi} />}
    </Sheet>
  );
}
function CompensoBody({ ctx, chiudi }: { ctx: SheetCtx; chiudi: () => void }) {
  const db = useStore((s) => s.db);
  const paga = useStore((s) => s.pagaOperatore);
  const mostra = useToast((s) => s.mostra);
  const saldoIniziale = useMemo(() => (ctx.operatoreId ? libroOperatore(db, ctx.operatoreId).saldo : 0), [db, ctx.operatoreId]);
  const [v, setV] = useState({
    operatoreId: ctx.operatoreId ?? "",
    importo: ctx.operatoreId && saldoIniziale > 0 ? String(saldoIniziale) : "",
    data: oggiISO(),
    metodo: "contanti" as MetodoPagamento,
    note: "",
  });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV((s) => ({ ...s, [k]: e.target.value }));
  function salva(e: React.FormEvent) {
    e.preventDefault();
    const importo = num(v.importo);
    if (!v.operatoreId || importo === null || importo <= 0) return mostra("Operatore e importo richiesti.", "error");
    paga({ operatoreId: v.operatoreId, importo, data: v.data, metodo: v.metodo, note: v.note || null });
    mostra("Compenso registrato!");
    chiudi();
  }
  return (
    <form className="grid gap-4" onSubmit={salva}>
      <Field label="Operatore *"><Select value={v.operatoreId} onChange={(e) => setV((s) => ({ ...s, operatoreId: e.target.value, importo: libroOperatore(db, e.target.value).saldo > 0 ? String(libroOperatore(db, e.target.value).saldo) : s.importo }))}><option value="">— scegli —</option>{db.operatori.filter((o) => o.attivo).map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</Select></Field>
      {v.operatoreId && (
        <div className="rounded-[12px] bg-uscita-50 px-3.5 py-2.5 text-sm text-uscita-600">Saldo da pagare: <b>{euro(libroOperatore(db, v.operatoreId).saldo)}</b></div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Importo (€) *"><Input type="number" step="0.01" value={v.importo} onChange={set("importo")} autoFocus /></Field>
        <Field label="Data"><Input type="date" value={v.data} onChange={set("data")} /></Field>
      </div>
      <Field label="Metodo"><Select value={v.metodo} onChange={set("metodo")}>{METODO_PAGAMENTO.map((m) => <option key={m} value={m}>{etichetta(m)}</option>)}</Select></Field>
      <Field label="Note"><Input value={v.note} onChange={set("note")} /></Field>
      <SheetFooter>
        <Button type="button" onClick={chiudi}>Annulla</Button>
        <Button variante="primary" type="submit"><Save size={16} /> Registra</Button>
      </SheetFooter>
    </form>
  );
}

/* ============================ ATTREZZO ============================ */
function AttrezzoSheet() {
  const { aperto, ctx, seq, chiudi } = useSheet("attrezzo");
  return (
    <Sheet aperto={aperto} onClose={chiudi} titolo={ctx.id ? "Modifica attrezzo" : "Nuovo attrezzo"} icona={<Wrench size={20} />}>
      {aperto && <AttrezzoBody key={seq} ctx={ctx} chiudi={chiudi} />}
    </Sheet>
  );
}
function AttrezzoBody({ ctx, chiudi }: { ctx: SheetCtx; chiudi: () => void }) {
  const db = useStore((s) => s.db);
  const crea = useStore((s) => s.creaAttrezzo);
  const aggiorna = useStore((s) => s.aggiornaAttrezzo);
  const mostra = useToast((s) => s.mostra);
  const esistente = ctx.id ? db.attrezzi.find((a) => a.id === ctx.id) : undefined;
  const [v, setV] = useState({
    nome: esistente?.nome ?? "",
    costoAcquisto: esistente?.costoAcquisto != null ? String(esistente.costoAcquisto) : "",
    dataAcquisto: esistente?.dataAcquisto ?? "",
    stato: (esistente?.stato ?? "ok") as StatoAttrezzo,
  });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV((s) => ({ ...s, [k]: e.target.value }));
  function salva(e: React.FormEvent) {
    e.preventDefault();
    if (!v.nome.trim()) return mostra("Il nome è obbligatorio.", "error");
    const dati = { nome: v.nome.trim(), costoAcquisto: num(v.costoAcquisto), dataAcquisto: v.dataAcquisto || null, stato: v.stato };
    if (esistente) { aggiorna(esistente.id, dati); mostra("Attrezzo aggiornato!"); }
    else { crea(dati); mostra("Attrezzo aggiunto!"); }
    chiudi();
  }
  return (
    <form className="grid gap-4" onSubmit={salva}>
      <Field label="Nome *"><Input value={v.nome} onChange={set("nome")} autoFocus /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Costo (€)"><Input type="number" step="0.01" value={v.costoAcquisto} onChange={set("costoAcquisto")} /></Field>
        <Field label="Data acquisto"><Input type="date" value={v.dataAcquisto} onChange={set("dataAcquisto")} /></Field>
      </div>
      <Field label="Stato"><Select value={v.stato} onChange={set("stato")}>{STATO_ATTREZZO.map((s) => <option key={s} value={s}>{etichetta(s)}</option>)}</Select></Field>
      <SheetFooter>
        <Button type="button" onClick={chiudi}>Annulla</Button>
        <Button variante="primary" type="submit"><Save size={16} /> {esistente ? "Salva" : "Aggiungi"}</Button>
      </SheetFooter>
    </form>
  );
}

/* ============================== HOST ============================== */
export function SheetHost() {
  return (
    <>
      <CreaMenu />
      <ClienteSheet />
      <OperatoreSheet />
      <LavoroSheet />
      <PreventivoSheet />
      <OreSheet />
      <SpesaSheet />
      <IncassoSheet />
      <CompensoSheet />
      <AttrezzoSheet />
    </>
  );
}
