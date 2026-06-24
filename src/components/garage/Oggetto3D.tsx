import { useEffect, useRef } from "react";
import { Box, Camera, Cylinder, Mesh, Program, Renderer, Transform } from "ogl";
import type { CategoriaAttrezzo } from "@/lib/types";

// Forma 3D stilizzata per categoria (estetica, non un modello reale). WebGL via OGL.
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

export function Oggetto3D({ categoria, className, speed = 1 }: { categoria: CategoriaAttrezzo; className?: string; speed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let renderer: Renderer;
    try {
      renderer = new Renderer({ canvas, dpr: Math.min(2, window.devicePixelRatio || 1), alpha: true });
    } catch {
      return;
    }
    const gl = renderer.gl;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const camera = new Camera(gl, { fov: 32 });
    camera.position.set(2.6, 2.1, 3.6);
    camera.lookAt([0, -0.1, 0]);

    const program = new Program(gl, { vertex, fragment, uniforms: { uColor: { value: COLORE[categoria] ?? COLORE.manuale } } });
    const geometry =
      categoria === "motore"
        ? new Cylinder(gl, { radiusTop: 0.72, radiusBottom: 0.72, height: 1.35, radialSegments: 32 })
        : categoria === "auto"
          ? new Box(gl, { width: 1.9, height: 0.72, depth: 0.95 })
          : new Box(gl, { width: 1.15, height: 1.15, depth: 1.15 });
    const scene = new Transform();
    const mesh = new Mesh(gl, { geometry, program });
    mesh.setParent(scene);
    mesh.rotation.x = 0.32;

    const host = canvas.parentElement ?? canvas;
    const resize = () => {
      renderer.setSize(host.clientWidth || 1, host.clientHeight || 1);
      camera.perspective({ aspect: gl.canvas.width / Math.max(1, gl.canvas.height) });
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();
    requestAnimationFrame(resize);

    let raf = 0;
    let disposed = false;
    const loop = (t: number) => {
      if (disposed) return;
      mesh.rotation.y = reduce ? 0.7 : t * 0.0004 * speed;
      renderer.render({ scene, camera });
      if (!reduce) raf = requestAnimationFrame(loop);
    };
    if (reduce) loop(0);
    else raf = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (!import.meta.env.DEV) gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria]);

  return <canvas ref={ref} aria-hidden className={className ?? "absolute inset-0 h-full w-full"} />;
}
