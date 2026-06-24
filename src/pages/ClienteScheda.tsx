import { ArrowLeft, Mail, MapPin, Pencil, Phone, Plus, Trash2, Undo2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CardLavoro } from "@/components/CardLavoro";
import { Avatar, AvatarStorico, Button, Codice, Conferma, Field, Foglio, Segmented, StatePill, StatTile } from "@/components/ui";
import { codiceCliente, leggiCodice } from "@/lib/codice-parlante";
import { haRelazioni, riepilogoCliente, squadraDelCliente } from "@/lib/conti";
import { chiaveMese, formatEuro, formatMese, formatOre, oggiISO } from "@/lib/format";
import { calcoloLavoro } from "@/lib/lavoro-calc";
import type { Cliente } from "@/lib/types";
import { notificaUndo } from "@/lib/undo";
import { eliminaCliente } from "@/store/azioni";
import { useStore } from "@/store/store";

type Filtro = "tutto" | "incassare" | "fare";
const STORICO_SOGLIA = 2;

export function ClienteScheda() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const dati = useStore((s) => s.dati);
  const salva = useStore((s) => s.salva);
  const [filtro, setFiltro] = useState<Filtro>("tutto");
  const [dettagli, setDettagli] = useState(false);
  const [modifica, setModifica] = useState(false);
  const [elimina, setElimina] = useState(false);

  const cliente = dati.clienti.find((c) => c.id === id);
  const lavori = useMemo(
    () => dati.lavori.filter((l) => !l.deleted && l.clienteId === id).sort((a, b) => b.data.localeCompare(a.data)),
    [dati.lavori, id],
  );

  if (!cliente) {
    return (
      <div className="px-5 pt-6">
        <button type="button" onClick={() => navigate(-1)} className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-superficie text-fumo"><ArrowLeft size={18} /></button>
        <p className="text-sm text-fumo-2">Cliente non trovato.</p>
      </div>
    );
  }

  const codice = codiceCliente(dati, cliente.id);
  const decode = leggiCodice(codice);
  const r = riepilogoCliente(dati, cliente.id);
  const storico = r.numeroLavori >= STORICO_SOGLIA;
  const iniz = `${cliente.nome[0] ?? ""}${cliente.cognome?.[0] ?? ""}`.toUpperCase() || "?";

  const daIncassare = lavori.filter((l) => l.fase === "fatto" && calcoloLavoro(dati, l).statoIncasso !== "pagato");
  const daFare = lavori.filter((l) => l.fase === "da_fare");
  const visibili = filtro === "incassare" ? daIncassare : filtro === "fare" ? daFare : lavori;

  const perMese = new Map<string, { fatto: number; daFare: number }>();
  for (const l of lavori) {
    const k = chiaveMese(l.data);
    const v = perMese.get(k) ?? { fatto: 0, daFare: 0 };
    if (l.fase === "fatto") v.fatto++;
    else v.daFare++;
    perMese.set(k, v);
  }
  const mesi = [...perMese.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6);
  const prossimo = daFare.filter((l) => l.data >= oggiISO()).sort((a, b) => a.data.localeCompare(b.data))[0];
  const squadra = squadraDelCliente(dati, cliente.id);
  const archivia = haRelazioni(dati, "cliente", cliente.id);

  return (
    <div className="flex flex-col pb-24">
      <header className="flex flex-col items-center gap-3 px-5 pt-5 text-center">
        <div className="flex w-full items-center justify-between">
          <button type="button" onClick={() => navigate(-1)} aria-label="Indietro" className="flex h-9 w-9 items-center justify-center rounded-full bg-superficie text-fumo shadow-card hover:text-bianco"><ArrowLeft size={18} /></button>
          <div className="flex items-center gap-2">
            {storico && <StatePill stato="storico" />}
            <button type="button" onClick={() => setModifica(true)} aria-label="Modifica cliente" className="flex h-9 w-9 items-center justify-center rounded-full bg-superficie text-fumo shadow-card hover:text-bianco"><Pencil size={16} /></button>
            {cliente.deleted ? (
              <button type="button" onClick={() => void salva("clienti", { ...cliente, deleted: false })} aria-label="Ripristina cliente" className="flex h-9 w-9 items-center justify-center rounded-full bg-superficie text-verde shadow-card"><Undo2 size={16} /></button>
            ) : (
              <button type="button" onClick={() => setElimina(true)} aria-label={archivia ? "Archivia cliente" : "Elimina cliente"} className="flex h-9 w-9 items-center justify-center rounded-full bg-superficie text-rosso shadow-card"><Trash2 size={16} /></button>
            )}
          </div>
        </div>
        {storico ? <AvatarStorico iniziali={iniz} size={72} /> : <Avatar iniziali={iniz} tono={r.saldoDaIncassare > 0 ? "rosso" : "neutro"} size={72} />}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{cliente.nome} {cliente.cognome ?? ""}</h1>
          {cliente.luogo && <p className="text-sm text-fumo">{cliente.luogo}</p>}
        </div>
        <Codice value={codice} grande copiabile />
        {decode && r.numeroLavori > 0 && (
          <p className="font-mono text-[11px] text-fumo-2">paga in ~{decode.giorniMedi} gg · ~{formatEuro(decode.spesaMedia)}/lavoro · {decode.anni} anni</p>
        )}
        {(cliente.telefono || cliente.email) && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {cliente.telefono && <a href={`tel:${cliente.telefono}`} className="flex items-center gap-1.5 rounded-pill bg-superficie px-3 py-1.5 text-xs text-fumo"><Phone size={13} /> {cliente.telefono}</a>}
            {cliente.email && <a href={`mailto:${cliente.email}`} className="flex items-center gap-1.5 rounded-pill bg-superficie px-3 py-1.5 text-xs text-fumo"><Mail size={13} /> email</a>}
            {cliente.luogo && <span className="flex items-center gap-1.5 rounded-pill bg-superficie px-3 py-1.5 text-xs text-fumo"><MapPin size={13} /> {cliente.luogo}</span>}
          </div>
        )}
      </header>

      <div className="flex flex-col gap-5 px-5 pt-6">
        <div className="grid grid-cols-2 gap-2">
          <StatTile etichetta="Da incassare" tono={r.saldoDaIncassare > 0 ? "rosso" : "neutro"} onClick={() => setFiltro("incassare")}>{formatEuro(r.saldoDaIncassare)}</StatTile>
          <StatTile etichetta="Incassato" tono="verde">{formatEuro(r.totaleIncassato)}</StatTile>
          <StatTile etichetta="Lavori" onClick={() => setFiltro("tutto")}>{String(r.numeroLavori)}</StatTile>
          <StatTile etichetta="Ore">{formatOre(r.oreTotali)}</StatTile>
        </div>

        <button type="button" onClick={() => setDettagli((v) => !v)} className="self-start font-mono text-[11px] uppercase tracking-label text-blu">
          {dettagli ? "− dettagli" : "+ dettagli economici"}
        </button>
        {dettagli && (
          <div className="grid grid-cols-2 gap-2">
            <StatTile etichetta="Margine">{formatEuro(r.margine)}</StatTile>
            <StatTile etichetta="Fatturabile">{formatEuro(r.valoreFatturabile)}</StatTile>
            <StatTile etichetta="Manodopera">{formatEuro(r.costoManodopera)}</StatTile>
            <StatTile etichetta="Spese">{formatEuro(r.spese)}</StatTile>
          </div>
        )}

        {mesi.length > 0 && (
          <div className="flex flex-col gap-1.5 rounded-vetro bg-superficie p-4">
            <span className="font-mono text-[11px] uppercase tracking-label text-fumo-2">Lavori nel tempo</span>
            {mesi.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-sm">
                <span className="font-mono text-xs uppercase text-fumo">{formatMese(k)}</span>
                <span className="font-mono text-xs text-verde">{"●".repeat(v.fatto)}<span className="text-fumo-2">{"◌".repeat(v.daFare)}</span></span>
              </div>
            ))}
            {prossimo && <p className="mt-1 border-t border-bordo pt-1.5 font-mono text-xs text-blu">prossimo: ◌ {prossimo.titolo}</p>}
          </div>
        )}

        {squadra.length > 0 && (
          <div className="flex flex-col gap-1.5 rounded-vetro bg-superficie p-4">
            <span className="font-mono text-[11px] uppercase tracking-label text-fumo-2">Squadra coinvolta</span>
            {squadra.map((s) => (
              <button key={s.operatoreId} type="button" onClick={() => navigate(`/operaio/${s.operatoreId}`)} className="flex items-center justify-between text-sm transition-transform active:scale-[0.99]">
                <span className="font-medium">{s.nome}</span>
                <span className="font-mono text-xs text-fumo-2">{formatOre(s.ore)}</span>
              </button>
            ))}
          </div>
        )}

        <Segmented
          value={filtro}
          onValueChange={setFiltro}
          options={[
            { value: "tutto", label: "Tutto" },
            { value: "incassare", label: "Da incassare" },
            { value: "fare", label: "Da fare" },
          ]}
          layoutId="filtro-cliente"
        />

        <div className="flex flex-col gap-2.5">
          {visibili.length === 0 ? (
            <p className="py-6 text-center text-sm text-fumo-2">{filtro === "incassare" ? "Niente da incassare." : filtro === "fare" ? "Nessun lavoro in programma." : "Ancora nessun lavoro."}</p>
          ) : (
            visibili.map((l) => <CardLavoro key={l.id} lavoro={l} />)
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30">
        <div className="mx-auto flex max-w-md px-4">
          <Button size="lg" className="w-full shadow-flottante" onClick={() => navigate("/nuovo", { state: { clienteId: cliente.id } })}>
            <Plus size={18} /> Nuovo lavoro per {cliente.nome}
          </Button>
        </div>
      </div>

      <ModificaClienteSheet key={cliente.id} open={modifica} onOpenChange={setModifica} cliente={cliente} />
      <Conferma
        open={elimina}
        onOpenChange={setElimina}
        titolo={archivia ? "Archiviare il cliente?" : "Eliminare il cliente?"}
        testo={archivia ? "Ha lavori collegati: resta nei conti e si ripristina dal Cestino." : "Si può annullare subito dopo."}
        etichettaConferma={archivia ? "Archivia" : "Elimina cliente"}
        onConferma={() => void (async () => { const a = await eliminaCliente(cliente.id); notificaUndo(archivia ? "Cliente archiviato" : "Cliente eliminato", a); navigate(-1); })()}
      />
    </div>
  );
}

