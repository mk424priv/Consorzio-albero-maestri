// Fogli globali: menù "Crea" + finestre-scena di creazione/modifica.
// Ogni finestra ha due zone (scena viva + form), campi "disegnati" con icona
// raggruppati in sezioni, e un protagonista dedicato al tipo di dato.
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlignLeft, Banknote, CalendarDays, CheckCircle2, Circle, CircleDot, Clock, Coins,
  Crown, Euro, Fuel, HandCoins, Hammer, Landmark, Layers, Mail, MapPin, Package,
  Phone, ReceiptText, Save, Sparkles, Sprout, StickyNote, Tag, Type, User, Users,
  Wallet, Wrench, type LucideIcon,
} from "lucide-react";
import { useStore } from "@/store/store";
import { useUI, type SheetCtx, type SheetTipo } from "@/store/ui";
import { useToast } from "@/store/toast";
import {
  AmountPad, AreaIcona, Avatar, Button, CampoIcona, ChipPicker, QuickDate, Select,
  Sezione, Sheet, SheetFooter, SheetRow, SheetStagger, Stepper, TileSelect, type Tile,
} from "@/components/ui";
import { etichetta } from "@/lib/dominio";
import type { CategoriaSpesa, MetodoPagamento, Modalita, RuoloOperatore, StatoAttrezzo, TipoCompenso, TipoPreventivo } from "@/lib/dominio";
import { ENTITA } from "@/lib/entita";
import { inizialiDa } from "@/lib/codice-parlante";
import { libroOperatore } from "@/lib/squadra";
import { euro } from "@/lib/format";
import { festa, festaDoppia } from "@/lib/festa";
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
const nomeCli = (db: Database, id: string) => { const c = db.clienti.find((x) => x.id === id); return c ? `${c.nome} ${c.cognome}` : ""; };

