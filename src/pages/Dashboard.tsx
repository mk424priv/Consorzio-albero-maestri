import { Link } from "react-router-dom";
import NumberFlow from "@number-flow/react";
import { clsx } from "clsx";
import { Boxes, FolderKanban, Plus, Plug } from "lucide-react";
import { totaleCosti, totaleSpeso } from "@/lib/costi";
import { STATI_PROGETTO, TIPI_PROGETTO } from "@/lib/dominio";
import { giorniAllaScadenza, prossimaScadenza, statoScadenza } from "@/lib/manutenzione";
import { useStore } from "@/store/useStore";
import { Etichetta, PannelloAnimato, TitoloSezione, Vuoto } from "@/components/ui";

const EURO = { style: "currency", currency: "EUR", maximumFractionDigits: 0 } as const;

/** Schermata CONTROLLO: colpo d'occhio su progetti, costi, moduli. */
export function Dashboard() {
  const progetti = useStore((s) => s.progetti);
  const integrazioni = useStore((s) => s.integrazioni);

  const attivi = progetti.filter((p) => p.stato !== "completato");
  const stimato = progetti.reduce((acc, p) => acc + totaleCosti(p.costi), 0);
  const speso = progetti.reduce((acc, p) => acc + totaleSpeso(p.costi), 0);
  const recenti = progetti.slice(0, 5);

  const scadenze = progetti
    .flatMap((p) =>
      p.manutenzione.map((intervento) => ({
        progetto: p,
        intervento,
        giorni: giorniAllaScadenza(prossimaScadenza(intervento)),
      })),
    )
    .sort((a, b) => a.giorni - b.giorni);
  const daAttenzionare = scadenze.filter((s) => statoScadenza(s.giorni) !== "ok");

  const stat = [
    { label: "PROGETTI ATTIVI", valore: <NumberFlow value={attivi.length} />, colore: "text-neon glow" },
    { label: "COMPLETATI", valore: <NumberFlow value={progetti.length - attivi.length} />, colore: "text-ice" },
    { label: "COSTO STIMATO", valore: <NumberFlow value={stimato} format={EURO} locales="it-IT" />, colore: "text-cyan" },
    { label: "GIÀ SPESO", valore: <NumberFlow value={speso} format={EURO} locales="it-IT" />, colore: "text-amber" },
    {
      label: "SCADENZE",
      valore: <NumberFlow value={daAttenzionare.length} />,
      colore: daAttenzionare.length > 0 ? "text-danger" : "text-ice",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stat.map((s, i) => (
          <PannelloAnimato key={s.label} delay={i * 0.06} className="p-4">
            <div className="text-[10px] tracking-widest text-ghost">{s.label}</div>
            <div className={`mt-1 text-2xl font-bold ${s.colore}`}>{s.valore}</div>
          </PannelloAnimato>
        ))}
      </div>

      <PannelloAnimato delay={0.25} className="p-5">
        <div className="flex items-center justify-between">
          <TitoloSezione sub="Gli ultimi progetti su cui hai lavorato.">FLUSSO OPERATIVO</TitoloSezione>
          <Link to="/progetti" className="text-xs tracking-widest text-ghost transition-colors hover:text-neon">
            TUTTI →
          </Link>
        </div>
        {recenti.length === 0 ? (
          <Vuoto
            icona="⌁"
            titolo="Nessun progetto in memoria."
            sub="Avvia il primo dalla sezione CREA."
          />
        ) : (
          <div className="space-y-2">
            {recenti.map((p) => (
              <Link
                key={p.id}
                to={`/progetti/${p.id}`}
                className="flex items-center gap-3 rounded-xl border border-ice/5 bg-ice/[0.03] px-4 py-3 transition-all hover:border-neon/30 hover:bg-neon/5"
              >
                <span className="text-lg">{TIPI_PROGETTO[p.tipo].icona}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ice">{p.nome}</div>
                  <div className="text-[10px] text-ghost">{TIPI_PROGETTO[p.tipo].label}</div>
                </div>
                {p.scena && <Boxes className="size-4 text-cyan" />}
                <Etichetta colore={STATI_PROGETTO[p.stato].colore}>
                  {STATI_PROGETTO[p.stato].label}
                </Etichetta>
              </Link>
            ))}
          </div>
        )}
      </PannelloAnimato>

      {daAttenzionare.length > 0 && (
        <PannelloAnimato delay={0.3} className="p-5">
          <TitoloSezione sub="Interventi scaduti o in scadenza nei prossimi 7 giorni.">
            PROSSIME SCADENZE
          </TitoloSezione>
          <div className="space-y-2">
            {daAttenzionare.slice(0, 5).map(({ progetto: p, intervento: i, giorni }) => (
              <Link
                key={i.id}
                to={`/progetti/${p.id}`}
                className="flex items-center gap-3 rounded-xl border border-ice/5 bg-ice/[0.03] px-4 py-3 transition-all hover:border-danger/30 hover:bg-danger/5"
              >
                <span className="text-lg">{TIPI_PROGETTO[p.tipo].icona}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ice">{i.titolo || "Intervento"}</div>
                  <div className="text-[10px] text-ghost">{p.nome}</div>
                </div>
                <span className={clsx("text-[10px] font-semibold tracking-wider", giorni < 0 ? "text-danger" : "text-amber")}>
                  {giorni < 0 ? `SCADUTO DA ${Math.abs(giorni)}G` : giorni === 0 ? "OGGI" : `TRA ${giorni}G`}
                </span>
              </Link>
            ))}
          </div>
        </PannelloAnimato>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { to: "/crea", icona: Plus, label: "CREA PROGETTO", sub: "Nuova missione, costi, bozza 3D" },
          { to: "/progetti", icona: FolderKanban, label: "PROGETTI", sub: `${progetti.length} in archivio` },
          { to: "/integrazioni", icona: Plug, label: "MODULI", sub: `${integrazioni.length} app collegate` },
        ].map((a, i) => (
          <PannelloAnimato key={a.to} delay={0.36 + i * 0.06} className="group">
            <Link to={a.to} className="flex items-center gap-3 p-4">
              <a.icona className="size-5 text-neon-dim transition-colors group-hover:text-neon" />
              <div>
                <div className="text-xs font-bold tracking-widest text-ice">{a.label}</div>
                <div className="text-[10px] text-ghost">{a.sub}</div>
              </div>
            </Link>
          </PannelloAnimato>
        ))}
      </div>
    </div>
  );
}