function ModificaClienteSheet({ open, onOpenChange, cliente }: { open: boolean; onOpenChange: (o: boolean) => void; cliente: Cliente }) {
  const salva = useStore((s) => s.salva);
  const [form, setForm] = useState(() => ({
    nome: cliente.nome,
    cognome: cliente.cognome ?? "",
    tariffa: cliente.tariffaOraria != null ? String(cliente.tariffaOraria) : "",
    luogo: cliente.luogo ?? "",
    telefono: cliente.telefono ?? "",
    email: cliente.email ?? "",
  }));
  const set = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }));
  const salvaMod = async () => {
    await salva("clienti", {
      ...cliente,
      nome: form.nome.trim() || cliente.nome,
      cognome: form.cognome.trim() || undefined,
      tariffaOraria: form.tariffa ? Number(form.tariffa.replace(",", ".")) : null,
      luogo: form.luogo.trim() || undefined,
      telefono: form.telefono.trim() || undefined,
      email: form.email.trim() || undefined,
      updatedAt: "",
    });
    onOpenChange(false);
  };
  return (
    <Foglio open={open} onOpenChange={onOpenChange} variante="dettaglio" titolo="Modifica cliente">
      <div className="flex flex-col gap-3">
        <Field label="Nome" value={form.nome} onChange={(e) => set({ nome: e.target.value })} />
        <Field label="Cognome" value={form.cognome} onChange={(e) => set({ cognome: e.target.value })} />
        <Field label="Tariffa oraria" value={form.tariffa} onChange={(e) => set({ tariffa: e.target.value })} suffix="€/h" inputMode="decimal" />
        <Field label="Luogo" value={form.luogo} onChange={(e) => set({ luogo: e.target.value })} />
        <Field label="Telefono" value={form.telefono} onChange={(e) => set({ telefono: e.target.value })} inputMode="tel" />
        <Field label="Email" value={form.email} onChange={(e) => set({ email: e.target.value })} inputMode="email" />
        <Button size="lg" onClick={() => void salvaMod()}>Salva modifiche</Button>
      </div>
    </Foglio>
  );
}
