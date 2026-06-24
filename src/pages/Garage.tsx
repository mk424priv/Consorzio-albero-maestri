import { Car, Cog, Plus, Trash2, Wrench, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { Modello3D } from "@/components/garage/Modello3D";
import { Oggetto3D } from "@/components/garage/Oggetto3D";
import { OggettoIso } from "@/components/garage/OggettoIso";
import { Button, Conferma, Cruscotto, EmptyState, Foglio, NumberHero, SectionHeader, Segmented, StatTile } from "@/components/ui";
import { haModello } from "@/lib/catalogo-modelli";
import { arrotonda, formatEuro, oggiISO } from "@/lib/format";
import { risolviModelKey } from "@/lib/gemini-classifica";
import { nuovoId } from "@/lib/id";
import { risolviModelloLocale } from "@/lib/modelli-3d";
import type { Attrezzo, CategoriaAttrezzo } from "@/lib/types";
import { notificaUndo } from "@/lib/undo";
import { eliminaAttrezzo } from "@/store/azioni";
import { useStore } from "@/store/store";

const CATEGORIE: { value: CategoriaAttrezzo; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "motore", label: "Motore" },
  { value: "elettrico", label: "Elettrici" },
  { value: "manuale", label: "Manuali" },
];
const ETICHETTA: Record<CategoriaAttrezzo, string> = { auto: "Parco auto", motore: "Attrezzi a motore", elettrico: "Attrezzi elettrici", manuale: "Attrezzi manuali" };
const ICONA = { auto: Car, motore: Cog, elettrico: Zap, manuale: Wrench };

const inputCls = "h-11 w-full rounded-btn bg-superficie-bassa px-3 font-sans text-sm text-bianco placeholder-fumo-2 focus:bg-superficie focus:outline-none";

export function Garage() {
  const dati = useStore((s) => s.dati);
  const [cat, setCat] = useState<CategoriaAttrezzo>("auto");
  const [aggiungi, setAggiungi] = useState(false);
  const [edit, setEdit] = useState<Attrezzo | null>(null);

  const attrezzi = dati.attrezzi.filter((a) => !a.deleted);
  const dellaCat = attrezzi.filter((a) => a.categoria === cat);
  const valoreTot = attrezzi.reduce((s, a) => s + (a.prezzo ?? 0), 0);
  const Icona = ICONA[cat];

  return (
    <div className="flex flex-col pb-28">
      <Cruscotto titolo="Garage" mesh="brand">
        <Segmented value={cat} onValueChange={setCat} options={CATEGORIE} layoutId="garage-cat" className="w-full" />
        <div className="mt-5 flex flex-col items-center">
          <span className="font-mono text-[11px] uppercase tracking-label text-fumo">Valore del parco</span>
          <NumberHero value={valoreTot} euro tono="bianco" className="text-[40px]" />
          <span className="mt-1 font-mono text-xs text-fumo">{attrezzi.length} attrezzi</span>
        </div>
      </Cruscotto>

      <div className="flex flex-col gap-5 px-4 pt-5">
        {dellaCat.length > 0 && (
          <div className="relative h-44 overflow-hidden rounded-bolla bg-superficie shadow-card">
            <Oggetto3D categoria={cat} className="absolute inset-0 h-full w-full" />
            <div className="absolute bottom-4 left-5">
              <span className="font-mono text-[11px] uppercase tracking-label text-fumo-2">{ETICHETTA[cat]}</span>
              <p className="text-lg font-bold">{dellaCat.length} {dellaCat.length === 1 ? "oggetto" : "oggetti"}</p>
            </div>
          </div>
        )}

        {cat === "auto" && dellaCat.length > 0 && <CalcolatorePercorso veicoli={dellaCat} />}

        <section className="flex flex-col gap-2.5">
          <SectionHeader
            titolo={ETICHETTA[cat]}
            conteggio={dellaCat.length}
            azione={
              <button type="button" onClick={() => setAggiungi(true)} className="flex items-center gap-1 text-sm font-medium text-blu">
                <Plus size={16} /> Aggiungi
              </button>
            }
          />
          {dellaCat.length === 0 ? (
            <EmptyState icon={Icona} titolo={`Nessun attrezzo in «${ETICHETTA[cat]}»`} testo="Aggiungilo: lo vedrai nel tuo garage 3D." azione={<Button onClick={() => setAggiungi(true)}>＋ Aggiungi attrezzo</Button>} />
          ) : (
            dellaCat.map((a) => <OggettoIso key={a.id} attrezzo={a} onClick={() => setEdit(a)} />)
          )}
        </section>
      </div>

      <AttrezzoSheet
        key={edit?.id ?? "nuovo"}
        open={aggiungi || !!edit}
        onOpenChange={(o) => { if (!o) { setAggiungi(false); setEdit(null); } }}
        categoriaDefault={cat}
        attrezzo={edit}
      />
    </div>
  );
}

