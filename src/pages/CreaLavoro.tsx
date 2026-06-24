import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Intestazione } from "@/components/Intestazione";
import { Badge, Button, CampoFacolt, Card, Codice, Field, Modal, Segmented } from "@/components/ui";
import { assegnaIniziali, codiceCliente } from "@/lib/codice-parlante";
import { cn } from "@/lib/cn";
import { etichetta } from "@/lib/dominio";
import type { CategoriaSpesa, FasciaGiornata, MetodoPagamento, StatoPreventivo } from "@/lib/dominio";
import { formatEuro, oggiISO } from "@/lib/format";
import { nuovoId } from "@/lib/id";
import { operatoreIo } from "@/lib/lavoro-calc";
import {
  lordoBozza,
  oraUscita,
  orePartecipante,
  oreTotaliBozza,
  salvaBozza,
  useBozza,
  type ModoCalc,
} from "@/store/bozza";
import { creaRicorrenze } from "@/store/azioni";
import { useStore } from "@/store/store";

const MODI: { value: ModoCalc; label: string }[] = [
  { value: "preventivo", label: "Preventivo" },
  { value: "ore", label: "Ore" },
  { value: "giornate", label: "Giornate" },
  { value: "totale", label: "Totale" },
];

const CATEGORIE: CategoriaSpesa[] = ["benzina", "materiali", "attrezzi", "altro"];

const FASCE: { value: FasciaGiornata; label: string }[] = [
  { value: "giornata", label: "Giornata" },
  { value: "mattina", label: "Mattina" },
  { value: "pomeriggio", label: "Pomeriggio" },
  { value: "orario", label: "Orario" },
];
const STATI_PREV: { value: StatoPreventivo; label: string }[] = [
  { value: "da_fare", label: "Da fare" },
  { value: "inviato", label: "Inviato" },
  { value: "accettato", label: "Accettato" },
];
const METODI: MetodoPagamento[] = ["contanti", "bonifico", "carta", "assegno", "altro"];

function NumberField({
  iniziale,
  onChange,
  className,
  placeholder,
}: {
  iniziale: number | null;
  onChange: (n: number) => void;
  className?: string;
  placeholder?: string;
}) {
  const [txt, setTxt] = useState(iniziale != null && iniziale !== 0 ? String(iniziale) : "");
  return (
    <input
      value={txt}
      inputMode="decimal"
      placeholder={placeholder}
      onChange={(e) => {
        const t = e.target.value.replace(/[^0-9.,]/g, "");
        setTxt(t);
        const n = Number(t.replace(",", "."));
        onChange(Number.isFinite(n) ? n : 0);
      }}
      className={cn(
        "h-10 rounded-2xl bg-superficie-bassa px-2 text-right font-mono text-sm text-bianco tabular-nums focus-visible:outline-none",
        className,
      )}
    />
  );
}

function Trigger({ label, value, onClick }: { label: string; value: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between gap-2 rounded-2xl bg-superficie px-3 py-3 text-left"
    >
      <span className="font-mono text-xs uppercase tracking-wider text-fumo-2">{label}</span>
      <span className="flex items-center gap-1 text-sm text-bianco">
        {value}
        <ChevronRight className="h-4 w-4 text-fumo-2" />
      </span>
    </button>
  );
}

