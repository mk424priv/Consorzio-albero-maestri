import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Boxes } from "lucide-react";
import { AMBIENTI_3D, ORDINE_AMBIENTI } from "@/lib/dominio";
import type { Ambiente3D } from "@/lib/types";
import { useStore } from "@/store/useStore";
import { Btn, Campo, Chip, PannelloAnimato, TitoloSezione } from "@/components/ui";

/** Sezione CREA: nuova bozza 3D — nome + ambiente, poi si apre subito l'editor. */
export function NuovaBozza() {
  const navigate = useNavigate();
  const creaBozza = useStore((s) => s.creaBozza);

  const [nome, setNome] = useState("");
  const [ambiente, setAmbiente] = useState<Ambiente3D>("giardino");
  const [salvando, setSalvando] = useState(false);

  const valido = nome.trim().length > 0;

  const salva = async () => {
    if (!valido || salvando) return;
    setSalvando(true);
    const b = await creaBozza({
      nome: nome.trim(),
      scena: { ambiente, ...AMBIENTI_3D[ambiente], oggetti: [] },
    });
    navigate(`/bozze/${b.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xs tracking-widest text-ghost"
      >
        <span className="text-neon glow">&gt;</span> nexus --nuova-bozza
        <span className="ml-1 inline-block h-3 w-2 animate-pulse-neon bg-neon align-middle" />
      </motion.div>

      <PannelloAnimato className="space-y-4 p-5">
        <TitoloSezione sub="Dai un nome allo spazio e scegli l'ambiente.">IDENTITÀ</TitoloSezione>
        <Campo
          label="Nome bozza"
          placeholder="es. Giardino con capanna"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          autoFocus
        />
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
      </PannelloAnimato>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        <Btn variante="neon" disabled={!valido || salvando} onClick={() => void salva()} className="px-6 py-3">
          <Boxes className="size-4" /> Apri editor 3D
        </Btn>
      </motion.div>
    </div>
  );
}