function CalcolatorePercorso({ veicoli }: { veicoli: Attrezzo[] }) {
  const dati = useStore((s) => s.dati);
  const salva = useStore((s) => s.salva);
  const elimina = useStore((s) => s.elimina);
  const [selId, setSelId] = useState(veicoli[0]?.id ?? "");
  const [km, setKm] = useState("");
  const [lavoroId, setLavoroId] = useState("");
  const v = veicoli.find((x) => x.id === selId) ?? veicoli[0];
  const distanza = Number(km.replace(",", ".")) || 0;
  const consumo = v?.consumoMedio ?? 0;
  const litri = arrotonda((distanza * consumo) / 100);
  const costo = arrotonda(litri * (v?.prezzoCarburante ?? 0));
  const euroKm = arrotonda((consumo / 100) * (v?.prezzoCarburante ?? 0));
  const spesoTot = arrotonda(dati.spese.filter((s) => !s.deleted && s.attrezzoId === v?.id).reduce((a, s) => a + s.importo, 0));
  const lavoriRecenti = dati.lavori.filter((l) => !l.deleted).sort((a, b) => b.data.localeCompare(a.data)).slice(0, 20);

  const salvaSpesa = async () => {
    if (!(costo > 0) || !lavoroId || !v) return;
    const l = dati.lavori.find((x) => x.id === lavoroId);
    const id = nuovoId();
    await salva("spese", { id, categoria: "benzina", importo: costo, data: oggiISO(), descrizione: `${v.nome} · ${distanza} km`, attrezzoId: v.id, lavoroId, clienteId: l?.clienteId, creatoIl: oggiISO(), updatedAt: "" });
    notificaUndo(`Spesa benzina ${formatEuro(costo)} aggiunta`, async () => { await elimina("spese", id); });
    setKm("");
  };

  return (
    <div className="flex flex-col gap-3 rounded-bolla bg-superficie p-4 shadow-card">
      <span className="font-mono text-[11px] uppercase tracking-label text-fumo-2">Calcola percorso</span>
      <MappaStilizzata />
      {veicoli.length > 1 && (
        <select value={selId} onChange={(e) => setSelId(e.target.value)} className={inputCls}>
          {veicoli.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
        </select>
      )}
      <div className="flex items-center gap-2">
        <input value={km} onChange={(e) => setKm(e.target.value.replace(/[^0-9.,]/g, ""))} inputMode="decimal" placeholder="distanza" className={inputCls} />
        <span className="font-mono text-sm text-fumo-2">km</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <StatTile etichetta="Carburante">{litri.toFixed(1)} L</StatTile>
        <StatTile etichetta="Costo stimato" tono={costo > 0 ? "rosso" : "neutro"}>{formatEuro(costo)}</StatTile>
      </div>
      {consumo > 0 ? (
        <p className="font-mono text-[11px] text-fumo-2">≈ {formatEuro(euroKm)}/km · speso finora con «{v?.nome}»: <span className="text-bianco">{formatEuro(spesoTot)}</span></p>
      ) : (
        <p className="text-xs text-fumo-2">Imposta il consumo medio del veicolo per stimare il percorso.</p>
      )}
      {costo > 0 && (
        <div className="flex flex-col gap-2 border-t border-black/[0.06] pt-3">
          <span className="font-mono text-[11px] uppercase tracking-label text-fumo-2">Registra come spesa</span>
          <select value={lavoroId} onChange={(e) => setLavoroId(e.target.value)} className={inputCls}>
            <option value="">Scegli il lavoro…</option>
            {lavoriRecenti.map((l) => <option key={l.id} value={l.id}>{l.titolo} · {l.data}</option>)}
          </select>
          <Button onClick={() => void salvaSpesa()} disabled={!lavoroId}>Salva spesa di {formatEuro(costo)}</Button>
        </div>
      )}
    </div>
  );
}

function MappaStilizzata() {
  return (
    <div className="relative h-28 overflow-hidden rounded-vetro" style={{ background: "linear-gradient(180deg, rgba(59,110,245,0.10), var(--color-superficie-bassa))", perspective: 420 }}>
      <div
        className="absolute inset-x-0 bottom-0 top-7"
        style={{
          transform: "rotateX(56deg)",
          transformOrigin: "bottom center",
          backgroundImage: "linear-gradient(rgba(59,110,245,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(59,110,245,0.22) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M14,82 C36,42 64,62 86,20" fill="none" stroke="#3b6ef5" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="14" cy="82" r="3.6" fill="#1bb574" />
        <circle cx="86" cy="20" r="3.6" fill="#ef5b52" />
      </svg>
    </div>
  );
}

function AttrezzoSheet({ open, onOpenChange, categoriaDefault, attrezzo }: { open: boolean; onOpenChange: (o: boolean) => void; categoriaDefault: CategoriaAttrezzo; attrezzo: Attrezzo | null }) {
  const salva = useStore((s) => s.salva);
  const [form, setForm] = useState(() => ({
    categoria: attrezzo?.categoria ?? categoriaDefault,
    nome: attrezzo?.nome ?? "",
    prezzo: attrezzo?.prezzo != null ? String(attrezzo.prezzo) : "",
    dataAcquisto: attrezzo?.dataAcquisto ?? oggiISO(),
    caratteristiche: attrezzo?.caratteristiche ?? "",
    consumoMedio: attrezzo?.consumoMedio != null ? String(attrezzo.consumoMedio) : "",
    carburante: attrezzo?.carburante ?? "",
    prezzoCarburante: attrezzo?.prezzoCarburante != null ? String(attrezzo.prezzoCarburante) : "",
  }));
  const [elimina, setElimina] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const set = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }));
  const num = (s: string) => (s ? Number(s.replace(",", ".")) : undefined);
  const valido = form.nome.trim().length > 0;

  // Anteprima 3D dal vivo: solo matcher locale (sincrono, niente rete) mentre si scrive.
  const anteprimaKey = useMemo(() => {
    const e = risolviModelloLocale(form.nome, form.caratteristiche, form.categoria);
    return e.key && haModello(e.key) ? e.key : null;
  }, [form.nome, form.caratteristiche, form.categoria]);

  const salvaAttrezzo = async () => {
    if (!valido || salvando) return;
    setSalvando(true);
    // Risolve il modelKey una volta al salvataggio (matcher → Gemini se incerto). Vedi canone/10.
    const modelKey = (await risolviModelKey(form.nome.trim(), form.caratteristiche.trim() || undefined, form.categoria)) ?? undefined;
    await salva("attrezzi", {
      id: attrezzo?.id ?? nuovoId(),
      nome: form.nome.trim(),
      categoria: form.categoria,
      prezzo: num(form.prezzo),
      dataAcquisto: form.dataAcquisto || undefined,
      caratteristiche: form.caratteristiche.trim() || undefined,
      note: attrezzo?.note,
      consumoMedio: form.categoria === "auto" ? num(form.consumoMedio) : undefined,
      carburante: form.categoria === "auto" ? form.carburante.trim() || undefined : undefined,
      prezzoCarburante: form.categoria === "auto" ? num(form.prezzoCarburante) : undefined,
      modelKey,
      updatedAt: "",
    });
    setSalvando(false);
    onOpenChange(false);
  };

  return (
    <Foglio open={open} onOpenChange={onOpenChange} variante="dettaglio" titolo={attrezzo ? "Modifica attrezzo" : "Nuovo attrezzo"}>
      <div className="flex flex-col gap-3">
        <div className="relative h-36 overflow-hidden rounded-vetro bg-superficie-bassa">
          {anteprimaKey ? (
            <Modello3D modelKey={anteprimaKey} className="absolute inset-0 h-full w-full" />
          ) : (
            <Oggetto3D categoria={form.categoria} className="absolute inset-0 h-full w-full" />
          )}
        </div>
        <Segmented value={form.categoria} onValueChange={(v) => set({ categoria: v })} options={CATEGORIE} layoutId="attrezzo-cat" className="w-full" />
        <input value={form.nome} onChange={(e) => set({ nome: e.target.value })} placeholder="Nome (es. Decespugliatore Stihl)" className={inputCls} autoFocus />
        <div className="flex gap-2">
          <input value={form.prezzo} onChange={(e) => set({ prezzo: e.target.value.replace(/[^0-9.,]/g, "") })} inputMode="decimal" placeholder="prezzo €" className={inputCls} />
          <input type="date" value={form.dataAcquisto} onChange={(e) => set({ dataAcquisto: e.target.value })} className={inputCls} aria-label="Data acquisto" />
        </div>
        <input value={form.caratteristiche} onChange={(e) => set({ caratteristiche: e.target.value })} placeholder="Caratteristiche (potenza, modello…)" className={inputCls} />

        {form.categoria === "auto" && (
          <div className="flex flex-col gap-2 rounded-vetro bg-superficie-bassa p-3">
            <span className="font-mono text-[11px] uppercase tracking-label text-fumo-2">Veicolo</span>
            <div className="flex gap-2">
              <input value={form.consumoMedio} onChange={(e) => set({ consumoMedio: e.target.value.replace(/[^0-9.,]/g, "") })} inputMode="decimal" placeholder="consumo L/100km" className="h-11 w-full rounded-btn bg-superficie px-3 text-sm text-bianco placeholder-fumo-2 focus:outline-none" />
              <input value={form.prezzoCarburante} onChange={(e) => set({ prezzoCarburante: e.target.value.replace(/[^0-9.,]/g, "") })} inputMode="decimal" placeholder="€/L" className="h-11 w-24 rounded-btn bg-superficie px-3 text-sm text-bianco placeholder-fumo-2 focus:outline-none" />
            </div>
            <input value={form.carburante} onChange={(e) => set({ carburante: e.target.value })} placeholder="carburante (benzina, diesel…)" className="h-11 w-full rounded-btn bg-superficie px-3 text-sm text-bianco placeholder-fumo-2 focus:outline-none" />
          </div>
        )}

        <Button size="lg" onClick={() => void salvaAttrezzo()} disabled={!valido || salvando}>{salvando ? "Riconosco il modello…" : attrezzo ? "Salva modifiche" : "Aggiungi al garage"}</Button>
        {attrezzo && (
          <Button size="lg" variant="critico" onClick={() => setElimina(true)}><Trash2 size={16} /> Elimina</Button>
        )}
      </div>

      {attrezzo && (
        <Conferma
          open={elimina}
          onOpenChange={setElimina}
          titolo="Eliminare l'attrezzo?"
          testo="Si può annullare subito dopo."
          etichettaConferma="Elimina"
          onConferma={() => void (async () => { const a = await eliminaAttrezzo(attrezzo.id); notificaUndo("Attrezzo eliminato", a); onOpenChange(false); })()}
        />
      )}
    </Foglio>
  );
}
