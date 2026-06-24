import { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Triangle, Vec3 } from "ogl";

/* Sfondo ambient WebGL: flusso "aurora" tra due colori del mondo (canone 04 §5).
   Lerp morbido verso i colori target al cambio sezione. Fallback: se WebGL
   manca o reduced-motion, il gradiente CSS dietro resta visibile. */

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
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  vec2 hash(vec2 p){
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }
  float noise(vec2 p){
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(dot(hash(i + vec2(0.0,0.0)), f - vec2(0.0,0.0)),
                   dot(hash(i + vec2(1.0,0.0)), f - vec2(1.0,0.0)), u.x),
               mix(dot(hash(i + vec2(0.0,1.0)), f - vec2(0.0,1.0)),
                   dot(hash(i + vec2(1.0,1.0)), f - vec2(1.0,1.0)), u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.0; a *= 0.5; }
    return v;
  }

  void main(){
    vec2 uv = vUv;
    vec2 p = uv * vec2(uRes.x / max(uRes.y, 1.0), 1.0) * 2.2;
    float t = uTime * 0.045;
    float n = fbm(p + vec2(t, t * 0.6) + fbm(p - t * 0.3));
    float g = smoothstep(0.0, 1.0, uv.y + n * 0.28);
    vec3 col = mix(uColorA, uColorB, g);
    float blob = fbm(p * 0.7 + t * 0.5);
    col += uColorB * 0.16 * smoothstep(0.45, 0.95, blob);
    float vig = smoothstep(1.25, 0.20, length(uv - 0.5));
    col *= mix(0.72, 1.12, vig);
    // overlay sottile: il gradiente CSS vivido sotto domina, lo shader aggiunge moto
    gl_FragColor = vec4(col, 0.4);
  }
`;

function hexToVec(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, "$1$1") : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function ShaderWorld({ colorA, colorB }: { colorA: string; colorB: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const target = useRef({ a: hexToVec(colorA), b: hexToVec(colorB) });

  useEffect(() => {
    target.current = { a: hexToVec(colorA), b: hexToVec(colorB) };
  }, [colorA, colorB]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: Renderer;
    try {
      renderer = new Renderer({ canvas, dpr: Math.min(1.5, window.devicePixelRatio || 1), alpha: true });
    } catch {
      return; // niente WebGL → resta il gradiente CSS dietro
    }
    const gl = renderer.gl;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cA = new Vec3(...target.current.a);
    const cB = new Vec3(...target.current.b);
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: { uTime: { value: 0 }, uRes: { value: [1, 1] }, uColorA: { value: cA }, uColorB: { value: cB } },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h); // OGL imposta sia il buffer sia lo stile px del canvas
      program.uniforms.uRes.value = [gl.canvas.width, gl.canvas.height];
    };
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);
    resize();
    // un secondo resize dopo il layout, per sicurezza (canvas appena montato)
    requestAnimationFrame(resize);

    let raf = 0;
    let disposed = false;
    const loop = (ms: number) => {
      if (disposed) return; // StrictMode: niente render dopo il cleanup (context perso)
      const k = 0.045;
      cA.x += (target.current.a[0] - cA.x) * k;
      cA.y += (target.current.a[1] - cA.y) * k;
      cA.z += (target.current.a[2] - cA.z) * k;
      cB.x += (target.current.b[0] - cB.x) * k;
      cB.y += (target.current.b[1] - cB.y) * k;
      cB.z += (target.current.b[2] - cB.z) * k;
      program.uniforms.uTime.value = reduce ? 0 : ms * 0.001;
      renderer.render({ scene: mesh });
      if (!reduce) raf = requestAnimationFrame(loop);
    };
    if (reduce) loop(0);
    else raf = requestAnimationFrame(loop);

    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduce) raf = requestAnimationFrame(loop);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      // NB: niente loseContext — in StrictMode (dev) il secondo mount riusa lo
      // stesso canvas/context. World resta montato per tutta la vita dell'app.
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />;
}