function useSheet(tipo: SheetTipo) {
  const sheet = useUI((s) => s.sheet);
  const chiudi = useUI((s) => s.chiudi);
  return { aperto: sheet?.tipo === tipo, ctx: (sheet?.ctx ?? {}) as SheetCtx, seq: sheet?.seq ?? 0, chiudi };
}
function Etichetta({ children }: { children: React.ReactNode }) {
  return <div className="mb-1.5 text-[0.74rem] font-bold uppercase tracking-wide text-muted">{children}</div>;
}
function ScenaCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[14px] border border-white/15 bg-white/12 p-3 backdrop-blur ${className ?? ""}`}>{children}</div>;
}
function AvatarBianco({ nome, size = "lg" as const }: { nome: string; size?: "lg" | "xl" }) {
  return <Avatar nome={nome} size={size} grad="bg-white/20 ring-1 ring-white/40" />;
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
    <Sheet aperto={aperto} onClose={chiudi} titolo="Crea" sottotitolo="Cosa registri ora?" accent="bg-gradient-to-br from-brand-500 to-brand-700" pattern="dots" icona={<Sparkles size={20} />} motivo={<Sparkles size={120} strokeWidth={1.1} />}>
      <SheetStagger className="grid grid-cols-2 gap-2.5 pb-1 sm:grid-cols-4">
        {voci.map((v) => (
          <SheetRow key={v.tipo}>
            <button onClick={() => apri(v.tipo)} className="flex w-full flex-col items-center gap-2 rounded-[16px] border border-line bg-surface p-4 text-[0.82rem] font-semibold text-ink transition-all duration-150 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[var(--shadow-md)]">
              <span className={`grid h-11 w-11 place-items-center rounded-[13px] ${v.classi}`}><v.Icona size={20} /></span>
              {v.label}
            </button>
          </SheetRow>
        ))}
      </SheetStagger>
    </Sheet>
  );
}

/* ============================== CLIENTE ============================= */
const MODALITA_TILE: Tile[] = [
  { value: "preventivo", label: "A preventivo", icona: <ReceiptText size={18} /> },
  { value: "ore", label: "A ore", icona: <Clock size={18} /> },
  { value: "misto", label: "Misto", icona: <Layers size={18} /> },
];
function ClienteSheet() { const { aperto, ctx, seq, chiudi } = useSheet("cliente"); return <ClienteForm key={seq} aperto={aperto} ctx={ctx} chiudi={chiudi} />; }
function ClienteForm({ aperto, ctx, chiudi }: { aperto: boolean; ctx: SheetCtx; chiudi: () => void }) {
  const db = useStore((s) => s.db);
  const creaCliente = useStore((s) => s.creaCliente);
  const aggiornaCliente = useStore((s) => s.aggiornaCliente);
  const mostra = useToast((s) => s.mostra);
  const navigate = useNavigate();
  const esistente = ctx.id ? db.clienti.find((c) => c.id === ctx.id) : undefined;
  const [v, setV] = useState({
    nome: esistente?.nome ?? "", cognome: esistente?.cognome ?? "", telefono: esistente?.telefono ?? "",
    email: esistente?.email ?? "", luogo: esistente?.luogo ?? "",
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
    else { const id = creaCliente({ nome: v.nome, cognome: v.cognome, ...dati }); festa("cliente"); mostra("Radice piantata 🌱"); chiudi(); navigate(`/cliente/${id}`); }
  }
  const scena = (
    <ScenaCard>
      <div className="flex items-center gap-3">
        <AvatarBianco nome={nomeCompl} />
        <div className="min-w-0"><div className="truncate font-display font-bold leading-tight">{nomeCompl}</div><div className="mt-1 inline-block rounded-md bg-white/15 px-2 py-0.5 font-mono text-[0.7rem]">{codiceProvv}</div></div>
      </div>
      <div className="mt-3 text-[0.72rem] text-white/80">{etichetta(v.modalitaPredefinita)}{v.tariffaOraria ? ` · ${v.tariffaOraria} €/h` : ""}</div>
    </ScenaCard>
  );
  return (
    <Sheet aperto={aperto} onClose={chiudi} titolo={esistente ? "Modifica cliente" : "Nuova radice"} sottotitolo={esistente ? undefined : "Da un cliente nasce tutto"} accent={ENTITA.cliente.grad} pattern="dots" icona={<Sprout size={20} />} motivo={<Sprout size={120} strokeWidth={1.1} />} scena={scena}>
      <form onSubmit={salva}>
        <SheetStagger className="grid gap-3">
          <SheetRow><Sezione icona={<User size={15} />} titolo="Anagrafica">
            <div className="grid gap-2 sm:grid-cols-2">
              <CampoIcona icona={<User size={17} />} label="Nome *" value={v.nome} onChange={set("nome")} placeholder="Mario" autoFocus />
              <CampoIcona icona={<User size={17} />} label="Cognome *" value={v.cognome} onChange={set("cognome")} placeholder="Rossi" />
            </div>
          </Sezione></SheetRow>
          <SheetRow><Sezione icona={<Phone size={15} />} titolo="Contatti">
            <CampoIcona icona={<Phone size={17} />} label="Telefono" value={v.telefono} onChange={set("telefono")} placeholder="333 1234567" inputMode="tel" />
            <CampoIcona icona={<Mail size={17} />} label="Email" type="email" value={v.email} onChange={set("email")} placeholder="mario@email.it" />
            <CampoIcona icona={<MapPin size={17} />} label="Luogo" value={v.luogo} onChange={set("luogo")} placeholder="Villa Rossi, Marina di Campo" />
          </Sezione></SheetRow>
          <SheetRow><Sezione icona={<ReceiptText size={15} />} titolo="Accordo economico">
            <TileSelect tinta="cliente" cols={3} value={v.modalitaPredefinita} onChange={(val) => setV((s) => ({ ...s, modalitaPredefinita: val as Modalita }))} options={MODALITA_TILE} />
            <CampoIcona icona={<Euro size={17} />} label="Tariffa oraria (€/h)" type="number" step="0.01" inputMode="decimal" value={v.tariffaOraria} onChange={set("tariffaOraria")} placeholder="30" />
          </Sezione></SheetRow>
          <SheetRow><SheetFooter><Button type="button" onClick={chiudi}>Annulla</Button><Button variante="primary" type="submit"><Save size={16} /> {esistente ? "Salva" : "Crea cliente"}</Button></SheetFooter></SheetRow>
        </SheetStagger>
      </form>
    </Sheet>
  );
}

/* ============================= OPERATORE =========================== */
const RUOLO_TILE: Tile[] = [
  { value: "titolare", label: "Titolare", icona: <Crown size={18} /> },
  { value: "collaboratore", label: "Collaboratore", icona: <User size={18} /> },
];
function OperatoreSheet() { const { aperto, ctx, seq, chiudi } = useSheet("operatore"); return <OperatoreForm key={seq} aperto={aperto} ctx={ctx} chiudi={chiudi} />; }
function OperatoreForm({ aperto, ctx, chiudi }: { aperto: boolean; ctx: SheetCtx; chiudi: () => void }) {
  const db = useStore((s) => s.db);
  const crea = useStore((s) => s.creaOperatore);
  const aggiorna = useStore((s) => s.aggiornaOperatore);
  const mostra = useToast((s) => s.mostra);
  const navigate = useNavigate();
  const esistente = ctx.id ? db.operatori.find((o) => o.id === ctx.id) : undefined;
  const [v, setV] = useState({
    nome: esistente?.nome ?? "", ruolo: (esistente?.ruolo ?? "collaboratore") as RuoloOperatore,
    tariffaOraria: esistente?.tariffaOraria != null ? String(esistente.tariffaOraria) : "", telefono: esistente?.telefono ?? "",
  });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV((s) => ({ ...s, [k]: e.target.value }));
  function salva(e: React.FormEvent) {
    e.preventDefault();
    if (!v.nome.trim()) return mostra("Il nome è obbligatorio.", "error");
    const dati = { ruolo: v.ruolo, tariffaOraria: num(v.tariffaOraria), telefono: v.telefono || null, note: esistente?.note ?? null };
    if (esistente) { aggiorna(esistente.id, { nome: v.nome.trim(), ...dati }); mostra("Operatore aggiornato!"); chiudi(); }
    else { const id = crea({ nome: v.nome, ...dati }); festa("operatore"); mostra("Squadra rinforzata 🧑‍🌾"); chiudi(); navigate(`/operatore/${id}`); }
  }
  const scena = (
    <ScenaCard className="text-center">
      <AvatarBianco nome={v.nome || "Operatore"} size="xl" />
      <div className="mt-2 font-display font-bold leading-tight">{v.nome || "Nuovo operatore"}</div>
      <div className="mt-1 flex items-center justify-center gap-1.5 text-[0.72rem] text-white/80">{v.ruolo === "titolare" ? <Crown size={13} /> : <User size={13} />}{etichetta(v.ruolo)}</div>
      {v.tariffaOraria && <div className="mt-2 inline-block rounded-full bg-white/15 px-2.5 py-0.5 font-display text-[0.8rem] font-bold">{v.tariffaOraria} €/h</div>}
    </ScenaCard>
  );
  return (
    <Sheet aperto={aperto} onClose={chiudi} titolo={esistente ? "Modifica operatore" : "Nuovo operatore"} sottotitolo={esistente ? undefined : "Un membro della squadra"} accent={ENTITA.operatore.grad} pattern="grid" icona={<Users size={20} />} motivo={<Users size={120} strokeWidth={1.1} />} scena={scena}>
      <form onSubmit={salva}>
        <SheetStagger className="grid gap-3">
          <SheetRow><CampoIcona icona={<User size={17} />} label="Nome *" value={v.nome} onChange={set("nome")} placeholder="Luca" autoFocus /></SheetRow>
          <SheetRow><div><Etichetta>Ruolo</Etichetta><TileSelect tinta="operatore" cols={2} value={v.ruolo} onChange={(val) => setV((s) => ({ ...s, ruolo: val as RuoloOperatore }))} options={RUOLO_TILE} /></div></SheetRow>
          <SheetRow><Sezione icona={<Wallet size={15} />} titolo="Dettagli">
            <CampoIcona icona={<Euro size={17} />} label="Tariffa oraria (€/h)" type="number" step="0.01" inputMode="decimal" value={v.tariffaOraria} onChange={set("tariffaOraria")} placeholder="16" />
            <CampoIcona icona={<Phone size={17} />} label="Telefono" value={v.telefono} onChange={set("telefono")} inputMode="tel" />
          </Sezione></SheetRow>
          <SheetRow><SheetFooter><Button type="button" onClick={chiudi}>Annulla</Button><Button variante="primary" type="submit"><Save size={16} /> {esistente ? "Salva" : "Crea"}</Button></SheetFooter></SheetRow>
        </SheetStagger>
      </form>
    </Sheet>
  );
}

/* ============================== LAVORO ============================= */
const COMPENSO_TILE: Tile[] = [
  { value: "preventivo", label: "Preventivo", icona: <ReceiptText size={18} /> },
  { value: "ore", label: "A ore", icona: <Clock size={18} /> },
  { value: "misto", label: "Misto", icona: <Layers size={18} /> },
];
const STATO_LAVORO_TILE: Tile[] = [
  { value: "da_fare", label: "Da fare", icona: <Circle size={18} /> },
  { value: "in_corso", label: "In corso", icona: <CircleDot size={18} /> },
  { value: "fatto", label: "Fatto", icona: <CheckCircle2 size={18} /> },
];
function LavoroSheet() { const { aperto, ctx, seq, chiudi } = useSheet("lavoro"); return <LavoroForm key={seq} aperto={aperto} ctx={ctx} chiudi={chiudi} />; }
function LavoroForm({ aperto, ctx, chiudi }: { aperto: boolean; ctx: SheetCtx; chiudi: () => void }) {
  const db = useStore((s) => s.db);
  const crea = useStore((s) => s.creaLavoro);
  const aggiorna = useStore((s) => s.aggiornaLavoro);
  const apri = useUI((s) => s.apri);
  const mostra = useToast((s) => s.mostra);
  const esistente = ctx.id ? db.lavori.find((l) => l.id === ctx.id) : undefined;
  const [v, setV] = useState({
    clienteId: esistente?.clienteId ?? ctx.clienteId ?? "",
    titolo: esistente?.titolo ?? "",
    descrizione: esistente?.descrizione ?? "",
    data: esistente?.data ?? ctx.data ?? oggiISO(),
    durata: esistente?.durataPrevistaOre != null ? String(esistente.durataPrevistaOre) : "",
    tipoCompenso: (esistente?.tipoCompenso ?? "preventivo") as TipoCompenso,
    stato: (esistente?.stato ?? "da_fare") as "da_fare" | "in_corso" | "fatto",
    operatoreId: esistente?.operatoreId ?? "",
    luogo: esistente?.luogo ?? "",
  });
  const oreReali = esistente ? db.ore.filter((o) => o.lavoroId === esistente.id).reduce((a, o) => a + o.ore, 0) : 0;

  function salva(e: React.FormEvent) {
    e.preventDefault();
    if (!v.clienteId || !v.titolo.trim()) return mostra("Cliente e titolo obbligatori.", "error");
    const dati = {
      clienteId: v.clienteId, titolo: v.titolo.trim(), descrizione: v.descrizione || null, data: v.data,
      durataPrevistaOre: num(v.durata), tipoCompenso: v.tipoCompenso, stato: v.stato,
      operatoreId: v.operatoreId || null, luogo: v.luogo || null,
    };
    if (esistente) { aggiorna(esistente.id, dati); mostra("Lavoro aggiornato!"); } else { crea(dati); festa("lavoro"); mostra("Lavoro in agenda 🗓️"); }
    chiudi();
  }
  const d = new Date(v.data);
  const giorno = Number.isNaN(d.getTime()) ? "—" : d.getDate();
  const mese = Number.isNaN(d.getTime()) ? "" : new Intl.DateTimeFormat("it-IT", { month: "short" }).format(d);
  const statoLabel = v.stato === "fatto" ? "Fatto" : v.stato === "in_corso" ? "In corso" : "Da fare";
  const scena = (
    <ScenaCard className="text-center">
      <div className="font-display text-[2.8rem] font-bold leading-none">{giorno}</div>
      <div className="text-[0.78rem] font-bold uppercase tracking-wide text-white/80">{mese}</div>
      <div className="mt-2 truncate text-[0.82rem] font-semibold">{v.titolo || "Nuovo lavoro"}</div>
      {v.clienteId && <div className="truncate text-[0.72rem] text-white/75">{nomeCli(db, v.clienteId)}</div>}
      <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-[0.66rem] font-semibold">
        <span className="rounded-full bg-white/15 px-2 py-0.5">{statoLabel}</span>
        {num(v.durata) ? <span className="rounded-full bg-white/15 px-2 py-0.5">~{v.durata}h prev.</span> : null}
        {esistente && oreReali > 0 ? <span className="rounded-full bg-white/15 px-2 py-0.5">{oreReali}h reali</span> : null}
      </div>
    </ScenaCard>
  );
  return (
    <Sheet aperto={aperto} onClose={chiudi} titolo={esistente ? "Modifica lavoro" : "Nuovo lavoro"} sottotitolo={esistente ? undefined : "Programma un intervento"} accent={ENTITA.lavoro.grad} pattern="diagonal" icona={<Hammer size={20} />} motivo={<Hammer size={120} strokeWidth={1.1} />} scena={scena}>
      <form onSubmit={salva}>
        <SheetStagger className="grid gap-3">
          <SheetRow><div><Etichetta>Cliente</Etichetta><ChipPicker tinta="cliente" items={clientiChip(db)} value={v.clienteId} onChange={(id) => setV((s) => ({ ...s, clienteId: id }))} vuoto="Crea prima un cliente." /></div></SheetRow>
          <SheetRow><Sezione icona={<Hammer size={15} />} titolo="Dettagli">
            <CampoIcona icona={<Type size={17} />} label="Titolo *" value={v.titolo} onChange={(e) => setV((s) => ({ ...s, titolo: e.target.value }))} placeholder="es. Potatura olivi" />
            <AreaIcona icona={<AlignLeft size={17} />} label="Descrizione" rows={2} value={v.descrizione} onChange={(e) => setV((s) => ({ ...s, descrizione: e.target.value }))} placeholder="dettagli dell'intervento…" />
            <CampoIcona icona={<MapPin size={17} />} label="Luogo" value={v.luogo} onChange={(e) => setV((s) => ({ ...s, luogo: e.target.value }))} />
          </Sezione></SheetRow>
          <SheetRow><div><Etichetta>Quando</Etichetta><QuickDate tinta="lavoro" value={v.data} onChange={(dd) => setV((s) => ({ ...s, data: dd }))} /></div></SheetRow>
          <SheetRow><div className="rounded-[18px] border border-lavoro-100 bg-lavoro-50/50 p-4">
            <div className="mb-1 text-center text-[0.7rem] font-bold uppercase tracking-wide text-muted">Durata prevista</div>
            <Stepper tinta="lavoro" value={v.durata} onChange={(val) => setV((s) => ({ ...s, durata: val }))} presets={[1, 2, 4, 8]} />
          </div></SheetRow>
          <SheetRow><div><Etichetta>Tipo compenso</Etichetta><TileSelect tinta="lavoro" cols={3} value={v.tipoCompenso} onChange={(val) => setV((s) => ({ ...s, tipoCompenso: val as TipoCompenso }))} options={COMPENSO_TILE} /></div></SheetRow>
          <SheetRow><div><Etichetta>Stato</Etichetta><TileSelect tinta="lavoro" cols={3} value={v.stato} onChange={(val) => setV((s) => ({ ...s, stato: val as typeof v.stato }))} options={STATO_LAVORO_TILE} /></div></SheetRow>
          <SheetRow><div><Etichetta>Assegnato a</Etichetta><ChipPicker tinta="operatore" items={operatoriChip(db)} value={v.operatoreId} onChange={(id) => setV((s) => ({ ...s, operatoreId: id }))} consentiNessuno vuoto="Nessun operatore." /></div></SheetRow>
          {esistente && (
            <SheetRow><button type="button" onClick={() => apri("ore", { clienteId: v.clienteId, operatoreId: v.operatoreId || undefined, lavoroId: esistente.id, data: v.data })} className="flex w-full items-center justify-center gap-2 rounded-[13px] border border-dashed border-operatore-200 bg-operatore-50/50 py-2.5 text-[0.85rem] font-bold text-operatore-600">
              <Clock size={16} /> Registra ore su questo lavoro {oreReali > 0 ? `(${oreReali}h)` : ""}
            </button></SheetRow>
          )}
          <SheetRow><SheetFooter><Button type="button" onClick={chiudi}>Annulla</Button><Button variante="primary" type="submit"><Save size={16} /> {esistente ? "Salva" : "Aggiungi"}</Button></SheetFooter></SheetRow>
        </SheetStagger>
      </form>
    </Sheet>
  );
}

/* ============================ PREVENTIVO =========================== */
const PREV_TILE: Tile[] = [
  { value: "unico", label: "Cifra unica", icona: <Coins size={18} />, hint: "un pagamento" },
  { value: "acconto_saldo", label: "Acconto + saldo", icona: <Layers size={18} />, hint: "due rate" },
];
function PreventivoSheet() { const { aperto, ctx, seq, chiudi } = useSheet("preventivo"); return <PreventivoForm key={seq} aperto={aperto} ctx={ctx} chiudi={chiudi} />; }
function PreventivoForm({ aperto, ctx, chiudi }: { aperto: boolean; ctx: SheetCtx; chiudi: () => void }) {
  const db = useStore((s) => s.db);
  const crea = useStore((s) => s.creaPreventivo);
  const mostra = useToast((s) => s.mostra);
  const [v, setV] = useState({ clienteId: ctx.clienteId ?? "", tipo: "unico" as TipoPreventivo, importoTotale: "", importoAcconto: "", dataEmissione: oggiISO(), dataScadenza: "" });
  const tot = num(v.importoTotale) ?? 0;
  const acconto = v.importoAcconto.trim() === "" ? Math.round((tot / 2) * 100) / 100 : num(v.importoAcconto) ?? 0;
  const saldo = Math.round((tot - acconto) * 100) / 100;
  function salva(e: React.FormEvent) {
    e.preventDefault();
    const t = num(v.importoTotale);
    if (!v.clienteId || t === null || t <= 0) return mostra("Cliente e importo validi richiesti.", "error");
    const acc = num(v.importoAcconto);
    if (v.tipo === "acconto_saldo" && acc !== null && acc > t + 0.005) return mostra("L'acconto non può superare il totale.", "error");
    crea({ clienteId: v.clienteId, tipo: v.tipo, importoTotale: t, importoAcconto: num(v.importoAcconto), dataEmissione: v.dataEmissione, dataScadenza: v.dataScadenza || null, note: null });
    festa("preventivo"); mostra("Preventivo creato 🧾"); chiudi();
  }
  const scena = (
    <ScenaCard>
      <div className="text-[0.66rem] font-bold uppercase tracking-wide text-white/70">Ricevuta</div>
      <div className="mt-1 font-display text-[1.9rem] font-bold leading-none">{euro(tot)}</div>
      {v.clienteId && <div className="mt-1 truncate text-[0.74rem] text-white/80">{nomeCli(db, v.clienteId)}</div>}
      {v.tipo === "acconto_saldo" && (
        <div className="mt-3 space-y-1 border-t border-white/20 pt-2 text-[0.74rem]">
          <div className="flex justify-between"><span className="text-white/75">Acconto</span><b>{euro(acconto)}</b></div>
          <div className="flex justify-between"><span className="text-white/75">Saldo</span><b>{euro(saldo)}</b></div>
        </div>
      )}
    </ScenaCard>
  );
  return (
    <Sheet aperto={aperto} onClose={chiudi} titolo="Nuovo preventivo" sottotitolo="Concorda il prezzo" accent={ENTITA.preventivo.grad} pattern="rings" icona={<ReceiptText size={20} />} motivo={<ReceiptText size={120} strokeWidth={1.1} />} scena={scena}>
      <form onSubmit={salva}>
        <SheetStagger className="grid gap-3">
          <SheetRow><div><Etichetta>Cliente</Etichetta><Select value={v.clienteId} onChange={(val) => setV((s) => ({ ...s, clienteId: val }))} options={db.clienti.map((c) => ({ value: c.id, label: `${c.nome} ${c.cognome}` }))} /></div></SheetRow>
          <SheetRow><div><Etichetta>Formato</Etichetta><TileSelect tinta="preventivo" cols={2} value={v.tipo} onChange={(val) => setV((s) => ({ ...s, tipo: val as TipoPreventivo }))} options={PREV_TILE} /></div></SheetRow>
          <SheetRow><div><Etichetta>Importo totale</Etichetta><AmountPad tinta="preventivo" value={v.importoTotale} onChange={(val) => setV((s) => ({ ...s, importoTotale: val }))} suggerimenti={[{ label: "100", valore: 100 }, { label: "300", valore: 300 }, { label: "500", valore: 500 }, { label: "800", valore: 800 }]} /></div></SheetRow>
          {v.tipo === "acconto_saldo" && <SheetRow><CampoIcona icona={<Euro size={17} />} label="Acconto (€) — vuoto = metà" type="number" step="0.01" inputMode="decimal" value={v.importoAcconto} onChange={(e) => setV((s) => ({ ...s, importoAcconto: e.target.value }))} /></SheetRow>}
          <SheetRow><Sezione icona={<CalendarDays size={15} />} titolo="Date">
            <CampoIcona icona={<CalendarDays size={17} />} label="Emissione" type="date" value={v.dataEmissione} onChange={(e) => setV((s) => ({ ...s, dataEmissione: e.target.value }))} />
            <CampoIcona icona={<CalendarDays size={17} />} label="Scadenza incasso" type="date" value={v.dataScadenza} onChange={(e) => setV((s) => ({ ...s, dataScadenza: e.target.value }))} />
          </Sezione></SheetRow>
          <SheetRow><SheetFooter><Button type="button" onClick={chiudi}>Annulla</Button><Button variante="primary" type="submit"><Save size={16} /> Crea preventivo</Button></SheetFooter></SheetRow>
        </SheetStagger>
      </form>
    </Sheet>
  );
}

/* =============================== ORE =============================== */
function OreSheet() { const { aperto, ctx, seq, chiudi } = useSheet("ore"); return <OreForm key={seq} aperto={aperto} ctx={ctx} chiudi={chiudi} />; }
function OreForm({ aperto, ctx, chiudi }: { aperto: boolean; ctx: SheetCtx; chiudi: () => void }) {
  const db = useStore((s) => s.db);
  const registra = useStore((s) => s.registraOre);
  const mostra = useToast((s) => s.mostra);
  const [v, setV] = useState({ clienteId: ctx.clienteId ?? "", operatoreId: ctx.operatoreId ?? "", lavoroId: ctx.lavoroId ?? "", data: ctx.data ?? oggiISO(), ore: "", note: "" });
  const lavoriCliente = db.lavori.filter((l) => l.clienteId === v.clienteId).sort((a, b) => b.data.localeCompare(a.data));
  function salva(e: React.FormEvent) {
    e.preventDefault();
    const ore = num(v.ore);
    if (!v.clienteId || ore === null || ore <= 0) return mostra("Scegli cliente e ore.", "error");
    if (ore > 24) return mostra("Troppe ore per una registrazione (max 24).", "error");
    registra({ clienteId: v.clienteId, operatoreId: v.operatoreId || null, lavoroId: v.lavoroId || null, data: v.data, ore, note: v.note || null });
    festa("operatore"); mostra(`+${ore}h registrate ⏱️`); chiudi();
  }
  const scena = (
    <ScenaCard className="text-center">
      <div className="font-display text-[3.4rem] font-bold leading-none">{v.ore || "0"}<span className="text-[1.4rem]">h</span></div>
      <div className="mt-1 text-[0.72rem] uppercase tracking-wide text-white/75">ore di lavoro</div>
      {v.clienteId && <div className="mt-3 truncate text-[0.8rem] font-semibold">{nomeCli(db, v.clienteId)}</div>}
    </ScenaCard>
  );
  return (
    <Sheet aperto={aperto} onClose={chiudi} titolo="Registra ore" sottotitolo="Segna il lavoro di oggi" accent={ENTITA.operatore.grad} pattern="rings" icona={<Clock size={20} />} motivo={<Clock size={120} strokeWidth={1.1} />} scena={scena}>
      <form onSubmit={salva}>
        <SheetStagger className="grid gap-3">
          <SheetRow><div className="rounded-[18px] border border-operatore-100 bg-operatore-50/50 p-4"><Stepper tinta="operatore" value={v.ore} onChange={(val) => setV((s) => ({ ...s, ore: val }))} presets={[1, 2, 4, 8]} /></div></SheetRow>
          <SheetRow><div><Etichetta>Cliente</Etichetta><ChipPicker tinta="cliente" items={clientiChip(db)} value={v.clienteId} onChange={(id) => setV((s) => ({ ...s, clienteId: id, lavoroId: "" }))} vuoto="Crea prima un cliente." /></div></SheetRow>
          {v.clienteId && lavoriCliente.length > 0 && (
            <SheetRow><div><Etichetta>Su quale lavoro (facoltativo)</Etichetta>
              <Select value={v.lavoroId} onChange={(val) => setV((s) => ({ ...s, lavoroId: val }))} placeholder="— nessun lavoro —"
                options={[{ value: "", label: "— nessun lavoro —" }, ...lavoriCliente.map((l) => ({ value: l.id, label: `${new Date(l.data).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" })} · ${l.titolo}` }))]} />
            </div></SheetRow>
          )}
          <SheetRow><div><Etichetta>Chi ha lavorato</Etichetta><ChipPicker tinta="operatore" items={operatoriChip(db)} value={v.operatoreId} onChange={(id) => setV((s) => ({ ...s, operatoreId: id }))} consentiNessuno vuoto="Nessun operatore." /></div></SheetRow>
          <SheetRow><div><Etichetta>Giorno</Etichetta><QuickDate tinta="operatore" value={v.data} onChange={(dd) => setV((s) => ({ ...s, data: dd }))} /></div></SheetRow>
          <SheetRow><CampoIcona icona={<StickyNote size={17} />} label="Nota" value={v.note} onChange={(e) => setV((s) => ({ ...s, note: e.target.value }))} placeholder="es. manutenzione verde" /></SheetRow>
          <SheetRow><SheetFooter><Button type="button" onClick={chiudi}>Annulla</Button><Button variante="primary" type="submit"><Save size={16} /> Salva ore</Button></SheetFooter></SheetRow>
        </SheetStagger>
      </form>
    </Sheet>
  );
}

