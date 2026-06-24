import { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";

/*
  Mesh-gradient animato (metaball): blob di colore che fluiscono e si fondono.
  Riempie il proprio contenitore (parent relativo). Usato come fill premium su
  hero card. Fallback: se WebGL manca, resta lo sfondo del parent.
*/

const vertex = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uRes;
  uniform vec3 uC1;
  uniform vec3 uC2;
  uniform vec3 uC3;
  uniform vec3 uC4;

  void main(){
    vec2 p = (vUv - 0.5) * vec2(uRes.x / max(uRes.y, 1.0), 1.0);
    float t = uTime * 0.16;
    vec2 b1 = vec2(sin(t * 0.7), cos(t * 0.5)) * 0.42;
    vec2 b2 = vec2(cos(t * 0.4 + 1.0), sin(t * 0.6)) * 0.46;
    vec2 b3 = vec2(sin(t * 0.5 + 2.0), cos(t * 0.75 + 1.0)) * 0.40;
    vec2 b4 = vec2(cos(t * 0.6 + 3.0), sin(t * 0.45 + 2.0)) * 0.50;
    float w1 = 1.0 / (0.03 + dot(p - b1, p - b1));
    float w2 = 1.0 / (0.03 + dot(p - b2, p - b2));
    float w3 = 1.0 / (0.03 + dot(p - b3, p - b3));
    float w4 = 1.0 / (0.03 + dot(p - b4, p - b4));
    float ws = w1 + w2 + w3 + w4;
    vec3 col = (uC1 * w1 + uC2 * w2 + uC3 * w3 + uC4 * w4) / ws;
    // leggera grana di luce
    col += 0.04 * sin((vUv.x + vUv.y) * 40.0 + uTime);
    gl_FragColor = vec4(col, 1.0);
  }
`;

function hexVec(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, "$1$1") : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export interface MeshGradientProps {
  colors?: [string, string, string, string];
  className?: string;
  speed?: number;
}

const DEFAULT: [string, string, string, string] = ["#0a58ff", "#00d15e", "#4b0082", "#ff3b30"];

export function MeshGradient({ colors = DEFAULT, className, speed = 1 }: MeshGradientProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: Renderer;
    try {
      renderer = new Renderer({ canvas, dpr: Math.min(1.5, window.devicePixelRatio || 1), alpha: false });
    } catch {
      return;
    }
    const gl = renderer.gl;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const [c1, c2, c3, c4] = colors.map(hexVec);
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uRes: { value: [1, 1] },
        uC1: { value: c1 },
        uC2: { value: c2 },
        uC3: { value: c3 },
        uC4: { value: c4 },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    // misuro il PARENT (dimensione stabile); il canvas è absolute inset-0 dentro di esso
    const host = canvas.parentElement ?? canvas;
    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h);
      program.uniforms.uRes.value = [gl.canvas.width, gl.canvas.height];
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();
    requestAnimationFrame(resize);

    let raf = 0;
    let disposed = false;
    const loop = (ms: number) => {
      if (disposed) return;
      program.uniforms.uTime.value = (reduce ? 0 : ms * 0.001) * speed;
      renderer.render({ scene: mesh });
      if (!reduce) raf = requestAnimationFrame(loop);
    };
    if (reduce) loop(0);
    else raf = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      // libera il context su unmount reale (prod). In dev lo StrictMode rimonta lo
      // stesso canvas: perdere il context lì lo romperebbe → si salta.
      if (!import.meta.env.DEV) gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={className ?? "absolute inset-0 h-full w-full"} />;
}
