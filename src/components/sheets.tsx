// Fogli globali: menù "Crea" + form di creazione/modifica.
// Ogni foglio ha la SUA identità: intestazione colorata, layout e controlli
// gamificati dedicati (tessere, chip con avatar, stepper, importo grande).
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Banknote,
  Clock,
  Coins,
  Crown,
  Fuel,
  HandCoins,
  Hammer,
  Landmark,
  Layers,
  Package,
  ReceiptText,
  Save,
  Sprout,
  Tag,
  User,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useStore } from "@/store/store";
import { useUI, type SheetCtx, type SheetTipo } from "@/store/ui";
import { useToast } from "@/store/toast";
import {
  AmountField,
  Avatar,
  Button,
  ChipPicker,
  Field,
  Input,
  QuickDate,
  Select,
  Sheet,
  SheetFooter,
  Stepper,
  TileSelect,
  type Tile,
} from "@/components/ui";
import { etichetta } from "@/lib/dominio";
import type { CategoriaSpesa, MetodoPagamento, Modalita, RuoloOperatore, StatoAttrezzo, TipoCompenso, TipoPreventivo } from "@/lib/dominio";
import { ENTITA } from "@/lib/entita";
import { inizialiDa } from "@/lib/codice-parlante";
import { libroOperatore } from "@/lib/squadra";
import { euro } from "@/lib/format";
import type { Database } from "@/lib/types";

const oggiISO = () => new Date().toISOString().slice(0, 10);
const num = (s: string): number | null => {
  const t = s.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};
const clientiChip = (db: Database) => db.clienti.map((c) => ({ id: c.id, nome: `${c.nome} ${c.cognome}` }));
const operatoriChip = (db: Database) => db.operatori.filter((o) => o.attivo).map((o) => ({ id: o.id, nome: o.nome }));

function useSheet(tipo: SheetTipo) {
  const sheet = useUI((s) => s.sheet);
  const chiudi = useUI((s) => s.chiudi);
  return { aperto: sheet?.tipo === tipo, ctx: (sheet?.ctx ?? {}) as SheetCtx, seq: sheet?.seq ?? 0, chiudi };
}

