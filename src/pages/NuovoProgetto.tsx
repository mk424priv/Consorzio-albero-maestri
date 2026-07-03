import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Boxes, Rocket } from "lucide-react";
import { AMBIENTI_3D, ORDINE_AMBIENTI, ORDINE_TIPI, TIPI_PROGETTO } from "@/lib/dominio";
import type { Ambiente3D, Scena3D, TipoProgetto, VoceCosto } from "@/lib/types";
import { useStore } from "@/store/useStore";
import { CalcolatoreCosti } from "@/components/CalcolatoreCosti";
import { AreaTesto, Btn, Campo, Chip, PannelloAnimato, TitoloSezione } from "@/components/ui";

/** Sezione CREA: nuovo progetto con calcolo costi e bozza 3D opzionale. */
export function NuovoProgetto() {
  const navigate = useNavigate();
  const creaProgetto = useStore((s) => s.creaProgetto);

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoProgetto>("casa");
  const [descrizione, setDescrizione] = useState("");
  const [budget, setBudget] = useState("");
  const [voci, setVoci] = useState<VoceCosto[]>([]);
  const [con3D, setCon3D] = useState(false);
  const [ambiente, setAmbiente] = useState<Ambiente3D>("giardino");
  const [salvando, setSalvando] = useState(false);

  const valido = nome.trim().length > 0;

  const salva = async (apriBozza: boolean) => {
    if (!valido || salvando) return;
    setSalvando(true);
    const scena: Scena3D | null = con3D
      ? { ambiente, ...AMBIENTI_3D[ambiente], oggetti: [] }
      : null;
    const p = await creaProgetto({
      nome: nome.trim(),
      tipo,
      stato: "idea",
      descrizione: descrizione.trim(),
      budget: budget === "" ? null : Number(budget),
      costi: voci,
      scena,
      manutenzione: [],
    });
    navigate(apriBozza && scena ? `/progetti/${p.id}/bozza` : `/progetti/${p.id}`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xs tracking-widest text-ghost"
      >
        <span className="text-neon glow">&gt;</span> nexus --nuovo-progetto
        <span className="ml-1 inline-block h-3 w-2 animate-pulse-neon bg-neon align-middle" />
      </motion.div>

      <PannelloAnimato className="space-y-4 p-5">
        <TitoloSezione sub="Dai un nome alla missione e scegli il tipo.">IDENTITÀ</TitoloSezione>
        <Campo
          label="Nome progetto"
          placeholder="es. Restauro Fiat 500 del '68"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          autoFocus
        />
        <div>
          <span className="mb-1.5 block text-xs tracking-widest text-ghost uppercase">Tipo</span>
          <div className="flex flex-wrap gap-2">
            {ORDINE_TIPI.map((t) => (
              <Chip key={t} attivo={tipo === t} onClick={() => setTipo(t)}>
                {TIPI_PROGETTO[t].icona} {TIPI_PROGETTO[t].label}
              </Chip>
            ))}
          </div>
        </div>
        <AreaTesto
          label="Descrizione / obiettivo"
          placeholder="Cosa vuoi ottenere, vincoli, idee…"
          rows={3}
          value={descrizione}
          onChange={(e) => setDescrizione(e.target.value)}
        />
        <Campo
          label="Budget (€ — facoltativo)"
          type="number"
          min={0}
          step="any"
          placeholder="es. 2500"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
        />
      </PannelloAnimato>

      <PannelloAnimato delay={0.08} className="p-5">
        <TitoloSezione sub="Stima le voci: i totali si aggiornano in tempo reale.">
          CALCOLO COSTI
        </TitoloSezione>
        <CalcolatoreCosti
          voci={voci}
          budget={budget === "" ? null : Number(budget)}
          onChange={setVoci}
        />
      </PannelloAnimato>

      <PannelloAnimato delay={0.16} className="space-y-4 p-5">
        <TitoloSezione sub="Disegna lo spazio e posiziona gli oggetti in anteprima.">
          BOZZA 3D
        </TitoloSezione>
        <div className="flex flex-wrap items-center gap-2">
          <Chip attivo={!con3D} onClick={() => setCon3D(false)}>Senza bozza</Chip>
          <Chip attivo={con3D} onClick={() => setCon3D(true)}>
            <Boxes className="mr-1 inline size-3.5" /> Con bozza 3D
          </Chip>
        </div>
        {con3D && (
          <div>
            <span className="mb-1.5 block text-xs tracking-widest text-ghost uppercase">Ambiente</span>
            <div className="flex flex-wrap gap-2">
              {ORDINE_AMBIENTI.map((a) => (
                <Chip key={a} attivo={ambiente === a} onClick={() => setAmbiente(a)}>
                  {AMBIENTI_3D[a].label}
                  <span className="ml-1 text-faint">
                    {AMBIENTI_3D[a].larghezza}×{AMBIENTI_3D[a].profondita}m
                  </span>
                </Chip>
              ))}
            </div>
          </div>
        )}
      </PannelloAnimato>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24 }}
        className="flex flex-wrap gap-3"
      >
        <Btn variante="neon" disabled={!valido || salvando} onClick={() => salva(false)} className="px-6 py-3">
          <Rocket className="size-4" /> AVVIA PROGETTO
        </Btn>
        {con3D && (
          <Btn disabled={!valido || salvando} onClick={() => salva(true)} className="px-6 py-3">
            <Boxes className="size-4" /> Avvia e apri la bozza 3D
          </Btn>
        )}
      </motion.div>
    </div>
  );
}