/* ============================== SPESA ============================= */
const SPESA_TILE: Tile[] = [
  { value: "benzina", label: "Benzina", icona: <Fuel size={18} /> },
  { value: "materiali", label: "Materiali", icona: <Package size={18} /> },
  { value: "attrezzi", label: "Attrezzi", icona: <Wrench size={18} /> },
  { value: "altro", label: "Altro", icona: <Tag size={18} /> },
];
const SPESA_ICONA: Record<string, React.ReactNode> = { benzina: <Fuel size={40} />, materiali: <Package size={40} />, attrezzi: <Wrench size={40} />, altro: <Tag size={40} /> };
function SpesaSheet() { const { aperto, ctx, seq, chiudi } = useSheet("spesa"); return <SpesaForm key={seq} aperto={aperto} ctx={ctx} chiudi={chiudi} />; }
function SpesaForm({ aperto, ctx, chiudi }: { aperto: boolean; ctx: SheetCtx; chiudi: () => void }) {
  const db = useStore((s) => s.db);
  const crea = useStore((s) => s.creaSpesa);
  const mostra = useToast((s) => s.mostra);
  const [v, setV] = useState({ categoria: "benzina" as CategoriaSpesa, importo: "", data: ctx.data ?? oggiISO(), clienteId: ctx.clienteId ?? "", descrizione: "" });
  function salva(e: React.FormEvent) {
    e.preventDefault();
    const importo = num(v.importo);
    if (importo === null || importo <= 0) return mostra("Importo non valido.", "error");
    crea({ categoria: v.categoria, importo, data: v.data, clienteId: v.clienteId || null, lavoroId: ctx.lavoroId ?? null, descrizione: v.descrizione || null });
    festa("spesa"); mostra("Spesa segnata ⛽"); chiudi();
  }
  const scena = (
    <ScenaCard className="text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-[16px] bg-white/15">{SPESA_ICONA[v.categoria]}</div>
      <div className="mt-2 text-[0.78rem] font-bold uppercase tracking-wide text-white/80">{etichetta(v.categoria)}</div>
      <div className="mt-1 font-display text-[1.9rem] font-bold leading-none">{euro(num(v.importo) ?? 0)}</div>
    </ScenaCard>
  );
  return (
    <Sheet aperto={aperto} onClose={chiudi} titolo="Nuova spesa" sottotitolo="Un'uscita dalla cassa" accent={ENTITA.spesa.grad} pattern="diagonal" icona={<Fuel size={20} />} motivo={<Fuel size={120} strokeWidth={1.1} />} scena={scena}>
      <form onSubmit={salva}>
        <SheetStagger className="grid gap-3">
          <SheetRow><div><Etichetta>Categoria</Etichetta><TileSelect tinta="spesa" cols={4} value={v.categoria} onChange={(val) => setV((s) => ({ ...s, categoria: val as CategoriaSpesa }))} options={SPESA_TILE} /></div></SheetRow>
          <SheetRow><div><Etichetta>Importo</Etichetta><AmountPad tinta="spesa" value={v.importo} onChange={(val) => setV((s) => ({ ...s, importo: val }))} suggerimenti={[{ label: "10", valore: 10 }, { label: "20", valore: 20 }, { label: "50", valore: 50 }, { label: "100", valore: 100 }]} /></div></SheetRow>
          <SheetRow><div><Etichetta>Quando</Etichetta><QuickDate tinta="spesa" value={v.data} onChange={(dd) => setV((s) => ({ ...s, data: dd }))} /></div></SheetRow>
          <SheetRow><div><Etichetta>Cliente (facoltativo)</Etichetta><Select value={v.clienteId} onChange={(val) => setV((s) => ({ ...s, clienteId: val }))} options={[{ value: "", label: "— nessuno —" }, ...db.clienti.map((c) => ({ value: c.id, label: `${c.nome} ${c.cognome}` }))]} placeholder="— nessuno —" /></div></SheetRow>
          <SheetRow><CampoIcona icona={<StickyNote size={17} />} label="Descrizione" value={v.descrizione} onChange={(e) => setV((s) => ({ ...s, descrizione: e.target.value }))} placeholder="es. Pieno furgone" /></SheetRow>
          <SheetRow><SheetFooter><Button type="button" onClick={chiudi}>Annulla</Button><Button variante="primary" type="submit"><Save size={16} /> Aggiungi spesa</Button></SheetFooter></SheetRow>
        </SheetStagger>
      </form>
    </Sheet>
  );
}