// piccolo titoletto di sezione dentro un foglio
function Etichetta({ children }: { children: React.ReactNode }) {
  return <div className="mb-1.5 text-[0.74rem] font-bold uppercase tracking-wide text-muted">{children}</div>;
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
    <Sheet aperto={aperto} onClose={chiudi} titolo="Crea" sottotitolo="Cosa registri ora?" accent="bg-gradient-to-br from-brand-500 to-brand-700" icona={<Sprout size={20} />}>
      <div className="grid grid-cols-2 gap-2.5 pb-1 sm:grid-cols-4">
        {voci.map((v) => (
          <button
            key={v.tipo}
            onClick={() => apri(v.tipo)}
            className="flex flex-col items-center gap-2 rounded-[16px] border border-line bg-surface p-4 text-[0.82rem] font-semibold text-ink transition-all duration-150 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[var(--shadow-md)]"
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
const MODALITA_TILE: Tile[] = [
  { value: "preventivo", label: "A preventivo", icona: <ReceiptText size={18} /> },
  { value: "ore", label: "A ore", icona: <Clock size={18} /> },
  { value: "misto", label: "Misto", icona: <Layers size={18} /> },
];
function ClienteSheet() {
  const { aperto, ctx, seq, chiudi } = useSheet("cliente");
  return (
    <Sheet aperto={aperto} onClose={chiudi} titolo={ctx.id ? "Modifica cliente" : "Nuova radice"} sottotitolo={ctx.id ? undefined : "Da un cliente nasce tutto 🌱"} accent={ENTITA.cliente.grad} icona={<Sprout size={20} />}>
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
  });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV((s) => ({ ...s, [k]: e.target.value }));
  const nomeCompl = `${v.nome} ${v.cognome}`.trim() || "Nuovo cliente";
  const codiceProvv = `${v.nome || v.cognome ? inizialiDa(v.nome || "X", v.cognome || "X") : "??"}-00-00-00`;

  function salva(e: React.FormEvent) {
    e.preventDefault();
    if (!v.nome.trim() || !v.cognome.trim()) return mostra("Nome e cognome obbligatori.", "error");
    const dati = { telefono: v.telefono || null, email: v.email || null, luogo: v.luogo || null, tariffaOraria: num(v.tariffaOraria), modalitaPredefinita: v.modalitaPredefinita, note: esistente?.note ?? null };
    if (esistente) { aggiornaCliente(esistente.id, { nome: v.nome.trim(), cognome: v.cognome.trim(), ...dati }); mostra("Cliente aggiornato!"); chiudi(); }
    else { const id = creaCliente({ nome: v.nome, cognome: v.cognome, ...dati }); mostra("Radice piantata 🌱"); chiudi(); navigate(`/cliente/${id}`); }
  }

  return (
    <form className="grid gap-4" onSubmit={salva}>
      {/* anteprima viva */}
      <div className="flex items-center gap-3 rounded-[16px] border border-cliente-100 bg-cliente-50/60 p-3">
        <Avatar nome={nomeCompl} size="lg" grad={ENTITA.cliente.grad} />
        <div className="min-w-0">
          <div className="truncate font-extrabold text-ink">{nomeCompl}</div>
          <span className="codice mt-1 inline-block text-[0.72rem]">{codiceProvv}</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome *"><Input value={v.nome} onChange={set("nome")} autoFocus /></Field>
        <Field label="Cognome *"><Input value={v.cognome} onChange={set("cognome")} /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Telefono"><Input value={v.telefono} onChange={set("telefono")} placeholder="333 …" /></Field>
        <Field label="Email"><Input type="email" value={v.email} onChange={set("email")} /></Field>
      </div>
      <Field label="Luogo"><Input value={v.luogo} onChange={set("luogo")} placeholder="es. Villa Rossi, Marina di Campo" /></Field>
      <div>
        <Etichetta>Accordo economico</Etichetta>
        <TileSelect tinta="cliente" cols={3} value={v.modalitaPredefinita} onChange={(val) => setV((s) => ({ ...s, modalitaPredefinita: val as Modalita }))} options={MODALITA_TILE} />
      </div>
      <Field label="Tariffa oraria (€/h)" hint="Se lavori a ore con questo cliente"><Input type="number" step="0.01" value={v.tariffaOraria} onChange={set("tariffaOraria")} placeholder="es. 30" /></Field>
      <SheetFooter>
        <Button type="button" onClick={chiudi}>Annulla</Button>
        <Button variante="primary" type="submit"><Save size={16} /> {esistente ? "Salva" : "Crea cliente"}</Button>
      </SheetFooter>
    </form>
  );
}

/* ============================= OPERATORE =========================== */
const RUOLO_TILE: Tile[] = [
  { value: "titolare", label: "Titolare", icona: <Crown size={18} /> },
  { value: "collaboratore", label: "Collaboratore", icona: <User size={18} /> },
];
function OperatoreSheet() {
  const { aperto, ctx, seq, chiudi } = useSheet("operatore");
  return (
    <Sheet aperto={aperto} onClose={chiudi} titolo={ctx.id ? "Modifica operatore" : "Nuovo operatore"} sottotitolo={ctx.id ? undefined : "Aggiungi un membro alla squadra"} accent={ENTITA.operatore.grad} icona={<Users size={20} />}>
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
  });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV((s) => ({ ...s, [k]: e.target.value }));

  function salva(e: React.FormEvent) {
    e.preventDefault();
    if (!v.nome.trim()) return mostra("Il nome è obbligatorio.", "error");
    const dati = { ruolo: v.ruolo, tariffaOraria: num(v.tariffaOraria), telefono: v.telefono || null, note: esistente?.note ?? null };
    if (esistente) { aggiorna(esistente.id, { nome: v.nome.trim(), ...dati }); mostra("Operatore aggiornato!"); chiudi(); }
    else { const id = crea({ nome: v.nome, ...dati }); mostra("Squadra rinforzata 🧑‍🌾"); chiudi(); navigate(`/operatore/${id}`); }
  }
  return (
    <form className="grid gap-4" onSubmit={salva}>
      <div className="flex items-center gap-3 rounded-[16px] border border-operatore-100 bg-operatore-50/60 p-3">
        <Avatar nome={v.nome || "Operatore"} size="lg" grad={ENTITA.operatore.grad} />
        <div className="min-w-0">
          <div className="truncate font-extrabold text-ink">{v.nome || "Nuovo operatore"}</div>
          <div className="text-[0.78rem] text-muted">{etichetta(v.ruolo)}{v.tariffaOraria ? ` · ${v.tariffaOraria} €/h` : ""}</div>
        </div>
      </div>
      <Field label="Nome *"><Input value={v.nome} onChange={set("nome")} autoFocus /></Field>
      <div>
        <Etichetta>Ruolo</Etichetta>
        <TileSelect tinta="operatore" cols={2} value={v.ruolo} onChange={(val) => setV((s) => ({ ...s, ruolo: val as RuoloOperatore }))} options={RUOLO_TILE} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tariffa oraria (€/h)" hint="Quanto gli riconosci"><Input type="number" step="0.01" value={v.tariffaOraria} onChange={set("tariffaOraria")} placeholder="es. 16" /></Field>
        <Field label="Telefono"><Input value={v.telefono} onChange={set("telefono")} /></Field>
      </div>
      <SheetFooter>
        <Button type="button" onClick={chiudi}>Annulla</Button>
        <Button variante="primary" type="submit"><Save size={16} /> {esistente ? "Salva" : "Crea"}</Button>
      </SheetFooter>
    </form>
  );
}

/* ============================== LAVORO ============================= */
const COMPENSO_TILE: Tile[] = [
  { value: "preventivo", label: "Preventivo", icona: <ReceiptText size={18} /> },
  { value: "ore", label: "A ore", icona: <Clock size={18} /> },
  { value: "misto", label: "Misto", icona: <Layers size={18} /> },
];
function LavoroSheet() {
  const { aperto, ctx, seq, chiudi } = useSheet("lavoro");
  return (
    <Sheet aperto={aperto} onClose={chiudi} titolo={ctx.id ? "Modifica lavoro" : "Nuovo lavoro"} sottotitolo={ctx.id ? undefined : "Programma un intervento"} accent={ENTITA.lavoro.grad} icona={<Hammer size={20} />}>
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
  function salva(e: React.FormEvent) {
    e.preventDefault();
    if (!v.clienteId || !v.titolo.trim()) return mostra("Cliente e titolo obbligatori.", "error");
    const dati = { clienteId: v.clienteId, titolo: v.titolo.trim(), data: v.data, tipoCompenso: v.tipoCompenso, operatoreId: v.operatoreId || null, luogo: v.luogo || null };
    if (esistente) { aggiorna(esistente.id, dati); mostra("Lavoro aggiornato!"); } else { crea(dati); mostra("Lavoro in agenda 🗓️"); }
    chiudi();
  }
  return (
    <form className="grid gap-4" onSubmit={salva}>
      <div>
        <Etichetta>Cliente</Etichetta>
        <ChipPicker tinta="cliente" items={clientiChip(db)} value={v.clienteId} onChange={(id) => setV((s) => ({ ...s, clienteId: id }))} vuoto="Crea prima un cliente." />
      </div>
      <Field label="Titolo *"><Input value={v.titolo} onChange={(e) => setV((s) => ({ ...s, titolo: e.target.value }))} placeholder="es. Potatura olivi" /></Field>
      <div>
        <Etichetta>Quando</Etichetta>
        <QuickDate tinta="lavoro" value={v.data} onChange={(d) => setV((s) => ({ ...s, data: d }))} />
      </div>
      <div>
        <Etichetta>Tipo compenso</Etichetta>
        <TileSelect tinta="lavoro" cols={3} value={v.tipoCompenso} onChange={(val) => setV((s) => ({ ...s, tipoCompenso: val as TipoCompenso }))} options={COMPENSO_TILE} />
      </div>
      <div>
        <Etichetta>Assegnato a</Etichetta>
        <ChipPicker tinta="operatore" items={operatoriChip(db)} value={v.operatoreId} onChange={(id) => setV((s) => ({ ...s, operatoreId: id }))} consentiNessuno vuoto="Nessun operatore." />
      </div>
      <Field label="Luogo"><Input value={v.luogo} onChange={(e) => setV((s) => ({ ...s, luogo: e.target.value }))} /></Field>
      <SheetFooter>
        <Button type="button" onClick={chiudi}>Annulla</Button>
        <Button variante="primary" type="submit"><Save size={16} /> {esistente ? "Salva" : "Aggiungi"}</Button>
      </SheetFooter>
    </form>
  );
}

/* ============================ PREVENTIVO =========================== */
const PREV_TILE: Tile[] = [
  { value: "unico", label: "Cifra unica", icona: <Coins size={18} />, hint: "un pagamento" },
  { value: "acconto_saldo", label: "Acconto + saldo", icona: <Layers size={18} />, hint: "due rate" },
];
function PreventivoSheet() {
  const { aperto, ctx, seq, chiudi } = useSheet("preventivo");
  return (
    <Sheet aperto={aperto} onClose={chiudi} titolo="Nuovo preventivo" sottotitolo="Concorda il prezzo → nascono i pagamenti" accent={ENTITA.preventivo.grad} icona={<ReceiptText size={20} />}>
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
  });
  const tot = num(v.importoTotale) ?? 0;
  const acconto = v.importoAcconto.trim() === "" ? Math.round((tot / 2) * 100) / 100 : num(v.importoAcconto) ?? 0;
  const saldo = Math.round((tot - acconto) * 100) / 100;

  function salva(e: React.FormEvent) {
    e.preventDefault();
    const t = num(v.importoTotale);
    if (!v.clienteId || t === null || t <= 0) return mostra("Cliente e importo validi richiesti.", "error");
    crea({ clienteId: v.clienteId, tipo: v.tipo, importoTotale: t, importoAcconto: num(v.importoAcconto), dataEmissione: v.dataEmissione, dataScadenza: v.dataScadenza || null, note: null });
    mostra("Preventivo creato 🧾");
    chiudi();
  }
  return (
    <form className="grid gap-4" onSubmit={salva}>
      <Field label="Cliente *"><Select value={v.clienteId} onChange={(val) => setV((s) => ({ ...s, clienteId: val }))} options={db.clienti.map((c) => ({ value: c.id, label: `${c.nome} ${c.cognome}` }))} /></Field>
      <div>
        <Etichetta>Formato</Etichetta>
        <TileSelect tinta="preventivo" cols={2} value={v.tipo} onChange={(val) => setV((s) => ({ ...s, tipo: val as TipoPreventivo }))} options={PREV_TILE} />
      </div>
      <div>
        <Etichetta>Importo totale</Etichetta>
        <AmountField tinta="preventivo" autoFocus value={v.importoTotale} onChange={(val) => setV((s) => ({ ...s, importoTotale: val }))} suggerimenti={[{ label: "100", valore: 100 }, { label: "300", valore: 300 }, { label: "500", valore: 500 }, { label: "800", valore: 800 }]} />
      </div>
      {v.tipo === "acconto_saldo" && (
        <>
          <Field label="Acconto (€)" hint="Vuoto = metà"><Input type="number" step="0.01" value={v.importoAcconto} onChange={(e) => setV((s) => ({ ...s, importoAcconto: e.target.value }))} /></Field>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[13px] border border-preventivo-100 bg-preventivo-50 px-3 py-2.5 text-center">
              <div className="text-[0.64rem] font-bold uppercase tracking-wide text-preventivo-600">Acconto</div>
              <div className="text-[1.05rem] font-extrabold text-ink">{euro(acconto)}</div>
            </div>
            <div className="rounded-[13px] border border-preventivo-100 bg-preventivo-50 px-3 py-2.5 text-center">
              <div className="text-[0.64rem] font-bold uppercase tracking-wide text-preventivo-600">Saldo</div>
              <div className="text-[1.05rem] font-extrabold text-ink">{euro(saldo)}</div>
            </div>
          </div>
        </>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Emissione"><Input type="date" value={v.dataEmissione} onChange={(e) => setV((s) => ({ ...s, dataEmissione: e.target.value }))} /></Field>
        <Field label="Scadenza incasso"><Input type="date" value={v.dataScadenza} onChange={(e) => setV((s) => ({ ...s, dataScadenza: e.target.value }))} /></Field>
      </div>
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
    <Sheet aperto={aperto} onClose={chiudi} titolo="Registra ore" sottotitolo="Segna il lavoro di oggi ⏱️" accent={ENTITA.operatore.grad} icona={<Clock size={20} />}>
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
  function salva(e: React.FormEvent) {
    e.preventDefault();
    const ore = num(v.ore);
    if (!v.clienteId || ore === null || ore <= 0) return mostra("Scegli cliente e ore.", "error");
    registra({ clienteId: v.clienteId, operatoreId: v.operatoreId || null, data: v.data, ore, note: v.note || null });
    mostra(`+${ore}h registrate ⏱️`);
    chiudi();
  }
  return (
    <form className="grid gap-4" onSubmit={salva}>
      {/* stepper protagonista */}
      <div className="rounded-[18px] border border-operatore-100 bg-operatore-50/50 p-4">
        <Stepper tinta="operatore" value={v.ore} onChange={(val) => setV((s) => ({ ...s, ore: val }))} presets={[1, 2, 4, 8]} />
      </div>
      <div>
        <Etichetta>Cliente</Etichetta>
        <ChipPicker tinta="cliente" items={clientiChip(db)} value={v.clienteId} onChange={(id) => setV((s) => ({ ...s, clienteId: id }))} vuoto="Crea prima un cliente." />
      </div>
      <div>
        <Etichetta>Chi ha lavorato</Etichetta>
        <ChipPicker tinta="operatore" items={operatoriChip(db)} value={v.operatoreId} onChange={(id) => setV((s) => ({ ...s, operatoreId: id }))} consentiNessuno vuoto="Nessun operatore." />
      </div>
      <div>
        <Etichetta>Giorno</Etichetta>
        <QuickDate tinta="operatore" value={v.data} onChange={(d) => setV((s) => ({ ...s, data: d }))} />
      </div>
      <Field label="Nota"><Input value={v.note} onChange={(e) => setV((s) => ({ ...s, note: e.target.value }))} placeholder="es. manutenzione verde" /></Field>
      <SheetFooter>
        <Button type="button" onClick={chiudi}>Annulla</Button>
        <Button variante="primary" type="submit"><Save size={16} /> Salva ore</Button>
      </SheetFooter>
    </form>
  );
}

/* ============================== SPESA ============================= */
const SPESA_TILE: Tile[] = [
  { value: "benzina", label: "Benzina", icona: <Fuel size={18} /> },
  { value: "materiali", label: "Materiali", icona: <Package size={18} /> },
  { value: "attrezzi", label: "Attrezzi", icona: <Wrench size={18} /> },
  { value: "altro", label: "Altro", icona: <Tag size={18} /> },
];
function SpesaSheet() {
  const { aperto, ctx, seq, chiudi } = useSheet("spesa");
  return (
    <Sheet aperto={aperto} onClose={chiudi} titolo="Nuova spesa" sottotitolo="Cosa è uscito dalla cassa?" accent={ENTITA.spesa.grad} icona={<Fuel size={20} />}>
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
  function salva(e: React.FormEvent) {
    e.preventDefault();
    const importo = num(v.importo);
    if (importo === null || importo <= 0) return mostra("Importo non valido.", "error");
    crea({ categoria: v.categoria, importo, data: v.data, clienteId: v.clienteId || null, descrizione: v.descrizione || null });
    mostra("Spesa segnata ⛽");
    chiudi();
  }
  return (
    <form className="grid gap-4" onSubmit={salva}>
      <div>
        <Etichetta>Categoria</Etichetta>
        <TileSelect tinta="spesa" cols={4} value={v.categoria} onChange={(val) => setV((s) => ({ ...s, categoria: val as CategoriaSpesa }))} options={SPESA_TILE} />
      </div>
      <div>
        <Etichetta>Importo</Etichetta>
        <AmountField tinta="spesa" autoFocus value={v.importo} onChange={(val) => setV((s) => ({ ...s, importo: val }))} suggerimenti={[{ label: "10", valore: 10 }, { label: "20", valore: 20 }, { label: "50", valore: 50 }, { label: "100", valore: 100 }]} />
      </div>
      <div>
        <Etichetta>Quando</Etichetta>
        <QuickDate tinta="spesa" value={v.data} onChange={(d) => setV((s) => ({ ...s, data: d }))} />
      </div>
      <Field label="Cliente (facoltativo)"><Select value={v.clienteId} onChange={(val) => setV((s) => ({ ...s, clienteId: val }))} options={[{ value: "", label: "— nessuno —" }, ...db.clienti.map((c) => ({ value: c.id, label: `${c.nome} ${c.cognome}` }))]} placeholder="— nessuno —" /></Field>
      <Field label="Descrizione"><Input value={v.descrizione} onChange={(e) => setV((s) => ({ ...s, descrizione: e.target.value }))} placeholder="es. Pieno furgone" /></Field>
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
    <Sheet aperto={aperto} onClose={chiudi} titolo="Incasso atteso" sottotitolo="Un pagamento da segnare in entrata" accent={ENTITA.entrata.grad} icona={<Banknote size={20} />}>
      {aperto && <IncassoBody key={seq} ctx={ctx} chiudi={chiudi} />}
    </Sheet>
  );
}
function IncassoBody({ ctx, chiudi }: { ctx: SheetCtx; chiudi: () => void }) {
  const db = useStore((s) => s.db);
  const crea = useStore((s) => s.creaPagamento);
  const mostra = useToast((s) => s.mostra);
  const [v, setV] = useState({ clienteId: ctx.clienteId ?? "", importoAtteso: "", dataScadenza: "", note: "" });
  function salva(e: React.FormEvent) {
    e.preventDefault();
    const importo = num(v.importoAtteso);
    if (!v.clienteId || importo === null || importo <= 0) return mostra("Cliente e importo richiesti.", "error");
    crea({ clienteId: v.clienteId, importoAtteso: importo, dataScadenza: v.dataScadenza || null, note: v.note || null });
    mostra("Incasso atteso 💶");
    chiudi();
  }
  return (
    <form className="grid gap-4" onSubmit={salva}>
      <Field label="Cliente *"><Select value={v.clienteId} onChange={(val) => setV((s) => ({ ...s, clienteId: val }))} options={db.clienti.map((c) => ({ value: c.id, label: `${c.nome} ${c.cognome}` }))} /></Field>
      <div>
        <Etichetta>Importo atteso</Etichetta>
        <AmountField tinta="entrata" autoFocus value={v.importoAtteso} onChange={(val) => setV((s) => ({ ...s, importoAtteso: val }))} suggerimenti={[{ label: "100", valore: 100 }, { label: "200", valore: 200 }, { label: "500", valore: 500 }]} />
      </div>
      <div>
        <Etichetta>Scadenza</Etichetta>
        <QuickDate tinta="entrata" value={v.dataScadenza} onChange={(d) => setV((s) => ({ ...s, dataScadenza: d }))} />
      </div>
      <Field label="Note"><Input value={v.note} onChange={(e) => setV((s) => ({ ...s, note: e.target.value }))} /></Field>
      <SheetFooter>
        <Button type="button" onClick={chiudi}>Annulla</Button>
        <Button variante="primary" type="submit"><Save size={16} /> Crea</Button>
      </SheetFooter>
    </form>
  );
}

/* ============================ COMPENSO ============================ */
const METODO_TILE: Tile[] = [
  { value: "contanti", label: "Contanti", icona: <Banknote size={18} /> },
  { value: "bonifico", label: "Bonifico", icona: <Landmark size={18} /> },
  { value: "altro", label: "Altro", icona: <Wallet size={18} /> },
];
function CompensoSheet() {
  const { aperto, ctx, seq, chiudi } = useSheet("compenso");
  return (
    <Sheet aperto={aperto} onClose={chiudi} titolo="Paga operatore" sottotitolo="Salda le ore della squadra 🤝" accent={ENTITA.uscita.grad} icona={<HandCoins size={20} />}>
      {aperto && <CompensoBody key={seq} ctx={ctx} chiudi={chiudi} />}
    </Sheet>
  );
}
function CompensoBody({ ctx, chiudi }: { ctx: SheetCtx; chiudi: () => void }) {
  const db = useStore((s) => s.db);
  const paga = useStore((s) => s.pagaOperatore);
  const mostra = useToast((s) => s.mostra);
  const saldoIniz = useMemo(() => (ctx.operatoreId ? libroOperatore(db, ctx.operatoreId).saldo : 0), [db, ctx.operatoreId]);
  const [v, setV] = useState({
    operatoreId: ctx.operatoreId ?? "",
    importo: ctx.operatoreId && saldoIniz > 0 ? String(saldoIniz) : "",
    data: oggiISO(),
    metodo: "contanti" as MetodoPagamento,
    note: "",
  });
  const saldo = v.operatoreId ? libroOperatore(db, v.operatoreId).saldo : 0;

  function salva(e: React.FormEvent) {
    e.preventDefault();
    const importo = num(v.importo);
    if (!v.operatoreId || importo === null || importo <= 0) return mostra("Operatore e importo richiesti.", "error");
    paga({ operatoreId: v.operatoreId, importo, data: v.data, metodo: v.metodo, note: v.note || null });
    mostra("Compenso pagato 🤝");
    chiudi();
  }
  return (
    <form className="grid gap-4" onSubmit={salva}>
      <div>
        <Etichetta>Operatore</Etichetta>
        <ChipPicker tinta="operatore" items={operatoriChip(db)} value={v.operatoreId} onChange={(id) => setV((s) => ({ ...s, operatoreId: id, importo: libroOperatore(db, id).saldo > 0 ? String(libroOperatore(db, id).saldo) : "" }))} vuoto="Nessun operatore." />
      </div>
      {v.operatoreId && (
        <div className="flex items-center justify-between rounded-[14px] border border-uscita-100 bg-uscita-50 px-4 py-3">
          <div>
            <div className="text-[0.66rem] font-bold uppercase tracking-wide text-uscita-600">Saldo da pagare</div>
            <div className="text-[1.3rem] font-extrabold text-ink">{euro(saldo)}</div>
          </div>
          {saldo > 0 && <Button type="button" dim="sm" variante="soft" onClick={() => setV((s) => ({ ...s, importo: String(saldo) }))}>Salda tutto</Button>}
        </div>
      )}
      <div>
        <Etichetta>Importo</Etichetta>
        <AmountField tinta="uscita" value={v.importo} onChange={(val) => setV((s) => ({ ...s, importo: val }))} suggerimenti={saldo > 0 ? [{ label: `Tutto · ${euro(saldo)}`, valore: saldo }] : []} />
      </div>
      <div>
        <Etichetta>Metodo</Etichetta>
        <TileSelect tinta="uscita" cols={3} value={v.metodo} onChange={(val) => setV((s) => ({ ...s, metodo: val as MetodoPagamento }))} options={METODO_TILE} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Data"><Input type="date" value={v.data} onChange={(e) => setV((s) => ({ ...s, data: e.target.value }))} /></Field>
        <Field label="Note"><Input value={v.note} onChange={(e) => setV((s) => ({ ...s, note: e.target.value }))} /></Field>
      </div>
      <SheetFooter>
        <Button type="button" onClick={chiudi}>Annulla</Button>
        <Button variante="primary" type="submit"><Save size={16} /> Registra</Button>
      </SheetFooter>
    </form>
  );
}

/* ============================ ATTREZZO ============================ */
const ATTREZZO_TILE: Tile[] = [
  { value: "ok", label: "In uso", icona: <Wrench size={18} /> },
  { value: "manutenzione", label: "Manutenz.", icona: <Wrench size={18} /> },
  { value: "dismesso", label: "Dismesso", icona: <Tag size={18} /> },
];
function AttrezzoSheet() {
  const { aperto, ctx, seq, chiudi } = useSheet("attrezzo");
  return (
    <Sheet aperto={aperto} onClose={chiudi} titolo={ctx.id ? "Modifica attrezzo" : "Nuovo attrezzo"} sottotitolo={ctx.id ? undefined : "Aggiungi al patrimonio"} accent={ENTITA.patrimonio.grad} icona={<Wrench size={20} />}>
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
  function salva(e: React.FormEvent) {
    e.preventDefault();
    if (!v.nome.trim()) return mostra("Il nome è obbligatorio.", "error");
    const dati = { nome: v.nome.trim(), costoAcquisto: num(v.costoAcquisto), dataAcquisto: v.dataAcquisto || null, stato: v.stato };
    if (esistente) { aggiorna(esistente.id, dati); mostra("Attrezzo aggiornato!"); } else { crea(dati); mostra("Attrezzo aggiunto 🔧"); }
    chiudi();
  }
  return (
    <form className="grid gap-4" onSubmit={salva}>
      <Field label="Nome *"><Input value={v.nome} onChange={(e) => setV((s) => ({ ...s, nome: e.target.value }))} placeholder="es. Motosega Stihl" autoFocus /></Field>
      <div>
        <Etichetta>Costo d'acquisto</Etichetta>
        <AmountField tinta="patrimonio" value={v.costoAcquisto} onChange={(val) => setV((s) => ({ ...s, costoAcquisto: val }))} suggerimenti={[{ label: "150", valore: 150 }, { label: "300", valore: 300 }, { label: "600", valore: 600 }]} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Data acquisto"><Input type="date" value={v.dataAcquisto} onChange={(e) => setV((s) => ({ ...s, dataAcquisto: e.target.value }))} /></Field>
        <div>
          <Etichetta>Stato</Etichetta>
          <TileSelect tinta="patrimonio" cols={3} value={v.stato} onChange={(val) => setV((s) => ({ ...s, stato: val as StatoAttrezzo }))} options={ATTREZZO_TILE} />
        </div>
      </div>
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
