import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Boxes, ChevronLeft, Trash2 } from "lucide-react";
import { AMBIENTI_3D, ORDINE_AMBIENTI, ORDINE_STATI, STATI_PROGETTO, TIPI_PROGETTO } from "@/lib/dominio";
import { dataBreve } from "@/lib/format";
import type { Ambiente3D } from "@/lib/types";
import { useStore } from "@/store/useStore";
import { CalcolatoreCosti } from "@/components/CalcolatoreCosti";
import { PianoManutenzione } from "@/components/PianoManutenzione";
import { Btn, Campo, Chip, PannelloAnimato, TitoloSezione, Vuoto } from "@/components/ui";

/** Scheda progetto: stato, costi (persistenti), bozza 3D, eliminazione. */
export function DettaglioProgetto() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const progetto = useStore((s) => s.progetti.find((p) => p.id === id));
  const aggiornaProgetto = useStore((s) => s.aggiornaProgetto);
  const eliminaProgetto = useStore((s) => s.eliminaProgetto);
  const [confermaElimina, setConfermaElimina] = useState(false);

  if (!progetto) {
    return <Vuoto icona="∅" titolo="Progetto non trovato." sub="Forse è stato eliminato." />;
  }

  const aggiungiBozza = (ambiente: Ambiente3D) => {
    void aggiornaProgetto(progetto.id, {
      scena: { ambiente, ...AMBIENTI_3D[ambiente], oggetti: [] },
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/progetti" className="text-ghost transition-colors hover:text-neon">
          <ChevronLeft className="size-5" />
        </Link>
        <span className="text-2xl">{TIPI_PROGETTO[progetto.tipo].icona}</span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold text-ice">{progetto.nome}</h1>
          <div className="text-[10px] tracking-widest text-ghost">
            {TIPI_PROGETTO[progetto.tipo].label.toUpperCase()} · CREATO {dataBreve(progetto.createdAt)}
          </div>
        </div>
      </div>

      <PannelloAnimato className="space-y-4 p-5">
        <TitoloSezione>STATO</TitoloSezione>
        <div className="flex flex-wrap gap-2">
          {ORDINE_STATI.map((s) => (
            <Chip
              key={s}
              attivo={progetto.stato === s}
              onClick={() => void aggiornaProgetto(progetto.id, { stato: s })}
            >
              {STATI_PROGETTO[s].label}
            </Chip>
          ))}
        </div>
        {progetto.descrizione && (
          <p className="text-sm leading-relaxed text-ghost">{progetto.descrizione}</p>
        )}
        <Campo
          label="Budget (€)"
          type="number"
          min={0}
          step="any"
          placeholder="nessun budget"
          value={progetto.budget ?? ""}
          onChange={(e) =>
            void aggiornaProgetto(progetto.id, {
              budget: e.target.value === "" ? null : Number(e.target.value),
            })
          }
        />
      </PannelloAnimato>

      <PannelloAnimato delay={0.08} className="p-5">
        <TitoloSezione sub="Le modifiche si salvano da sole.">CALCOLO COSTI</TitoloSezione>
        <CalcolatoreCosti
          voci={progetto.costi}
          budget={progetto.budget}
          onChange={(costi) => void aggiornaProgetto(progetto.id, { costi })}
        />
      </PannelloAnimato>

      <PannelloAnimato delay={0.16} className="space-y-3 p-5">
        <TitoloSezione sub="Interventi ricorrenti: da una data scelta, ripeti ogni N giorni, mesi o anni.">
          PIANO DI MANUTENZIONE
        </TitoloSezione>
        {progetto.manutenzione.length === 0 && (
          <p className="text-xs text-ghost">Nessun intervento pianificato.</p>
        )}
        <PianoManutenzione
          interventi={progetto.manutenzione}
          onChange={(manutenzione) => void aggiornaProgetto(progetto.id, { manutenzione })}
        />
      </PannelloAnimato>

      <PannelloAnimato delay={0.24} className="space-y-4 p-5">
        <TitoloSezione>BOZZA 3D</TitoloSezione>
        {progetto.scena ? (
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm text-ghost">
              {AMBIENTI_3D[progetto.scena.ambiente].label} ·{" "}
              <span className="text-ice">{progetto.scena.oggetti.length} oggetti</span>
            </div>
            <Link to={`/progetti/${progetto.id}/bozza`}>
              <Btn variante="neon"><Boxes className="size-4" /> Apri editor 3D</Btn>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-xs text-ghost">Aggiungi uno spazio 3D al progetto:</div>
            <div className="flex flex-wrap gap-2">
              {ORDINE_AMBIENTI.map((a) => (
                <Chip key={a} onClick={() => aggiungiBozza(a)}>
                  + {AMBIENTI_3D[a].label}
                </Chip>
              ))}
            </div>
          </div>
        )}
      </PannelloAnimato>

      <div className="flex justify-end">
        {confermaElimina ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-danger">Eliminare definitivamente?</span>
            <Btn
              variante="danger"
              onClick={() => {
                void eliminaProgetto(progetto.id);
                navigate("/progetti");
              }}
            >
              Sì, elimina
            </Btn>
            <Btn onClick={() => setConfermaElimina(false)}>Annulla</Btn>
          </div>
        ) : (
          <Btn variante="danger" onClick={() => setConfermaElimina(true)}>
            <Trash2 className="size-4" /> Elimina progetto
          </Btn>
        )}
      </div>
    </div>
  );
}