/* ============================= INCASSO ============================ */
function IncassoSheet() { const { aperto, ctx, seq, chiudi } = useSheet("incasso"); return <IncassoForm key={seq} aperto={aperto} ctx={ctx} chiudi={chiudi} />; }
function IncassoForm({ aperto, ctx, chiudi }: { aperto: boolean; ctx: SheetCtx; chiudi: () => void }) {
  const db = useStore((s) => s.db);
  const crea = useStore((s) => s.creaPagamento);
  const mostra = useToast((s) => s.mostra);
  const [v, setV] = useState({ clienteId: ctx.clienteId ?? "", lavoroId: ctx.lavoroId ?? "", importoAtteso: "", dataScadenza: "", note: "" });
  const lavoriCliente = db.lavori.filter((l) => l.clienteId === v.clienteId).sort((a, b) => b.data.localeCompare(a.data));
  function salva(e: React.FormEvent) {
    e.preventDefault();
    const importo = num(v.importoAtteso);
    if (!v.clienteId || importo === null || importo <= 0) return mostra("Cliente e importo richiesti.", "error");
    crea({ clienteId: v.clienteId, lavoroId: v.lavoroId || null, importoAtteso: importo, dataScadenza: v.dataScadenza || null, note: v.note || null });
    festaDoppia("entrata"); mostra("Incasso atteso 💶"); chiudi();
  }
  const scena = (
    <ScenaCard className="text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white/15"><Banknote size={26} /></div>
      <div className="mt-2 text-[0.7rem] font-bold uppercase tracking-wide text-white/75">In entrata</div>
      <div className="mt-1 font-display text-[2rem] font-bold leading-none">{euro(num(v.importoAtteso) ?? 0)}</div>
      {v.clienteId && <div className="mt-1 truncate text-[0.74rem] text-white/80">da {nomeCli(db, v.clienteId)}</div>}
    </ScenaCard>
  );
  return (
    <Sheet aperto={aperto} onClose={chiudi} titolo="Incasso atteso" sottotitolo="Un pagamento da segnare" accent={ENTITA.entrata.grad} pattern="dots" icona={<Banknote size={20} />} motivo={<Banknote size={120} strokeWidth={1.1} />} scena={scena}>
      <form onSubmit={salva}>
        <SheetStagger className="grid gap-3">
          <SheetRow><div><Etichetta>Cliente</Etichetta><Select value={v.clienteId} onChange={(val) => setV((s) => ({ ...s, clienteId: val, lavoroId: "" }))} options={db.clienti.map((c) => ({ value: c.id, label: `${c.nome} ${c.cognome}` }))} /></div></SheetRow>
          {v.clienteId && lavoriCliente.length > 0 && (
            <SheetRow><div><Etichetta>Per quale lavoro (facoltativo)</Etichetta>
              <Select value={v.lavoroId} onChange={(val) => setV((s) => ({ ...s, lavoroId: val }))} placeholder="— nessun lavoro —"
                options={[{ value: "", label: "— nessun lavoro —" }, ...lavoriCliente.map((l) => ({ value: l.id, label: `${new Date(l.data).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" })} · ${l.titolo}` }))]} />
            </div></SheetRow>
          )}
          <SheetRow><div><Etichetta>Importo atteso</Etichetta><AmountPad tinta="entrata" value={v.importoAtteso} onChange={(val) => setV((s) => ({ ...s, importoAtteso: val }))} suggerimenti={[{ label: "100", valore: 100 }, { label: "200", valore: 200 }, { label: "500", valore: 500 }]} /></div></SheetRow>
          <SheetRow><div><Etichetta>Scadenza</Etichetta><QuickDate tinta="entrata" value={v.dataScadenza} onChange={(dd) => setV((s) => ({ ...s, dataScadenza: dd }))} /></div></SheetRow>
          <SheetRow><CampoIcona icona={<StickyNote size={17} />} label="Note" value={v.note} onChange={(e) => setV((s) => ({ ...s, note: e.target.value }))} /></SheetRow>
          <SheetRow><SheetFooter><Button type="button" onClick={chiudi}>Annulla</Button><Button variante="primary" type="submit"><Save size={16} /> Crea</Button></SheetFooter></SheetRow>
        </SheetStagger>
      </form>
    </Sheet>
  );
}

