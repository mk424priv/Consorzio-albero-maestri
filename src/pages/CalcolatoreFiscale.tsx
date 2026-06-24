import { ArrowLeft, ChevronLeft, ChevronRight, Settings2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Intestazione } from "@/components/Intestazione";
import { Button, Card, Segmented } from "@/components/ui";
import {
  calcolaFiscale,
  caricaImpostazioniFiscali,
  salvaImpostazioniFiscali,
  type ImpostazioniFiscali,
  type RegimeFiscale,
} from "@/lib/fiscale";
import { chiaveMese, formatEuro, formatMese, oggiISO } from "@/lib/format";
import { useStore } from "@/store/store";

function meseAdiacente(chiave: string, delta: number): string {
  const [a, m] = chiave.split("-").map(Number);
  const d = new Date(a, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const REGIMI: { value: RegimeFiscale; label: string }[] = [
  { value: "forfettario", label: "Forfettario" },
  { value: "ordinario", label: "Ordinario" },
  { value: "semplificato", label: "Semplificato" },
];

export function CalcolatoreFiscale() {
  const navigate = useNavigate();
  const dati = useStore((s) => s.dati);
  const [mese, setMese] = useState(() => chiaveMese(oggiISO()));
  const [cfg, setCfg] = useState<ImpostazioniFiscali>(() => caricaImpostazioniFiscali());
  const [mostraConfig, setMostraConfig] = useState(false);

  const aggCfg = (patch: Partial<ImpostazioniFiscali>) => {
    const next = { ...cfg, ...patch };
    setCfg(next);
    salvaImpostazioniFiscali(next);
  };

  // Fatturato del mese: somma degli importi incassati in quel mese
  const pagamentiMese = useMemo(
    () => dati.pagamenti.filter(
      (p) => !p.deleted && p.dataIncasso && chiaveMese(p.dataIncasso) === mese && p.importoIncassato > 0,
    ),
    [dati.pagamenti, mese],
  );

  const totMese = useMemo(
    () => pagamentiMese.reduce((a, p) => a + p.importoIncassato, 0),
    [pagamentiMese],
  );

  const calcoloMese = useMemo(() => calcolaFiscale(totMese, cfg), [totMese, cfg]);

  // Per ogni pagamento nel mese
  const dettagli = useMemo(
    () => pagamentiMese.map((p) => {
      const lavoro = p.lavoroId ? dati.lavori.find((l) => l.id === p.lavoroId) : undefined;
      const cliente = p.clienteId ? dati.clienti.find((c) => c.id === p.clienteId) : undefined;
      const calc = calcolaFiscale(p.importoIncassato, cfg);
      return { p, lavoro, cliente, calc };
    }),
    [pagamentiMese, dati, cfg],
  );

  return (
    <div className="flex flex-col gap-4 px-5 pt-5 pb-10">
      <Intestazione
        titolo="Calcolatore fiscale"
        azione={
          <Button size="icona" variant="tenue" onClick={() => navigate(-1)} aria-label="Indietro">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        }
      />

      {/* Selezione mese */}
      <div className="flex items-center justify-between gap-1">
        <button type="button" onClick={() => setMese((m) => meseAdiacente(m, -1))} className="flex h-9 w-9 items-center justify-center rounded-full bg-superficie text-fumo hover:text-bianco">
          <ChevronLeft size={18} />
        </button>
        <span className="font-mono text-sm font-medium capitalize text-bianco">{formatMese(mese)}</span>
        <button type="button" onClick={() => setMese((m) => meseAdiacente(m, 1))} className="flex h-9 w-9 items-center justify-center rounded-full bg-superficie text-fumo hover:text-bianco">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Config regime */}
      <button
        type="button"
        onClick={() => setMostraConfig((v) => !v)}
        className="flex items-center justify-between gap-2 rounded-2xl bg-superficie px-3 py-2.5 text-left"
      >
        <span className="flex items-center gap-2 text-sm text-bianco">
          <Settings2 className="h-4 w-4 text-fumo-2" />
          Regime {REGIMI.find((r) => r.value === cfg.regime)?.label}
          {cfg.regime === "forfettario" && ` · coeff. ${cfg.coefficienteRedditivita}%`}
        </span>
        <span className="font-mono text-xs text-fumo-2">{cfg.aliquotaImposta}% + {cfg.aliquotaContributi}%</span>
      </button>

      {mostraConfig && (
        <Card tono="piana" className="flex flex-col gap-3 p-4">
          <p className="font-mono text-xs uppercase tracking-wider text-fumo-2">Configurazione fiscale</p>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-fumo-2">Regime fiscale</label>
            <Segmented value={cfg.regime} onValueChange={(v) => aggCfg({ regime: v as RegimeFiscale })} options={REGIMI} layoutId="regime" />
          </div>
          {cfg.regime === "forfettario" && (
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm text-fumo-2">Coefficiente di redditività (%)</label>
              <input
                type="number"
                value={cfg.coefficienteRedditivita}
                onChange={(e) => aggCfg({ coefficienteRedditivita: Math.min(100, Math.max(0, Number(e.target.value))) })}
                className="h-9 w-20 rounded-2xl bg-superficie-bassa px-2 text-right font-mono text-sm text-bianco focus-visible:outline-none"
              />
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <label className="text-sm text-fumo-2">Aliquota imposta (%)</label>
            <input
              type="number"
              value={cfg.aliquotaImposta}
              onChange={(e) => aggCfg({ aliquotaImposta: Math.min(100, Math.max(0, Number(e.target.value))) })}
              className="h-9 w-20 rounded-2xl bg-superficie-bassa px-2 text-right font-mono text-sm text-bianco focus-visible:outline-none"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-sm text-fumo-2">Contributi INPS (%)</label>
            <input
              type="number"
              value={cfg.aliquotaContributi}
              onChange={(e) => aggCfg({ aliquotaContributi: Math.min(100, Math.max(0, Number(e.target.value))) })}
              className="h-9 w-20 rounded-2xl bg-superficie-bassa px-2 text-right font-mono text-sm text-bianco focus-visible:outline-none"
            />
          </div>
          <p className="text-xs text-fumo-2">
            {cfg.regime === "forfettario"
              ? `Le tasse si applicano su ${cfg.coefficienteRedditivita}% del fatturato (reddito imponibile).`
              : "Le tasse si applicano sull'intero fatturato."}
          </p>
        </Card>
      )}

      {/* Riepilogo mensile */}
      <Card tono="alta" className="flex flex-col gap-3 p-4">
        <p className="font-mono text-xs uppercase tracking-wider text-fumo-2">Riepilogo {formatMese(mese)}</p>
        {totMese === 0 ? (
          <p className="text-sm text-fumo-2">Nessun incasso registrato in questo mese.</p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-fumo-2">Fatturato lordo</span>
              <span className="font-mono text-base font-semibold text-bianco">{formatEuro(calcoloMese.lordo)}</span>
            </div>
            {cfg.regime === "forfettario" && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-fumo-2">Reddito imponibile ({cfg.coefficienteRedditivita}%)</span>
                <span className="font-mono text-sm text-bianco">{formatEuro(calcoloMese.redditoImponibile)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-fumo-2">Imposta ({cfg.aliquotaImposta}%)</span>
              <span className="font-mono text-sm text-rosso">{formatEuro(calcoloMese.imposta)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-fumo-2">Contributi INPS ({cfg.aliquotaContributi}%)</span>
              <span className="font-mono text-sm text-rosso">{formatEuro(calcoloMese.contributi)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-black/8 pt-2">
              <span className="text-sm font-semibold text-fumo-2">Totale tasse stimate</span>
              <span className="font-mono text-base font-semibold text-rosso">{formatEuro(calcoloMese.totaleTasse)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-bianco">Netto stimato</span>
              <span className="font-mono text-xl font-bold text-verde">{formatEuro(calcoloMese.netto)}</span>
            </div>
          </>
        )}
      </Card>

      {/* Dettaglio per fattura */}
      {dettagli.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-wider text-fumo-2">Dettaglio per incasso</p>
          {dettagli.map(({ p, lavoro, cliente, calc }) => (
            <Card key={p.id} tono="piana" className="flex flex-col gap-1.5 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-bianco">
                    {lavoro?.titolo ?? "Incasso diretto"}
                  </p>
                  {cliente && (
                    <p className="truncate font-mono text-xs text-fumo-2">{cliente.nome} {cliente.cognome ?? ""}</p>
                  )}
                </div>
                <span className="font-mono text-xs text-fumo-2">{p.dataIncasso}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 pt-1">
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] text-fumo-2">Lordo</span>
                  <span className="font-mono text-sm font-semibold text-bianco">{formatEuro(calc.lordo)}</span>
                </div>
                <div className="flex flex-col text-center">
                  <span className="font-mono text-[10px] text-fumo-2">Tasse</span>
                  <span className="font-mono text-sm font-semibold text-rosso">{formatEuro(calc.totaleTasse)}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="font-mono text-[10px] text-fumo-2">Netto</span>
                  <span className="font-mono text-sm font-semibold text-verde">{formatEuro(calc.netto)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="text-center font-mono text-[0.65rem] text-fumo-2">
        Il calcolo è una stima. Consulta il tuo commercialista per i valori definitivi.
      </p>
    </div>
  );
}
