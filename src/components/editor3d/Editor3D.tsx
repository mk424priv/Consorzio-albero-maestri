import { useCallback, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Grid, OrbitControls, TransformControls } from "@react-three/drei";
import type { Group } from "three";
import { clsx } from "clsx";
import { Copy, Move3D, Rotate3D, Scaling, Trash2 } from "lucide-react";
import { AMBIENTI_3D } from "@/lib/dominio";
import { nuovoId } from "@/lib/id";
import type { OggettoScena, Scena3D } from "@/lib/types";
import { CATALOGO, SUGGERITI } from "./catalogo";
import { Oggetto3D } from "./Oggetto3D";

type Modo = "translate" | "rotate" | "scale";

const COLORI = ["#8fa3b8", "#b08a5e", "#3f9e5f", "#7f8fb8", "#b8434e", "#96876e", "#e8ecf4", "#37d6f5"];

/** Pavimento + eventuali pareti dell'ambiente. */
function Spazio({ scena }: { scena: Scena3D }) {
  const { larghezza: L, profondita: P, altezza: H } = scena;
  const conPareti = H > 0;
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[L, P]} />
        <meshStandardMaterial
          color={scena.ambiente === "giardino" ? "#0d2418" : "#101820"}
          roughness={0.95}
        />
      </mesh>
      {conPareti && (
        <>
          {/* parete di fondo + laterali, semitrasparenti per non chiudere la vista */}
          <mesh position={[0, H / 2, -P / 2]}>
            <planeGeometry args={[L, H]} />
            <meshStandardMaterial color="#16222e" transparent opacity={0.35} />
          </mesh>
          <mesh position={[-L / 2, H / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[P, H]} />
            <meshStandardMaterial color="#16222e" transparent opacity={0.35} />
          </mesh>
        </>
      )}
    </>
  );
}

interface Props {
  scena: Scena3D;
  onChange: (scena: Scena3D) => void;
  className?: string;
}

/**
 * Editor 3D della bozza: aggiungi oggetti dal catalogo, selezionali col click,
 * spostali/ruotali/scalali col gizmo. Ogni modifica risale via onChange.
 */