/* ============================ RISCUOTI ============================ */
function RiscuotiSheet() { const { aperto, ctx, seq, chiudi } = useSheet("riscuoti"); return <RiscuotiForm key={seq} aperto={aperto} ctx={ctx} chiudi={chiudi} />; }
function RiscuotiForm({ aperto, ctx, chiudi }: { aperto: boolean; ctx: SheetCtx; chiudi: () => void }) {
  const db = useStore((s) => s.db);
  const registra = useStore((s) => s.registraIncasso);
  const mostra = useToast((s) => s.mostra);
  const pag = ctx.pagamentoId ? db.pagamenti.find((p) => p.id === ctx.pagamentoId) : undefined;
  const atteso = pag?.importoAtteso ?? 0;
  const gia = pag?.importoIncassato ?? 0;
  const residuo = Math.max(0, Math.round((atteso - gia) * 100) / 100);
  const [v, setV] = useState({ importo: residuo > 0 ? String(residuo) : "", data: oggiISO() });
  const ric = num(v.importo) ?? 0;
  const rimane = Math.max(0, Math.round((residuo - ric) * 100) / 100);
  const cliente = pag ? nomeCli(db, pag.clienteId) : "";

  function salva(e: React.FormEvent) {
    e.preventDefault();
    if (!pag) return chiudi();
    const imp = num(v.importo);
    if (imp === null || imp <= 0) return mostra("Indica l'importo ricevuto.", "error");
    if (imp > residuo + 0.005) return mostra(`Non puoi incassare più del residuo (${euro(residuo)}).`, "error");
    registra(pag.id, imp, v.data);
    festaDoppia("entrata");
    mostra(rimane > 0 ? `Incassato ${euro(imp)} · rimane ${euro(rimane)}` : "Saldato per intero ✓");
    chiudi();
  }
  const scena = (
    <ScenaCard className="text-center">
      <div className="text-[0.66rem] font-bold uppercase tracking-wide text-white/70">Riscuoti da</div>
      <div className="truncate text-[0.95rem] font-semibold">{cliente || "—"}</div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white transition-all" style={{ width: `${atteso > 0 ? Math.min(100, ((gia + ric) / atteso) * 100) : 0}%` }} /></div>
      <div className="mt-2 text-[0.7rem] uppercase tracking-wide text-white/70">Rimane dopo l'incasso</div>
      <div className="font-display text-[1.8rem] font-bold leading-none">{euro(rimane)}</div>
    </ScenaCard>
  );

  return (
    <Sheet aperto={aperto} onClose={chiudi} titolo="Registra incasso" sottotitolo="Quanto hai ricevuto?" accent={ENTITA.entrata.grad} pattern="dots" icona={<Banknote size={20} />} motivo={<Banknote size={120} strokeWidth={1.1} />} scena={scena}>
      {pag ? (
        <form onSubmit={salva}>
          <SheetStagger className="grid gap-3">
            <SheetRow>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-[12px] border border-line bg-surface p-2.5 text-center"><div className="text-[0.6rem] font-bold uppercase tracking-wide text-muted">Atteso</div><div className="font-display text-[0.95rem] font-bold text-ink">{euro(atteso)}</div></div>
                <div className="rounded-[12px] border border-line bg-surface p-2.5 text-center"><div className="text-[0.6rem] font-bold uppercase tracking-wide text-muted">Già preso</div><div className="font-display text-[0.95rem] font-bold text-entrata-600">{euro(gia)}</div></div>
                <div className="rounded-[12px] border border-line bg-surface p-2.5 text-center"><div className="text-[0.6rem] font-bold uppercase tracking-wide text-muted">Residuo</div><div className="font-display text-[0.95rem] font-bold text-uscita-600">{euro(residuo)}</div></div>
              </div>
            </SheetRow>
            <SheetRow><div><Etichetta>Importo ricevuto</Etichetta><AmountPad tinta="entrata" value={v.importo} onChange={(val) => setV((s) => ({ ...s, importo: val }))} suggerimenti={residuo > 0 ? [{ label: "Metà", valore: Math.round((residuo / 2) * 100) / 100 }, { label: `Tutto · ${euro(residuo)}`, valore: residuo }] : []} /></div></SheetRow>
            <SheetRow><CampoIcona icona={<CalendarDays size={17} />} label="Data incasso" type="date" value={v.data} onChange={(e) => setV((s) => ({ ...s, data: e.target.value }))} /></SheetRow>
            <SheetRow><SheetFooter><Button type="button" onClick={chiudi}>Annulla</Button><Button variante="primary" type="submit"><Save size={16} /> Registra incasso</Button></SheetFooter></SheetRow>
          </SheetStagger>
        </form>
      ) : (
        <p className="py-6 text-center text-sm text-muted">Pagamento non trovato.</p>
      )}
    </Sheet>
  );
}

