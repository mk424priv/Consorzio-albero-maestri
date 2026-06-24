import { Banknote, ChevronLeft, ChevronRight, Plus, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CardLavoro } from "@/components/CardLavoro";
import { Avatar, Button, Codice, Cruscotto, Field, Foglio, NumberHero, SectionHeader, Segmented, StatTile, Swipeable } from "@/components/ui";
import { codiceCliente } from "@/lib/codice-parlante";
import { libroOperatore, riepilogoCliente, riepilogoSoldi } from "@/lib/conti";
import { chiaveMese, formatData, formatEuro, formatMese, oggiISO } from "@/lib/format";
import { calcoloLavoro, operatoreIo } from "@/lib/lavoro-calc";
import { notificaUndo } from "@/lib/undo";
import type { Cliente, Lavoro } from "@/lib/types";
import { incassaLavoro, incassaSubito, prelievoTitolare } from "@/store/azioni";
import { useStore } from "@/store/store";

function meseAdiacente(chiave: string, delta: number): string {
  const [a, m] = chiave.split("-").map(Number);
  const d = new Date(a, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const iniz = (c: Cliente) => `${c.nome[0] ?? ""}${c.cognome?.[0] ?? ""}`.toUpperCase() || "?";

export function Soldi() {
  const dati = useStore((s) => s.dati);
  const navigate = useNavigate();
  const [mese, setMese] = useState(() => chiaveMese(oggiISO()));
  const [modo, setModo] = useState<"incassare" | "pagare">("incassare");
  const [subitoOpen, setSubitoOpen] = useState(false);
  const [prelievoOpen, setPrelievoOpen] = useState(false);

  const r = riepilogoSoldi(dati, mese);
  const io = operatoreIo(dati);

  const debitori = useMemo(
    () =>
      dati.clienti
        .filter((c) => !c.deleted)
        .map((c) => ({ c, saldo: riepilogoCliente(dati, c.id).saldoDaIncassare }))
        .filter((x) => x.saldo > 0)
        .sort((a, b) => b.saldo - a.saldo),
    [dati],
  );

  const debitoriOperai = useMemo(
    () =>
      dati.operatori
        .filter((o) => !o.deleted && o.id !== io?.id)
        .map((o) => ({ o, libro: libroOperatore(dati, o.id) }))
        .filter((x) => x.libro.saldo > 0)
        .sort((a, b) => b.libro.saldo - a.libro.saldo),
    [dati, io?.id],
  );

  const usciteMese = dati.compensi.filter((c) => !c.deleted && chiaveMese(c.data) === mese).reduce((a, c) => a + c.importo, 0);
  const cassaMese = Math.max(0, r.incassatoMese - usciteMese);
  const totale = modo === "incassare" ? r.daIncassare : r.daPagareOperai;
  const prelieviMese = useMemo(
    () => dati.compensi.filter((c) => !c.deleted && c.operatoreId === io?.id && c.note === "prelievo" && chiaveMese(c.data) === mese).sort((a, b) => b.data.localeCompare(a.data)),
    [dati.compensi, io?.id, mese],
  );

  return (
    <div className="flex flex-col">
      <Cruscotto
        titolo="Soldi"
        mesh="linfa"
        controllo={
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setMese((m) => meseAdiacente(m, -1))} aria-label="Mese precedente" className="flex h-9 w-9 items-center justify-center rounded-full bg-superficie text-fumo hover:text-bianco">
              <ChevronLeft size={18} />
            </button>
            <span className="w-[84px] text-center font-mono text-xs text-fumo">{formatMese(mese)}</span>
            <button type="button" onClick={() => setMese((m) => meseAdiacente(m, 1))} aria-label="Mese successivo" className="flex h-9 w-9 items-center justify-center rounded-full bg-superficie text-fumo hover:text-bianco">
              <ChevronRight size={18} />
            </button>
          </div>
        }
      >
        <Segmented
          value={modo}
          onValueChange={setModo}
          options={[
            { value: "incassare", label: "Entrate" },
            { value: "pagare", label: "Uscite" },
          ]}
          layoutId="modo-soldi"
          className="w-full"
        />
        <div className="mt-5 flex flex-col items-center">
          <span className="font-mono text-[11px] uppercase tracking-label text-fumo">{modo === "incassare" ? "Totale da incassare" : "Totale da pagare"}</span>
          <NumberHero value={totale} euro tono={modo === "incassare" ? "verde" : "rosso"} className="text-[52px]" />
        </div>
      </Cruscotto>

      <div className="flex flex-col gap-6 px-4 pt-5">
        <button type="button" onClick={() => navigate("/dashboard")} className="grid grid-cols-3 gap-2 text-left transition-transform active:scale-[0.99]" aria-label="Apri la Dashboard">
          <StatTile etichetta="Guadagnato">{formatEuro(r.guadagnatoMese)}</StatTile>
          <StatTile etichetta="Incassato" tono="verde">{formatEuro(r.incassatoMese)}</StatTile>
          <StatTile etichetta="Da incassare" tono={r.daIncassare > 0 ? "rosso" : "neutro"}>{formatEuro(r.daIncassare)}</StatTile>
        </button>

        {modo === "incassare" ? (
          <section className="flex flex-col gap-3">
            <SectionHeader titolo="Da incassare" conteggio={debitori.length} tono={debitori.length ? "rosso" : "neutro"} />
            {debitori.length === 0 ? (
              <p className="py-6 text-center text-sm text-fumo-2">Tutto incassato. Niente in sospeso. 🌿</p>
            ) : (
              debitori.map(({ c, saldo }) => {
                const aperti = dati.lavori.filter((l) => !l.deleted && l.clienteId === c.id && l.fase === "fatto" && calcoloLavoro(dati, l).statoIncasso !== "pagato");
                return (
                  <div key={c.id} className="flex flex-col gap-2.5">
                    <button type="button" onClick={() => navigate(`/cliente/${c.id}`)} className="flex items-center justify-between gap-2 rounded-vetro bg-superficie p-3 text-left transition-transform active:scale-[0.99]">
                      <span className="flex min-w-0 items-center gap-3">
                        <Avatar iniziali={iniz(c)} tono="rosso" />
                        <span className="flex min-w-0 flex-col items-start">
                          <span className="truncate text-sm font-medium">{c.nome} {c.cognome ?? ""}</span>
                          <Codice value={codiceCliente(dati, c.id)} />
                        </span>
                      </span>
                      <span className="shrink-0 text-base font-bold tracking-tight text-rosso">{formatEuro(saldo)}</span>
                    </button>
                    {aperti.map((l) => <LavoroIncasso key={l.id} lavoro={l} daIncassare={calcoloLavoro(dati, l).daIncassare} />)}
                  </div>
                );
              })
            )}
            <Button variant="inchiostro" onClick={() => setSubitoOpen(true)} className="mt-1">
              <Plus size={18} /> Incasso subito
            </Button>
          </section>
        ) : (
          <section className="flex flex-col gap-3">
            <SectionHeader titolo="Da pagare · squadra" conteggio={debitoriOperai.length} tono={debitoriOperai.length ? "rosso" : "neutro"} />
            {debitoriOperai.length === 0 ? (
              <p className="py-4 text-center text-sm text-fumo-2">Nessun compenso in sospeso.</p>
            ) : (
              debitoriOperai.map(({ o, libro }) => (
                <button key={o.id} type="button" onClick={() => navigate(`/operaio/${o.id}`)} className="flex items-center justify-between gap-2 rounded-vetro bg-superficie p-3 text-left transition-transform active:scale-[0.99]">
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar iniziali={o.nome.slice(0, 2).toUpperCase()} tono="blu" />
                    <span className="flex min-w-0 flex-col items-start">
                      <span className="truncate text-sm font-medium">{o.nome}</span>
                      <span className="font-mono text-[11px] text-fumo-2">dovuto {formatEuro(libro.dovuto)} · pagato {formatEuro(libro.pagato)}</span>
                    </span>
                  </span>
                  <span className="shrink-0 text-base font-bold tracking-tight text-rosso">{formatEuro(libro.saldo)}</span>
                </button>
              ))
            )}

            <div className="mt-1 flex flex-col gap-2.5">
              <div className="flex items-center justify-between rounded-vetro bg-superficie p-4">
                <button type="button" onClick={() => io && navigate(`/operaio/${io.id}`)} className="flex min-w-0 flex-col text-left">
                  <span className="flex items-center gap-2 text-sm font-medium"><Wallet size={16} className="text-verde" /> Io · cassa del mese</span>
                  <span className="font-mono text-[11px] text-fumo-2">Non è un costo, è un prelievo</span>
                </button>
                <div className="flex items-center gap-3">
                  <span className="font-bold tracking-tight text-verde">{formatEuro(cassaMese)}</span>
                  <Button size="sm" onClick={() => setPrelievoOpen(true)} disabled={cassaMese <= 0}>Preleva</Button>
                </div>
              </div>
              {prelieviMese.length > 0 && (
                <div className="flex flex-col gap-1 rounded-vetro bg-superficie p-3">
                  <span className="font-mono text-[11px] uppercase tracking-label text-fumo-2">Prelievi · {formatMese(mese)}</span>
                  {prelieviMese.map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-sm">
                      <span className="font-mono text-xs text-fumo-2">{formatData(c.data)}</span>
                      <span className="font-mono text-verde">− {formatEuro(c.importo)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      <IncassoSubitoSheet open={subitoOpen} onOpenChange={setSubitoOpen} onFatto={(id) => navigate(`/lavoro/${id}`)} />
      <PrelievoSheet open={prelievoOpen} onOpenChange={setPrelievoOpen} cassa={cassaMese} />
    </div>
  );
}

function LavoroIncasso({ lavoro, daIncassare }: { lavoro: Lavoro; daIncassare: number }) {
  return (
    <Swipeable
      azione={<span className="flex items-center gap-1.5 font-semibold text-rosso"><Banknote size={16} /> Riscuoti</span>}
      onAzione={async () => {
        const a = await incassaLavoro(lavoro.id, daIncassare);
        notificaUndo(`Incassato ${formatEuro(daIncassare)}`, a);
      }}
    >
      <CardLavoro lavoro={lavoro} />
    </Swipeable>
  );
}

function IncassoSubitoSheet({ open, onOpenChange, onFatto }: { open: boolean; onOpenChange: (o: boolean) => void; onFatto: (id: string) => void }) {
  const dati = useStore((s) => s.dati);
  const [clienteId, setClienteId] = useState("");
  const [titolo, setTitolo] = useState("");
  const [importo, setImporto] = useState("");
  const v = Number(importo.replace(",", "."));

  const conferma = async () => {
    if (!(v > 0)) return;
    const { id, annulla } = await incassaSubito({ clienteId: clienteId || undefined, titolo, importo: v });
    setClienteId("");
    setTitolo("");
    setImporto("");
    onOpenChange(false);
    notificaUndo(`Incassato ${formatEuro(v)}`, annulla);
    onFatto(id);
  };

  return (
    <Foglio open={open} onOpenChange={onOpenChange} variante="azione-incasso" titolo="Incasso subito">
      <p className="mb-4 text-sm text-fumo">A preventivo, tutto subito, senza ore.</p>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-xs uppercase tracking-label text-fumo-2">Cliente</label>
          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="h-12 rounded-btn bg-superficie-bassa px-4 text-sm text-bianco focus:outline-none">
            <option value="">Senza cliente</option>
            {dati.clienti.filter((c) => !c.deleted).map((c) => (
              <option key={c.id} value={c.id}>{c.nome} {c.cognome ?? ""}</option>
            ))}
          </select>
        </div>
        <Field label="Descrizione" value={titolo} onChange={(e) => setTitolo(e.target.value)} placeholder="Es. Potatura giardino" />
        <Field label="Importo" value={importo} onChange={(e) => setImporto(e.target.value)} suffix="€" inputMode="decimal" placeholder="0,00" />
        <Button size="lg" onClick={() => void conferma()} disabled={!(v > 0)}>
          Incassa {v > 0 ? formatEuro(v) : ""}
        </Button>
      </div>
    </Foglio>
  );
}

function PrelievoSheet({ open, onOpenChange, cassa }: { open: boolean; onOpenChange: (o: boolean) => void; cassa: number }) {
  const [importo, setImporto] = useState("");
  const conferma = async () => {
    const v = importo ? Number(importo.replace(",", ".")) : cassa;
    const a = await prelievoTitolare(v);
    setImporto("");
    onOpenChange(false);
    notificaUndo(`Prelevato ${formatEuro(v)}`, a);
  };
  return (
    <Foglio open={open} onOpenChange={onOpenChange} variante="azione-pagamento" titolo="Preleva">
      <p className="mb-4 text-sm text-fumo">Vai a prendere dei soldi dalla cassa.</p>
      <div className="flex flex-col gap-3">
        <p className="font-mono text-sm text-fumo-2">Cassa del mese: <span className="text-verde">{formatEuro(cassa)}</span></p>
        <Field label="Importo" value={importo} onChange={(e) => setImporto(e.target.value)} suffix="€" inputMode="decimal" placeholder={String(cassa)} />
        <Button size="lg" onClick={() => void conferma()}>Conferma prelievo</Button>
      </div>
    </Foglio>
  );
}