export function Editor3D({ scena, onChange, className }: Props) {
  const [sel, setSel] = useState<{ id: string; gruppo: Group } | null>(null);
  const [modo, setModo] = useState<Modo>("translate");

  const selezionato = scena.oggetti.find((o) => o.id === sel?.id) ?? null;

  const aggiorna = useCallback(
    (id: string, patch: Partial<OggettoScena>) => {
      onChange({
        ...scena,
        oggetti: scena.oggetti.map((o) => (o.id === id ? { ...o, ...patch } : o)),
      });
    },
    [scena, onChange],
  );

  const aggiungi = (tipo: OggettoScena["tipo"]) => {
    const def = CATALOGO.find((d) => d.tipo === tipo)!;
    const nuovo: OggettoScena = {
      id: nuovoId(),
      tipo,
      nome: def.nome,
      // leggero sfalsamento per non impilare gli oggetti aggiunti in sequenza
      posizione: [(scena.oggetti.length % 5) * 0.6 - 1.2, 0, (scena.oggetti.length % 3) * 0.6 - 0.6],
      rotazioneY: 0,
      scala: [1, 1, 1],
      colore: def.colore,
    };
    onChange({ ...scena, oggetti: [...scena.oggetti, nuovo] });
    setSel(null);
  };

  const duplica = () => {
    if (!selezionato) return;
    const copia: OggettoScena = {
      ...selezionato,
      id: nuovoId(),
      posizione: [selezionato.posizione[0] + 0.8, selezionato.posizione[1], selezionato.posizione[2] + 0.8],
    };
    onChange({ ...scena, oggetti: [...scena.oggetti, copia] });
    setSel(null);
  };

  const elimina = () => {
    if (!sel) return;
    onChange({ ...scena, oggetti: scena.oggetti.filter((o) => o.id !== sel.id) });
    setSel(null);
  };

  // A fine trascinamento del gizmo, riporta la trasformazione nello stato.
  const commit = () => {
    if (!sel) return;
    const g = sel.gruppo;
    aggiorna(sel.id, {
      posizione: [g.position.x, Math.max(0, g.position.y), g.position.z],
      rotazioneY: g.rotation.y,
      scala: [g.scale.x, g.scale.y, g.scale.z],
    });
  };

  const tipiSuggeriti = SUGGERITI[scena.ambiente];
  const catalogoOrdinato = [...CATALOGO].sort(
    (a, b) =>
      (tipiSuggeriti.includes(a.tipo) ? tipiSuggeriti.indexOf(a.tipo) : 99) -
      (tipiSuggeriti.includes(b.tipo) ? tipiSuggeriti.indexOf(b.tipo) : 99),
  );

  return (
    <div className={clsx("relative overflow-hidden rounded-2xl border border-ice/10", className)}>
      <Canvas
        shadows
        camera={{ position: [7, 6, 9], fov: 45 }}
        onPointerMissed={() => setSel(null)}
        style={{ background: "var(--color-void)" }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[8, 12, 6]} intensity={1.4} castShadow />
        <directionalLight position={[-6, 8, -6]} intensity={0.3} color="#37d6f5" />

        <Grid
          infiniteGrid
          position={[0, 0, 0]}
          cellSize={1}
          sectionSize={5}
          cellColor="#12301f"
          sectionColor="#00b56f"
          fadeDistance={40}
          fadeStrength={2}
        />
        <Spazio scena={scena} />

        {scena.oggetti.map((o) => (
          <Oggetto3D
            key={o.id}
            oggetto={o}
            selezionato={o.id === sel?.id}
            onSelect={(id, gruppo) => setSel({ id, gruppo })}
          />
        ))}

        {sel && (
          <TransformControls
            object={sel.gruppo}
            mode={modo}
            showY={modo !== "rotate"}
            showX={modo !== "rotate"}
            showZ={modo !== "rotate"}
            onMouseUp={commit}
          />
        )}

        <OrbitControls makeDefault target={[0, 0.8, 0]} maxPolarAngle={Math.PI / 2.05} />
      </Canvas>

      {/* catalogo */}
      <div className="glass-strong absolute top-3 left-3 flex max-h-[70%] w-44 flex-col gap-1 overflow-y-auto rounded-xl p-2">
        <div className="px-1 pb-1 text-[10px] tracking-widest text-ghost">+ AGGIUNGI · {AMBIENTI_3D[scena.ambiente].label.toUpperCase()}</div>
        {catalogoOrdinato.map((d) => (
          <button
            key={d.tipo}
            onClick={() => aggiungi(d.tipo)}
            className={clsx(
              "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors",
              tipiSuggeriti.includes(d.tipo)
                ? "text-ice hover:bg-neon/10 hover:text-neon"
                : "text-ghost hover:bg-ice/5",
            )}
          >
            <span className="w-4 text-center text-neon-dim">{d.icona}</span>
            {d.nome}
          </button>
        ))}
      </div>

      {/* barra strumenti oggetto selezionato */}
      {selezionato && (
        <div className="glass-strong absolute top-3 right-3 flex flex-col gap-2 rounded-xl p-2">
          <div className="px-1 text-[10px] tracking-widest text-neon glow">{selezionato.nome.toUpperCase()}</div>
          <div className="flex gap-1">
            {(
              [
                ["translate", Move3D],
                ["rotate", Rotate3D],
                ["scale", Scaling],
              ] as const
            ).map(([m, Icona]) => (
              <button
                key={m}
                onClick={() => setModo(m)}
                title={m}
                className={clsx(
                  "cursor-pointer rounded-lg p-2 transition-colors",
                  modo === m ? "bg-neon/15 text-neon glow-ring" : "text-ghost hover:bg-ice/10 hover:text-ice",
                )}
              >
                <Icona className="size-4" />
              </button>
            ))}
            <button onClick={duplica} title="Duplica" className="cursor-pointer rounded-lg p-2 text-ghost transition-colors hover:bg-ice/10 hover:text-ice">
              <Copy className="size-4" />
            </button>
            <button onClick={elimina} title="Elimina" className="cursor-pointer rounded-lg p-2 text-danger transition-colors hover:bg-danger/15">
              <Trash2 className="size-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1 px-1">
            {COLORI.map((c) => (
              <button
                key={c}
                onClick={() => aggiorna(selezionato.id, { colore: c })}
                className={clsx(
                  "size-5 cursor-pointer rounded-full border transition-transform hover:scale-110",
                  selezionato.colore === c ? "border-neon" : "border-ice/20",
                )}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-lg bg-void/70 px-3 py-1 text-[10px] tracking-wider text-ghost backdrop-blur">
        CLICK: seleziona · TRASCINA gizmo: modifica · TASTO DX / DUE DITA: orbita
      </div>
    </div>
  );
}