/* ============================ COMPENSO ============================ */
const METODO_TILE: Tile[] = [
  { value: "contanti", label: "Contanti", icona: <Banknote size={18} /> },
  { value: "bonifico", label: "Bonifico", icona: <Landmark size={18} /> },
  { value: "altro", label: "Altro", icona: <Wallet size={18} /> },
];
function CompensoSheet() { const { aperto, ctx, seq, chiudi } = useSheet("compenso"); return <CompensoForm key={seq} aperto={aperto} ctx={ctx} chiudi={chiudi} />; }
function CompensoForm({ aperto, ctx, chiudi }: { aperto: boolean; ctx: SheetCtx; chiudi: () => void }) {
  const db = useStore((s) => s.db);
  const paga = useStore((s) => s.pagaOperatore);
  const mostra = useToast((s) => s.mostra);
  const saldoIniz = useMemo(() => (ctx.operatoreId ? libroOperatore(db, ctx.operatoreId).saldo : 0), [db, ctx.operatoreId]);
  const [v, setV] = useState({ operatoreId: ctx.operatoreId ?? "", importo: ctx.operatoreId && saldoIniz > 0 ? String(saldoIniz) : "", data: oggiISO(), metodo: "contanti" as MetodoPagamento, note: "" });
  const saldo = v.operatoreId ? libroOperatore(db, v.operatoreId).saldo : 0;
  const importo = num(v.importo) ?? 0;
  const ratio = saldo > 0 ? Math.min(1, importo / saldo) : 0;
  const opName = db.operatori.find((o) => o.id === v.operatoreId)?.nome ?? "";
  function salva(e: React.FormEvent) {
    e.preventDefault();
    const imp = num(v.importo);
    if (!v.operatoreId || imp === null || imp <= 0) return mostra("Operatore e importo richiesti.", "error");
    if (saldo <= 0) return mostra("Questo operatore non ha compensi da pagare.", "error");
    if (imp > saldo + 0.005) return mostra(`Non puoi pagare più del dovuto (${euro(saldo)}).`, "error");
    paga({ operatoreId: v.operatoreId, importo: imp, data: v.data, metodo: v.metodo, note: v.note || null });
    festaDoppia("uscita"); mostra("Compenso pagato 🤝"); chiudi();
  }
  const scena = (
    <ScenaCard>
      {v.operatoreId ? (
        <>
          <div className="flex items-center gap-2"><AvatarBianco nome={opName} size="lg" /><div className="min-w-0"><div className="truncate text-[0.82rem] font-semibold">{opName}</div><div className="text-[0.68rem] text-white/75">saldo {euro(saldo)}</div></div></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white transition-all" style={{ width: `${ratio * 100}%` }} /></div>
          <div className="mt-1.5 text-center font-display text-[1.5rem] font-bold leading-none">{euro(importo)}</div>
        </>
      ) : (
        <div className="text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white/15"><HandCoins size={26} /></div><div className="mt-2 text-[0.78rem] text-white/80">Scegli un operatore</div></div>
      )}
    </ScenaCard>
  );
  return (
    <Sheet aperto={aperto} onClose={chiudi} titolo="Paga operatore" sottotitolo="Salda le ore della squadra" accent={ENTITA.uscita.grad} pattern="rings" icona={<HandCoins size={20} />} motivo={<HandCoins size={120} strokeWidth={1.1} />} scena={scena}>
      <form onSubmit={salva}>
        <SheetStagger className="grid gap-3">
          <SheetRow><div><Etichetta>Operatore</Etichetta><ChipPicker tinta="operatore" items={operatoriChip(db)} value={v.operatoreId} onChange={(id) => setV((s) => ({ ...s, operatoreId: id, importo: libroOperatore(db, id).saldo > 0 ? String(libroOperatore(db, id).saldo) : "" }))} vuoto="Nessun operatore." /></div></SheetRow>
          {v.operatoreId && saldo > 0 && (
            <SheetRow><div className="flex items-center justify-between rounded-[14px] border border-uscita-100 bg-uscita-50 px-4 py-2.5"><span className="text-[0.8rem] text-uscita-600">Saldo da pagare <b>{euro(saldo)}</b></span><Button type="button" dim="sm" variante="soft" onClick={() => setV((s) => ({ ...s, importo: String(saldo) }))}>Salda tutto</Button></div></SheetRow>
          )}
          <SheetRow><div><Etichetta>Importo</Etichetta><AmountPad tinta="uscita" value={v.importo} onChange={(val) => setV((s) => ({ ...s, importo: val }))} suggerimenti={saldo > 0 ? [{ label: "Tutto", valore: saldo }] : []} /></div></SheetRow>
          <SheetRow><div><Etichetta>Metodo</Etichetta><TileSelect tinta="uscita" cols={3} value={v.metodo} onChange={(val) => setV((s) => ({ ...s, metodo: val as MetodoPagamento }))} options={METODO_TILE} /></div></SheetRow>
          <SheetRow><Sezione icona={<CalendarDays size={15} />} titolo="Dettagli">
            <CampoIcona icona={<CalendarDays size={17} />} label="Data" type="date" value={v.data} onChange={(e) => setV((s) => ({ ...s, data: e.target.value }))} />
            <CampoIcona icona={<StickyNote size={17} />} label="Note" value={v.note} onChange={(e) => setV((s) => ({ ...s, note: e.target.value }))} />
          </Sezione></SheetRow>
          <SheetRow><SheetFooter><Button type="button" onClick={chiudi}>Annulla</Button><Button variante="primary" type="submit"><Save size={16} /> Registra</Button></SheetFooter></SheetRow>
        </SheetStagger>
      </form>
    </Sheet>
  );
}

