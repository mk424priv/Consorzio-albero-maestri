import { forwardRef } from "react";
import type { Group } from "three";
import type { ThreeEvent } from "@react-three/fiber";
import type { OggettoScena, TipoOggetto3D } from "@/lib/types";

const LEGNO_SCURO = "#5a4330";

function Mat({ colore, sel }: { colore: string; sel: boolean }) {
  return (
    <meshStandardMaterial
      color={colore}
      roughness={0.65}
      metalness={0.08}
      emissive={sel ? "#00ff9c" : "#000000"}
      emissiveIntensity={sel ? 0.3 : 0}
    />
  );
}

/** Geometrie parametriche per tipo (misure ~ metri, appoggiate a y=0). */
function Forma({ tipo, colore, sel }: { tipo: TipoOggetto3D; colore: string; sel: boolean }) {
  switch (tipo) {
    case "box":
      return (
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <Mat colore={colore} sel={sel} />
        </mesh>
      );
    case "capanna":
      return (
        <>
          <mesh position={[0, 1.1, 0]} castShadow>
            <boxGeometry args={[3, 2.2, 2.5]} />
            <Mat colore={colore} sel={sel} />
          </mesh>
          <mesh position={[0, 2.8, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[2.35, 1.2, 4]} />
            <Mat colore={LEGNO_SCURO} sel={sel} />
          </mesh>
        </>
      );
    case "albero":
      return (
        <>
          <mesh position={[0, 0.6, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.2, 1.2, 8]} />
            <Mat colore={LEGNO_SCURO} sel={sel} />
          </mesh>
          <mesh position={[0, 2, 0]} castShadow>
            <coneGeometry args={[0.95, 1.9, 8]} />
            <Mat colore={colore} sel={sel} />
          </mesh>
        </>
      );
    case "pianta":
      return (
        <>
          <mesh position={[0, 0.15, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.17, 0.3, 10]} />
            <Mat colore="#8a5a3b" sel={sel} />
          </mesh>
          <mesh position={[0, 0.62, 0]} castShadow>
            <sphereGeometry args={[0.34, 12, 10]} />
            <Mat colore={colore} sel={sel} />
          </mesh>
        </>
      );
    case "tavolo":
      return (
        <>
          <mesh position={[0, 0.73, 0]} castShadow>
            <boxGeometry args={[1.6, 0.06, 0.9]} />
            <Mat colore={colore} sel={sel} />
          </mesh>
          {[[-0.72, -0.38], [0.72, -0.38], [-0.72, 0.38], [0.72, 0.38]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.35, z]} castShadow>
              <boxGeometry args={[0.06, 0.7, 0.06]} />
              <Mat colore={colore} sel={sel} />
            </mesh>
          ))}
        </>
      );
    case "sedia":
      return (
        <>
          <mesh position={[0, 0.45, 0]} castShadow>
            <boxGeometry args={[0.45, 0.05, 0.45]} />
            <Mat colore={colore} sel={sel} />
          </mesh>
          <mesh position={[0, 0.75, -0.2]} castShadow>
            <boxGeometry args={[0.45, 0.6, 0.05]} />
            <Mat colore={colore} sel={sel} />
          </mesh>
          {[[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.21, z]} castShadow>
              <boxGeometry args={[0.05, 0.42, 0.05]} />
              <Mat colore={colore} sel={sel} />
            </mesh>
          ))}
        </>
      );
    case "armadio":
      return (
        <mesh position={[0, 1, 0]} castShadow>
          <boxGeometry args={[1.2, 2, 0.6]} />
          <Mat colore={colore} sel={sel} />
        </mesh>
      );
    case "letto":
      return (
        <>
          <mesh position={[0, 0.18, 0]} castShadow>
            <boxGeometry args={[1.7, 0.36, 2.05]} />
            <Mat colore={LEGNO_SCURO} sel={sel} />
          </mesh>
          <mesh position={[0, 0.44, 0]} castShadow>
            <boxGeometry args={[1.6, 0.18, 1.95]} />
            <Mat colore={colore} sel={sel} />
          </mesh>
          <mesh position={[0, 0.58, -0.75]} castShadow>
            <boxGeometry args={[1.3, 0.12, 0.4]} />
            <Mat colore="#e8ecf4" sel={sel} />
          </mesh>
        </>
      );
    case "divano":
      return (
        <>
          <mesh position={[0, 0.28, 0]} castShadow>
            <boxGeometry args={[2, 0.5, 0.9]} />
            <Mat colore={colore} sel={sel} />
          </mesh>
          <mesh position={[0, 0.72, -0.35]} castShadow>
            <boxGeometry args={[2, 0.55, 0.22]} />
            <Mat colore={colore} sel={sel} />
          </mesh>
          {[-0.95, 0.95].map((x) => (
            <mesh key={x} position={[x, 0.55, 0]} castShadow>
              <boxGeometry args={[0.16, 0.5, 0.9]} />
              <Mat colore={colore} sel={sel} />
            </mesh>
          ))}
        </>
      );
    case "cucina":
      return (
        <>
          <mesh position={[0, 0.45, 0]} castShadow>
            <boxGeometry args={[1.8, 0.9, 0.62]} />
            <Mat colore={colore} sel={sel} />
          </mesh>
          <mesh position={[0, 0.925, 0]} castShadow>
            <boxGeometry args={[1.84, 0.05, 0.66]} />
            <Mat colore="#3a4552" sel={sel} />
          </mesh>
        </>
      );
    case "auto":
      return (
        <>
          <mesh position={[0, 0.62, 0]} castShadow>
            <boxGeometry args={[1.8, 0.55, 4]} />
            <Mat colore={colore} sel={sel} />
          </mesh>
          <mesh position={[0, 1.12, -0.2]} castShadow>
            <boxGeometry args={[1.65, 0.5, 2]} />
            <Mat colore={colore} sel={sel} />
          </mesh>
          {[[-0.85, 1.25], [0.85, 1.25], [-0.85, -1.25], [0.85, -1.25]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.35, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.35, 0.35, 0.25, 16]} />
              <Mat colore="#1c232c" sel={sel} />
            </mesh>
          ))}
        </>
      );
  }
}

interface Props {
  oggetto: OggettoScena;
  selezionato: boolean;
  onSelect: (id: string, gruppo: Group) => void;
}

/** Un oggetto della scena: gruppo posizionabile, selezione al click. */
export const Oggetto3D = forwardRef<Group, Props>(function Oggetto3D(
  { oggetto, selezionato, onSelect },
  ref,
) {
  return (
    <group
      ref={ref}
      position={oggetto.posizione}
      rotation-y={oggetto.rotazioneY}
      scale={oggetto.scala}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onSelect(oggetto.id, e.eventObject as Group);
      }}
    >
      <Forma tipo={oggetto.tipo} colore={oggetto.colore} sel={selezionato} />
    </group>
  );
});