export function CreaLavoro() {
  const navigate = useNavigate();
  const location = useLocation();
  const dati = useStore((s) => s.dati);
  const b = useBozza((s) => s.b);
  const set = useBozza((s) => s.set);
  const apri = useBozza((s) => s.apri);

  const [vista, setVista] = useState<"form" | "cliente" | "operaio">("form");
  const [tariffaOpen, setTariffaOpen] = useState(false);
  const [tariffaTmp, setTariffaTmp] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [ripeti, setRipeti] = useState<{ periodicita: "settimana" | "mese"; volte: number } | null>(null);

  // init bozza all'apertura di /nuovo (sopravvive ai sotto-pannelli interni)
  useEffect(() => {
    const st = (location.state ?? {}) as { data?: string; clienteId?: string; operatoreId?: string; fase?: "fatto" | "da_fare"; lavoroId?: string; riprendi?: boolean };
    if (!st.riprendi) apri(st); // «riprendi»: mantiene la bozza idratata da localStorage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const io = operatoreIo(dati);
  const cliente = b.clienteId ? dati.clienti.find((c) => c.id === b.clienteId) : undefined;
  const svolto = b.fase === "fatto";
  const lordo = lordoBozza(b);

  const setModo = (m: ModoCalc) => {
    const patch: Partial<typeof b> = { modoCalc: m };
    if (m !== "preventivo" && !b.tariffaModificata) {
      patch.tariffaCliente = cliente?.tariffaOraria ?? b.tariffaCliente ?? null;
    }
    if (m === "preventivo" && b.statoPreventivo == null) {
      patch.statoPreventivo = "da_fare";
    }
    if (m === "giornate" && b.giornate.length === 0) {
      patch.giornate = [{ id: nuovoId(), data: b.data, ore: {} }];
    }
    setErrore(null);
    set(patch);
  };

  const valida = (): string | null => {
    if (!b.modoCalc) return "Scegli una modalità di calcolo";
    if (b.modoCalc === "preventivo") {
      if ((b.prezzo ?? 0) <= 0) return "Inserisci l'importo concordato";
    } else if (svolto && oreTotaliBozza(b) <= 0) {
      return "Inserisci almeno qualche ora";
    }
    if (b.periodo && b.periodo.dal > b.periodo.al) return "La data 'dal' deve precedere 'al'";
    return null;
  };

  const finalizza = async () => {
    const eraModifica = b.id != null;
    const id = await salvaBozza();
    if (ripeti && !eraModifica && b.fase === "da_fare") await creaRicorrenze(id, ripeti.periodicita, ripeti.volte);
    // ritorno coerente: in modifica torno da dove venivo (Cantiere); in creazione apro il lavoro creato.
    if (eraModifica) navigate(-1);
    else navigate(`/lavoro/${id}`);
  };

  const salva = async () => {
    const err = valida();
    if (err) {
      setErrore(err);
      return;
    }
    // modale tariffa: svolto, modo ore, senza cliente e senza tariffa (e non ancora deciso)
    if (svolto && b.modoCalc !== "preventivo" && !b.clienteId && b.tariffaCliente == null && !b.tariffaModificata) {
      setTariffaOpen(true);
      return;
    }
    await finalizza();
  };

  // ── sotto-viste ──
  if (vista === "cliente") {
    return (
      <ScegliCliente
        onIndietro={() => setVista("form")}
        onScelto={(id, tariffa) => {
          const c = dati.clienti.find((x) => x.id === id);
          set({ clienteId: id, tariffaCliente: b.tariffaModificata ? b.tariffaCliente : tariffa, luogo: b.luogo.trim() || c?.luogo || "" });
          setVista("form");
        }}
      />
    );
  }
  if (vista === "operaio") {
    return (
      <ScegliOperaio
        esistenti={b.partecipanti.map((p) => p.collaboratoreId)}
        onIndietro={() => setVista("form")}
        onScelto={(id, tariffa) => {
          set({ partecipanti: [...b.partecipanti, { collaboratoreId: id, tariffaSnapshot: tariffa, ore: 0 }] });
          setVista("form");
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3 px-5 pt-4 pb-3">
      <Intestazione
        titolo={b.id ? "Modifica record" : "Nuovo record"}
        azione={
          <Button size="icona" variant="tenue" onClick={() => navigate(-1)} aria-label="Chiudi">
            <X className="h-5 w-5" />
          </Button>
        }
      />

      {/* carattere */}
      <Segmented
        value={b.fase}
        onValueChange={(f) => set({ fase: f, giaIncassato: "no" })}
        options={[
          { value: "fatto", label: "Svolto" },
          { value: "da_fare", label: "Programmato" },
        ]}
        layoutId="carattere"
      />

      {/* spina */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-xs uppercase tracking-wider text-fumo-2">Data</label>
          <input
            type="date"
            value={b.data}
            onChange={(e) => set({ data: e.target.value || oggiISO() })}
            className="h-10 rounded-2xl bg-superficie-bassa px-3 font-sans text-bianco focus-visible:outline-none"
          />
        </div>

        <Trigger
          label="Cliente"
          value={
            cliente ? (
              <span className="flex items-center gap-1.5">
                <Codice value={codiceCliente(dati, cliente.id)} />
                {cliente.nome}
              </span>
            ) : (
              <span className="text-fumo-2">scegli o nuovo</span>
            )
          }
          onClick={() => setVista("cliente")}
        />

        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-xs uppercase tracking-wider text-fumo-2">Fascia</label>
          <Segmented value={b.fascia ?? "orario"} onValueChange={(v) => set({ fascia: v })} options={FASCE} layoutId="fascia" />
        </div>

        {(b.fascia ?? "orario") === "orario" && (
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={b.oraInizio}
              onChange={(e) => set({ oraInizio: e.target.value })}
              className="h-10 flex-1 rounded-btn bg-superficie-bassa px-3 font-sans text-sm text-bianco focus:bg-superficie focus:outline-none"
              aria-label="Ora d'arrivo"
            />
            <span className="text-fumo-2">→</span>
            <span className="flex h-10 flex-1 items-center justify-center rounded-btn bg-superficie-bassa px-3 font-mono text-sm text-blu">
              {oraUscita(b.oraInizio, io ? orePartecipante(b, io.id) : 0) || "uscita"}
            </span>
          </div>
        )}

        <CampoFacolt label="Titolo (facoltativo)" value={b.titolo} onValue={(v) => set({ titolo: v })} />
        <CampoFacolt label="Luogo (facoltativo)" value={b.luogo} onValue={(v) => set({ luogo: v })} />
      </div>

      {/* modalità — unica biforcazione */}
      <div className="flex flex-col gap-2">
        <label className="font-mono text-xs uppercase tracking-wider text-fumo-2">Modalità di calcolo</label>
        <Segmented value={(b.modoCalc ?? "") as ModoCalc} onValueChange={(v) => setModo(v as ModoCalc)} options={MODI} layoutId="modo" />
      </div>

      {/* campi per modalità */}
      <AnimatePresence mode="wait">
        {b.modoCalc && (
          <motion.div
            key={b.modoCalc}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-3"
          >
            {b.modoCalc === "preventivo" ? (
              <CampiPreventivo b={b} set={set} />
            ) : (
              <CampiOre b={b} set={set} io={io?.id} dati={dati} onAddOperaio={() => setVista("operaio")} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* stima */}
      {b.modoCalc && (
        <Card tono="piana" className="flex items-center justify-between px-3 py-2">
          <span className="font-mono text-xs uppercase tracking-wider text-fumo-2">
            {svolto ? "Lordo" : "Stima"}
          </span>
          <span className="font-mono text-base tabular-nums text-lime">
            {svolto ? formatEuro(lordo) : `≈ ${formatEuro(lordo)}`}
          </span>
        </Card>
      )}

      {/* trigger spese */}
      {b.mostraSpese ? (
        <SezioneSpese b={b} set={set} />
      ) : (
        <button
          type="button"
          onClick={() => set({ mostraSpese: true, spese: [{ id: nuovoId(), categoria: "materiali", descrizione: "", importo: 0 }] })}
          className="flex items-center gap-2 px-1 text-sm text-fumo"
        >
          <Plus className="h-4 w-4" /> Ho speso qualcosa
        </button>
      )}

      {/* già incassato (solo CREAZIONE svolto, lordo>0). In modifica gli incassi vivono nelle azioni dedicate (Incassa/Storna). */}
      {!b.id && svolto && b.modoCalc && lordo > 0 && <SezioneIncasso b={b} set={set} lordo={lordo} />}

      {!b.id && !svolto && (
        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs uppercase tracking-wider text-fumo-2">Ripeti</label>
          <Segmented
            value={ripeti ? ripeti.periodicita : "no"}
            onValueChange={(v) => setRipeti(v === "no" ? null : v === "settimana" ? { periodicita: "settimana", volte: 4 } : { periodicita: "mese", volte: 3 })}
            options={[
              { value: "no", label: "Una volta" },
              { value: "settimana", label: "×4 sett." },
              { value: "mese", label: "×3 mesi" },
            ]}
            layoutId="ripeti"
          />
        </div>
      )}

      {errore && <p className="text-sm text-critico">{errore}</p>}

      {/* CTA — barra ancorata in basso */}
      <div className="sticky bottom-0 z-10 -mx-5 mt-1 flex gap-2 px-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 glass-alta">
        <Button size="lg" variant="fantasma" onClick={() => navigate(-1)} className="flex-1">
          Annulla
        </Button>
        <Button size="lg" variant={svolto ? "ottone" : "inchiostro"} onClick={() => void salva()} className="flex-[2]">
          {svolto ? "Salva registrazione" : "Pianifica"}
        </Button>
      </div>

      {/* modale tariffa */}
      <Modal
        open={tariffaOpen}
        onOpenChange={setTariffaOpen}
        title="Imposta la tariffa"
        description="Nessun cliente collegato. Quanto vale un'ora di questo lavoro?"
      >
        <div className="flex flex-col gap-3">
          <NumberField iniziale={null} placeholder="0,00" onChange={(n) => setTariffaTmp(String(n))} className="h-11 w-full" />
          <div className="flex justify-end gap-2">
            <Button
              variant="fantasma"
              onClick={() => {
                set({ tariffaCliente: null, tariffaModificata: true });
                setTariffaOpen(false);
                void finalizza();
              }}
            >
              Decido dopo
            </Button>
            <Button
              onClick={() => {
                set({ tariffaCliente: Number(tariffaTmp) || 0, tariffaModificata: true });
                setTariffaOpen(false);
                void finalizza();
              }}
            >
              Conferma
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Campi preventivo ──
function CampiPreventivo({ b, set }: { b: ReturnType<typeof useBozza.getState>["b"]; set: (p: Partial<ReturnType<typeof useBozza.getState>["b"]>) => void }) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-xs uppercase tracking-wider text-fumo-2">Stato preventivo</label>
        <Segmented value={b.statoPreventivo ?? "da_fare"} onValueChange={(v) => set({ statoPreventivo: v })} options={STATI_PREV} layoutId="statoprev" />
      </div>

      {b.mostraInterventi ? (
        <SezioneInterventi b={b} set={set} />
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs uppercase tracking-wider text-fumo-2">Importo concordato</label>
            <div className="flex items-center gap-2">
              <NumberField key="prezzo" iniziale={b.prezzo} placeholder="0,00" onChange={(n) => set({ prezzo: n })} className="h-11 flex-1" />
              <span className="font-mono text-sm text-fumo-2">€</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => set({ mostraInterventi: true, interventi: [{ id: nuovoId(), descrizione: "", prezzo: 0 }] })}
            className="flex items-center gap-2 px-1 text-sm text-fumo"
          >
            <Plus className="h-4 w-4" /> Dividi in interventi (più voci)
          </button>
        </>
      )}

      <PeriodoFacolt b={b} set={set} />
    </>
  );
}

// ── Sezione interventi ──
function SezioneInterventi({ b, set }: { b: ReturnType<typeof useBozza.getState>["b"]; set: (p: Partial<ReturnType<typeof useBozza.getState>["b"]>) => void }) {
  const totale = b.interventi.reduce((a, i) => a + i.prezzo, 0);
  return (
    <Card tono="piana" className="flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wider text-fumo-2">Interventi</span>
        <button type="button" onClick={() => set({ mostraInterventi: false, interventi: [] })} aria-label="Rimuovi interventi" className="text-fumo-2">
          <X className="h-4 w-4" />
        </button>
      </div>
      {b.interventi.map((interv, idx) => (
        <div key={interv.id} className="flex items-center gap-2">
          <input
            value={interv.descrizione}
            placeholder={`Intervento ${idx + 1}`}
            onChange={(e) => set({ interventi: b.interventi.map((x) => x.id === interv.id ? { ...x, descrizione: e.target.value } : x) })}
            className="h-9 min-w-0 flex-1 rounded-2xl bg-superficie-bassa px-2 text-sm focus-visible:outline-none"
          />
          <NumberField
            iniziale={interv.prezzo || null}
            placeholder="0"
            onChange={(n) => set({ interventi: b.interventi.map((x) => x.id === interv.id ? { ...x, prezzo: n } : x) })}
            className="h-9 w-20"
          />
          <span className="font-mono text-xs text-fumo-2">€</span>
          {b.interventi.length > 1 && (
            <button type="button" onClick={() => set({ interventi: b.interventi.filter((x) => x.id !== interv.id) })} aria-label="Rimuovi">
              <Trash2 className="h-4 w-4 text-fumo-2" />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => set({ interventi: [...b.interventi, { id: nuovoId(), descrizione: "", prezzo: 0 }] })}
        className="flex items-center gap-2 px-1 text-sm text-fumo"
      >
        <Plus className="h-4 w-4" /> Aggiungi intervento
      </button>
      {totale > 0 && (
        <div className="mt-1 flex items-center justify-between border-t border-black/5 pt-2">
          <span className="font-mono text-xs text-fumo-2">Totale</span>
          <span className="font-mono text-sm font-semibold text-lime">{formatEuro(totale)}</span>
        </div>
      )}
    </Card>
  );
}

// ── Campi ore/giornate/totale ──
function CampiOre({
  b,
  set,
  io,
  dati,
  onAddOperaio,
}: {
  b: ReturnType<typeof useBozza.getState>["b"];
  set: (p: Partial<ReturnType<typeof useBozza.getState>["b"]>) => void;
  io: string | undefined;
  dati: ReturnType<typeof useStore.getState>["dati"];
  onAddOperaio: () => void;
}) {
  const nome = (id: string) => (id === io ? "io" : dati.operatori.find((o) => o.id === id)?.nome ?? "—");

  const setOrePart = (id: string, ore: number) =>
    set({ partecipanti: b.partecipanti.map((p) => (p.collaboratoreId === id ? { ...p, ore } : p)) });

  return (
    <>
      {b.modoCalc === "giornate" ? (
        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs uppercase tracking-wider text-fumo-2">Giornate</label>
          {b.giornate.map((g) => (
            <div key={g.id} className="flex items-center gap-2 rounded-2xl bg-superficie p-2">
              <input
                type="date"
                value={g.data}
                onChange={(e) =>
                  set({ giornate: b.giornate.map((x) => (x.id === g.id ? { ...x, data: e.target.value } : x)) })
                }
                className="h-9 flex-1 rounded-2xl bg-superficie-bassa px-2 font-mono text-xs"
              />
              {b.partecipanti.map((p) => (
                <NumberField
                  key={p.collaboratoreId}
                  iniziale={g.ore[p.collaboratoreId] ?? null}
                  placeholder={nome(p.collaboratoreId)}
                  onChange={(n) =>
                    set({
                      giornate: b.giornate.map((x) =>
                        x.id === g.id ? { ...x, ore: { ...x.ore, [p.collaboratoreId]: n } } : x,
                      ),
                    })
                  }
                  className="h-9 w-14"
                />
              ))}
              {b.giornate.length > 1 && (
                <button type="button" onClick={() => set({ giornate: b.giornate.filter((x) => x.id !== g.id) })} aria-label="Rimuovi giornata">
                  <Trash2 className="h-4 w-4 text-fumo-2" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const ultima = b.giornate[b.giornate.length - 1]?.data ?? b.data;
              const d = new Date(ultima);
              d.setDate(d.getDate() + 1);
              const next = d.toISOString().slice(0, 10);
              set({ giornate: [...b.giornate, { id: nuovoId(), data: next, ore: {} }] });
            }}
            className="flex items-center gap-2 px-1 text-sm text-fumo"
          >
            <Plus className="h-4 w-4" /> Aggiungi giornata
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs uppercase tracking-wider text-fumo-2">Ore lavorate</label>
          {b.partecipanti.map((p) => (
            <div key={p.collaboratoreId} className="flex items-center justify-between gap-2 rounded-2xl bg-superficie px-3 py-2">
              <span className="text-sm">{nome(p.collaboratoreId)}{p.collaboratoreId !== io ? ` · ${p.tariffaSnapshot} €/h` : ""}</span>
              <div className="flex items-center gap-1">
                <NumberField key={`${b.modoCalc}-${p.collaboratoreId}`} iniziale={p.ore} placeholder="0" onChange={(n) => setOrePart(p.collaboratoreId, n)} className="h-9 w-16" />
                <span className="font-mono text-xs text-fumo-2">h</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* collaborazione */}
      <SezioneOperai b={b} set={set} io={io} dati={dati} onAdd={onAddOperaio} />

      {/* tariffa cliente */}
      <div className="flex items-center justify-between gap-2">
        <label className="font-mono text-xs uppercase tracking-wider text-fumo-2">Tariffa cliente</label>
        <div className="flex items-center gap-1">
          <NumberField key="tariffa" iniziale={b.tariffaCliente} placeholder="0,00" onChange={(n) => set({ tariffaCliente: n, tariffaModificata: true })} className="h-9 w-20" />
          <span className="font-mono text-xs text-fumo-2">€/h</span>
        </div>
      </div>

      {b.modoCalc === "totale" && <PeriodoFacolt b={b} set={set} />}
    </>
  );
}

function SezioneOperai({
  b,
  set,
  io,
  dati,
  onAdd,
}: {
  b: ReturnType<typeof useBozza.getState>["b"];
  set: (p: Partial<ReturnType<typeof useBozza.getState>["b"]>) => void;
  io: string | undefined;
  dati: ReturnType<typeof useStore.getState>["dati"];
  onAdd: () => void;
}) {
  const altri = b.partecipanti.filter((p) => p.collaboratoreId !== io);
  return (
    <div className="flex flex-col gap-2 rounded-vetro bg-superficie p-3">
      <span className="font-mono text-[11px] uppercase tracking-label text-fumo-2">Operai</span>
      {altri.length === 0 ? (
        <span className="text-xs text-fumo-2">Solo io. Aggiungi chi ha lavorato con te.</span>
      ) : (
        altri.map((p) => (
          <div key={p.collaboratoreId} className="flex items-center justify-between rounded-pill bg-superficie-bassa px-3 py-1.5 text-sm">
            <span>{dati.operatori.find((o) => o.id === p.collaboratoreId)?.nome ?? "—"} · {p.tariffaSnapshot} €/h</span>
            <button type="button" onClick={() => set({ partecipanti: b.partecipanti.filter((x) => x.collaboratoreId !== p.collaboratoreId) })} aria-label="Rimuovi operaio">
              <X className="h-4 w-4 text-fumo-2" />
            </button>
          </div>
        ))
      )}
      <button type="button" onClick={onAdd} className="flex items-center gap-2 self-start rounded-pill bg-superficie-bassa px-3 py-1.5 text-sm font-medium text-blu">
        <Plus className="h-4 w-4" /> Aggiungi operaio
      </button>
      {altri.length > 0 && (
        <label className="mt-1 flex items-center gap-2 text-sm text-fumo">
          <input type="checkbox" checked={b.contaMieOreComeCosto} onChange={(e) => set({ contaMieOreComeCosto: e.target.checked })} />
          Conta le mie ore come costo
        </label>
      )}
    </div>
  );
}

function PeriodoFacolt({ b, set }: { b: ReturnType<typeof useBozza.getState>["b"]; set: (p: Partial<ReturnType<typeof useBozza.getState>["b"]>) => void }) {
  if (!b.periodo) {
    return (
      <button type="button" onClick={() => set({ periodo: { dal: b.data, al: b.data } })} className="flex items-center gap-2 px-1 text-sm text-fumo">
        <Plus className="h-4 w-4" /> Periodo (facoltativo)
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <input type="date" value={b.periodo.dal} onChange={(e) => set({ periodo: { dal: e.target.value, al: b.periodo!.al } })} className="h-9 flex-1 rounded-2xl bg-superficie-bassa px-2 font-mono text-xs" />
      <span className="text-fumo-2">–</span>
      <input type="date" value={b.periodo.al} onChange={(e) => set({ periodo: { dal: b.periodo!.dal, al: e.target.value } })} className="h-9 flex-1 rounded-2xl bg-superficie-bassa px-2 font-mono text-xs" />
      <button type="button" onClick={() => set({ periodo: null })} aria-label="Rimuovi periodo">
        <X className="h-4 w-4 text-fumo-2" />
      </button>
    </div>
  );
}

function SezioneSpese({ b, set }: { b: ReturnType<typeof useBozza.getState>["b"]; set: (p: Partial<ReturnType<typeof useBozza.getState>["b"]>) => void }) {
  return (
    <Card tono="piana" className="flex flex-col gap-2 p-3">
      <span className="font-mono text-xs uppercase tracking-wider text-fumo-2">Spese</span>
      {b.spese.map((s) => (
        <div key={s.id} className="flex items-center gap-2">
          <select
            value={s.categoria}
            onChange={(e) => set({ spese: b.spese.map((x) => (x.id === s.id ? { ...x, categoria: e.target.value as CategoriaSpesa } : x)) })}
            className="h-9 rounded-2xl bg-superficie-bassa px-2 text-xs"
          >
            {CATEGORIE.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            value={s.descrizione}
            placeholder="nota"
            onChange={(e) => set({ spese: b.spese.map((x) => (x.id === s.id ? { ...x, descrizione: e.target.value } : x)) })}
            className="h-9 min-w-0 flex-1 rounded-2xl bg-superficie-bassa px-2 text-sm"
          />
          <NumberField iniziale={s.importo} placeholder="0" onChange={(n) => set({ spese: b.spese.map((x) => (x.id === s.id ? { ...x, importo: n } : x)) })} className="h-9 w-16" />
          <button type="button" onClick={() => set({ spese: b.spese.filter((x) => x.id !== s.id) })} aria-label="Rimuovi spesa">
            <Trash2 className="h-4 w-4 text-fumo-2" />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => set({ spese: [...b.spese, { id: nuovoId(), categoria: "materiali", descrizione: "", importo: 0 }] })} className="flex items-center gap-2 px-1 text-sm text-fumo">
        <Plus className="h-4 w-4" /> Aggiungi spesa
      </button>
    </Card>
  );
}

function SezioneIncasso({ b, set, lordo }: { b: ReturnType<typeof useBozza.getState>["b"]; set: (p: Partial<ReturnType<typeof useBozza.getState>["b"]>) => void; lordo: number }) {
  const Toggle = ({ val, label, color }: { val: "no" | "parte" | "tutto"; label: string; color: "rosso" | "arancio" | "verde" }) => {
    const active = b.giaIncassato === val;
    const attivo = {
      rosso: "bg-rosso/15 text-rosso shadow-[inset_0_0_0_1.5px_rgba(255,59,48,0.5)]",
      arancio: "bg-arancio/15 text-arancio shadow-[inset_0_0_0_1.5px_rgba(255,140,26,0.5)]",
      verde: "bg-verde/15 text-verde shadow-[inset_0_0_0_1.5px_rgba(0,209,94,0.5)]",
    }[color];
    return (
      <button type="button" onClick={() => set({ giaIncassato: val })} className={cn("rounded-btn py-2.5 text-sm font-medium transition-colors", active ? attivo : "bg-superficie-bassa text-fumo-2")}>
        {label}
      </button>
    );
  };
  return (
    <div className="flex flex-col gap-2 rounded-vetro bg-superficie p-3">
      <span className="font-mono text-[11px] uppercase tracking-label text-fumo-2">Stato incasso</span>
      <div className="grid grid-cols-3 gap-2">
        <Toggle val="no" label="Da incassare" color="rosso" />
        <Toggle val="parte" label="Parziale" color="arancio" />
        <Toggle val="tutto" label="Pagato" color="verde" />
      </div>
      {b.giaIncassato === "parte" && (
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm text-fumo-2">Incassato</span>
          <NumberField iniziale={b.importoParte} placeholder="0,00" onChange={(n) => set({ importoParte: Math.min(n, lordo) })} className="h-10 w-28" />
          <span className="font-mono text-xs text-fumo-2">di {formatEuro(lordo)}</span>
        </div>
      )}
      <div className="mt-1 flex flex-wrap gap-1.5">
        {METODI.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => set({ metodoPagamento: b.metodoPagamento === m ? null : m })}
            className={cn(
              "rounded-pill px-3 py-1.5 text-xs font-medium transition-colors",
              b.metodoPagamento === m ? "bg-blu/15 text-blu shadow-[inset_0_0_0_1.5px_rgba(59,110,245,0.5)]" : "bg-superficie-bassa text-fumo-2",
            )}
          >
            {etichetta(m)}
          </button>
        ))}
      </div>
      {b.giaIncassato !== "tutto" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-fumo-2">Scadenza</span>
          <input
            type="date"
            value={b.scadenzaIncasso}
            onChange={(e) => set({ scadenzaIncasso: e.target.value })}
            className="h-9 flex-1 rounded-2xl bg-superficie-bassa px-2 font-mono text-xs"
          />
          {b.scadenzaIncasso && (
            <button type="button" onClick={() => set({ scadenzaIncasso: "" })} aria-label="Rimuovi scadenza">
              <X className="h-4 w-4 text-fumo-2" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Picker cliente (sotto-vista) ──
function ScegliCliente({ onIndietro, onScelto }: { onIndietro: () => void; onScelto: (id: string, tariffa: number | null) => void }) {
  const dati = useStore((s) => s.dati);
  const salva = useStore((s) => s.salva);
  const [q, setQ] = useState("");
  const [nuovo, setNuovo] = useState(false);
  const [form, setForm] = useState({ nome: "", cognome: "", luogo: "", telefono: "", tariffa: "" });

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return dati.clienti.filter((c) =>
      !c.deleted && (!t || `${c.nome} ${c.cognome ?? ""} ${c.inizialiCodice}`.toLowerCase().includes(t)),
    );
  }, [dati.clienti, q]);

  const creaCliente = async () => {
    if (!form.nome.trim()) return;
    const id = nuovoId();
    const tariffa = form.tariffa ? Number(form.tariffa.replace(",", ".")) : null;
    await salva("clienti", {
      id,
      nome: form.nome.trim(),
      cognome: form.cognome.trim() || undefined,
      inizialiCodice: assegnaIniziali(form.nome, form.cognome, dati.clienti),
      luogo: form.luogo.trim() || undefined,
      telefono: form.telefono.trim() || undefined,
      tariffaOraria: tariffa,
      modalitaPredefinita: "ore",
      creatoIl: oggiISO(),
      updatedAt: "",
    });
    onScelto(id, tariffa);
  };

  return (
    <div className="flex flex-col gap-3 px-5 pt-5 pb-10">
      <Intestazione
        titolo={nuovo ? "Nuovo cliente" : "Scegli cliente"}
        azione={
          <Button size="icona" variant="tenue" onClick={() => (nuovo ? setNuovo(false) : onIndietro())} aria-label="Indietro">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        }
      />
      {nuovo ? (
        <div className="flex flex-col gap-3">
          <Field label="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome o ragione sociale" />
          <Field label="Cognome" value={form.cognome} onChange={(e) => setForm({ ...form, cognome: e.target.value })} />
          <Field label="Luogo" value={form.luogo} onChange={(e) => setForm({ ...form, luogo: e.target.value })} />
          <Field label="Telefono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} inputMode="tel" />
          <Field label="Tariffa oraria" value={form.tariffa} onChange={(e) => setForm({ ...form, tariffa: e.target.value })} suffix="€/h" inputMode="decimal" />
          <Button onClick={() => void creaCliente()}>Crea e seleziona</Button>
        </div>
      ) : (
        <>
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-fumo-2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca per nome o codice…" className="h-11 w-full rounded-2xl bg-superficie-bassa pl-9 pr-3 text-sm focus-visible:outline-none" />
          </div>
          {lista.map((c) => (
            <button key={c.id} type="button" onClick={() => onScelto(c.id, c.tariffaOraria ?? null)} className="flex items-center justify-between gap-2 rounded-2xl bg-superficie px-3 py-2.5 text-left">
              <span className="flex items-center gap-2">
                <Codice value={codiceCliente(dati, c.id)} />
                <span className="text-sm">{c.nome} {c.cognome ?? ""}</span>
              </span>
              {c.luogo && <span className="font-mono text-xs text-fumo-2">{c.luogo}</span>}
            </button>
          ))}
          <button type="button" onClick={() => setNuovo(true)} className="flex items-center gap-2 rounded-2xl bg-blu/[0.08] px-3 py-3 text-sm text-blu">
            <Plus className="h-4 w-4" /> Nuovo cliente
          </button>
        </>
      )}
    </div>
  );
}

// ── Picker operaio (sotto-vista) ──
function ScegliOperaio({ esistenti, onIndietro, onScelto }: { esistenti: string[]; onIndietro: () => void; onScelto: (id: string, tariffa: number) => void }) {
  const dati = useStore((s) => s.dati);
  const salva = useStore((s) => s.salva);
  const [nuovo, setNuovo] = useState(false);
  const [form, setForm] = useState({ nome: "", tariffa: "" });
  const disponibili = dati.operatori.filter((o) => !o.deleted && o.attivo && !esistenti.includes(o.id));

  const crea = async () => {
    if (!form.nome.trim()) return;
    const id = nuovoId();
    const tariffa = Number(form.tariffa.replace(",", ".")) || 0;
    await salva("operatori", { id, nome: form.nome.trim(), ruolo: "collaboratore", tariffaOraria: tariffa, attivo: true, creatoIl: oggiISO(), updatedAt: "" });
    onScelto(id, tariffa);
  };

  return (
    <div className="flex flex-col gap-3 px-5 pt-5 pb-10">
      <Intestazione
        titolo={nuovo ? "Nuovo operaio" : "Scegli operaio"}
        azione={
          <Button size="icona" variant="tenue" onClick={() => (nuovo ? setNuovo(false) : onIndietro())} aria-label="Indietro">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        }
      />
      {nuovo ? (
        <div className="flex flex-col gap-3">
          <Field label="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <Field label="Tariffa oraria (costo)" value={form.tariffa} onChange={(e) => setForm({ ...form, tariffa: e.target.value })} suffix="€/h" inputMode="decimal" />
          <Button onClick={() => void crea()}>Crea e aggiungi</Button>
        </div>
      ) : (
        <>
          {disponibili.map((o) => (
            <button key={o.id} type="button" onClick={() => onScelto(o.id, o.tariffaOraria ?? 0)} className="flex items-center justify-between gap-2 rounded-2xl bg-superficie px-3 py-2.5 text-left">
              <span className="text-sm">{o.nome}</span>
              <Badge stato="neutro">{o.tariffaOraria ?? 0} €/h</Badge>
            </button>
          ))}
          <button type="button" onClick={() => setNuovo(true)} className="flex items-center gap-2 rounded-2xl bg-blu/[0.08] px-3 py-3 text-sm text-blu">
            <Plus className="h-4 w-4" /> Nuovo operaio
          </button>
        </>
      )}
    </div>
  );
}
