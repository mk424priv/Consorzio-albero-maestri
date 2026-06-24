import { useEffect, useRef } from "react";
import { Camera, GLTFLoader, type Mesh, Program, Renderer, Transform, Vec3 } from "ogl";
import { urlModello } from "@/lib/catalogo-modelli";
import { CATEGORIA_DI_MODELLO } from "@/lib/modelli-3d";
import type { CategoriaAttrezzo } from "@/lib/types";

// Visualizzatore di un modello 3D reale (GLB) caricato via OGL GLTFLoader e fatto ruotare.
// Le mesh del modello vengono ri-programmate con lo stesso shader diffuse+rim di Oggetto3D
// (tono per categoria) per coerenza estetica "Quaderno di bottega". Vedi canone/10.
const COLORE: Record<CategoriaAttrezzo, [number, number, number]> = {
  auto: [0.23, 0.43, 0.96],
  motore: [0.96, 0.36, 0.2],
  elettrico: [0.1, 0.71, 0.45],
  manuale: [0.42, 0.36, 0.85],
};

const vertex = /* glsl */ `
  attribute vec3 position;
  attribute vec3 normal;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform mat3 normalMatrix;
  varying vec3 vN;
  void main() {
    vN = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragment = /* glsl */ `
  precision highp float;
  varying vec3 vN;
  uniform vec3 uColor;
  void main() {
    vec3 L = normalize(vec3(0.5, 0.85, 0.65));
    float d = clamp(dot(normalize(vN), L), 0.0, 1.0);
    vec3 col = uColor * (0.4 + 0.7 * d);
    col += pow(1.0 - d, 2.0) * 0.14; // rim soffuso
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function Modello3D({ modelKey, className, speed = 1 }: { modelKey: string; className?: string; speed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let renderer: Renderer;
    try {
      renderer = new Renderer({ canvas, dpr: Math.min(2, window.devicePixelRatio || 1), alpha: true });
    } catch {
      return; // WebGL non disponibile: il chiamante mostra comunque il fallback altrove
    }
    const gl = renderer.gl;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const camera = new Camera(gl, { fov: 32 });
    camera.position.set(2.8, 2.0, 3.9);
    camera.lookAt([0, 0, 0]);

    const scene = new Transform();
    const categoria = CATEGORIA_DI_MODELLO[modelKey] ?? "manuale";
    // doppia faccia (cullFace null): i modelli low-poly hanno spesso winding incoerente.
    const program = new Program(gl, { vertex, fragment, uniforms: { uColor: { value: [...COLORE[categoria]] } }, cullFace: null });

    let holder: Transform | null = null;
    let disposed = false;
    let raf = 0;

    const host = canvas.parentElement ?? canvas;
    const resize = () => {
      renderer.setSize(host.clientWidth || 1, host.clientHeight || 1);
      camera.perspective({ aspect: gl.canvas.width / Math.max(1, gl.canvas.height) });
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();
    requestAnimationFrame(resize);

    GLTFLoader.load(gl, urlModello(modelKey))
      .then((gltf) => {
        if (disposed) return;
        const model = new Transform();
        for (const node of gltf.scene ?? []) node.setParent(model);
        model.updateMatrixWorld();

        // AABB in spazio-modello + uniforma lo shader su tutte le mesh
        const min = new Vec3(Infinity, Infinity, Infinity);
        const max = new Vec3(-Infinity, -Infinity, -Infinity);
        const v = new Vec3();
        model.traverse((node) => {
          const mesh = node as Mesh;
          if (!mesh.geometry) return;
          mesh.program = program;
          if (!mesh.geometry.bounds) mesh.geometry.computeBoundingBox();
          const b = mesh.geometry.bounds;
          for (let xi = 0; xi < 2; xi++)
            for (let yi = 0; yi < 2; yi++)
              for (let zi = 0; zi < 2; zi++) {
                v.set(xi ? b.max.x : b.min.x, yi ? b.max.y : b.min.y, zi ? b.max.z : b.min.z);
                v.applyMatrix4(mesh.worldMatrix);
                min.x = Math.min(min.x, v.x); min.y = Math.min(min.y, v.y); min.z = Math.min(min.z, v.z);
                max.x = Math.max(max.x, v.x); max.y = Math.max(max.y, v.y); max.z = Math.max(max.z, v.z);
              }
        });

        const cx = (min.x + max.x) / 2, cy = (min.y + max.y) / 2, cz = (min.z + max.z) / 2;
        const dim = Math.max(max.x - min.x, max.y - min.y, max.z - min.z) || 1;
        model.position.set(-cx, -cy, -cz); // centra la geometria sull'origine (unità locali)

        holder = new Transform();
        const s = 1.9 / dim; // normalizza tutti i modelli a ~1.9 unità
        holder.scale.set(s, s, s);
        holder.rotation.x = 0.12;
        model.setParent(holder);
        holder.setParent(scene);
      })
      .catch(() => { /* file mancante/parse KO: scena vuota, nessun crash */ });

    const loop = (t: number) => {
      if (disposed) return;
      if (holder && !reduce) holder.rotation.y = t * 0.0004 * speed;
      renderer.render({ scene, camera });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (!import.meta.env.DEV) gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [modelKey, speed]);

  return <canvas ref={ref} aria-hidden className={className ?? "absolute inset-0 h-full w-full"} />;
}