/* ============================ ATTREZZO ============================ */
const ATTREZZO_TILE: Tile[] = [
  { value: "ok", label: "In uso", icona: <Wrench size={18} /> },
  { value: "manutenzione", label: "Manutenz.", icona: <Wrench size={18} /> },
  { value: "dismesso", label: "Dismesso", icona: <Tag size={18} /> },
];
function AttrezzoSheet() { const { aperto, ctx, seq, chiudi } = useSheet("attrezzo"); return <AttrezzoForm key={seq} aperto={aperto} ctx={ctx} chiudi={chiudi} />; }
function AttrezzoForm({ aperto, ctx, chiudi }: { aperto: boolean; ctx: SheetCtx; chiudi: () => void }) {
  const db = useStore((s) => s.db);
  const crea = useStore((s) => s.creaAttrezzo);
  const aggiorna = useStore((s) => s.aggiornaAttrezzo);
  const mostra = useToast((s) => s.mostra);
  const esistente = ctx.id ? db.attrezzi.find((a) => a.id === ctx.id) : undefined;
  const [v, setV] = useState({ nome: esistente?.nome ?? "", costoAcquisto: esistente?.costoAcquisto != null ? String(esistente.costoAcquisto) : "", dataAcquisto: esistente?.dataAcquisto ?? "", stato: (esistente?.stato ?? "ok") as StatoAttrezzo });
  function salva(e: React.FormEvent) {
    e.preventDefault();
    if (!v.nome.trim()) return mostra("Il nome è obbligatorio.", "error");
    const dati = { nome: v.nome.trim(), costoAcquisto: num(v.costoAcquisto), dataAcquisto: v.dataAcquisto || null, stato: v.stato };
    if (esistente) { aggiorna(esistente.id, dati); mostra("Attrezzo aggiornato!"); } else { crea(dati); festa("patrimonio"); mostra("Attrezzo aggiunto 🔧"); }
    chiudi();
  }
  const scena = (
    <ScenaCard className="text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-[16px] bg-white/15"><Wrench size={36} /></div>
      <div className="mt-2 truncate text-[0.85rem] font-semibold">{v.nome || "Nuovo attrezzo"}</div>
      <div className="mt-1 font-display text-[1.6rem] font-bold leading-none">{euro(num(v.costoAcquisto) ?? 0)}</div>
      <div className="mt-1 text-[0.7rem] text-white/75">{etichetta(v.stato)}</div>
    </ScenaCard>
  );
  return (
    <Sheet aperto={aperto} onClose={chiudi} titolo={esistente ? "Modifica attrezzo" : "Nuovo attrezzo"} sottotitolo={esistente ? undefined : "Aggiungi al patrimonio"} accent={ENTITA.patrimonio.grad} pattern="grid" icona={<Wrench size={20} />} motivo={<Wrench size={120} strokeWidth={1.1} />} scena={scena}>
      <form onSubmit={salva}>
        <SheetStagger className="grid gap-3">
          <SheetRow><CampoIcona icona={<Wrench size={17} />} label="Nome *" value={v.nome} onChange={(e) => setV((s) => ({ ...s, nome: e.target.value }))} placeholder="es. Motosega Stihl" autoFocus /></SheetRow>
          <SheetRow><div><Etichetta>Costo d'acquisto</Etichetta><AmountPad tinta="patrimonio" value={v.costoAcquisto} onChange={(val) => setV((s) => ({ ...s, costoAcquisto: val }))} suggerimenti={[{ label: "150", valore: 150 }, { label: "300", valore: 300 }, { label: "600", valore: 600 }]} /></div></SheetRow>
          <SheetRow><CampoIcona icona={<CalendarDays size={17} />} label="Data acquisto" type="date" value={v.dataAcquisto} onChange={(e) => setV((s) => ({ ...s, dataAcquisto: e.target.value }))} /></SheetRow>
          <SheetRow><div><Etichetta>Stato</Etichetta><TileSelect tinta="patrimonio" cols={3} value={v.stato} onChange={(val) => setV((s) => ({ ...s, stato: val as StatoAttrezzo }))} options={ATTREZZO_TILE} /></div></SheetRow>
          <SheetRow><SheetFooter><Button type="button" onClick={chiudi}>Annulla</Button><Button variante="primary" type="submit"><Save size={16} /> {esistente ? "Salva" : "Aggiungi"}</Button></SheetFooter></SheetRow>
        </SheetStagger>
      </form>
    </Sheet>
  );
}

/* ============================== HOST ============================== */
export function SheetHost() {
  return (
    <>
      <CreaMenu /><ClienteSheet /><OperatoreSheet /><LavoroSheet /><PreventivoSheet />
      <OreSheet /><SpesaSheet /><IncassoSheet /><RiscuotiSheet /><CompensoSheet /><AttrezzoSheet />
    </>
  );
}
