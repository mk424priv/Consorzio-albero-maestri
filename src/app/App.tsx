import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Shell } from "@/components/Shell";
import { Bozze } from "@/pages/Bozze";
import { NuovaBozza } from "@/pages/NuovaBozza";
import { useStore } from "@/store/useStore";

// three.js pesa ~1MB: l'editor 3D si carica solo quando serve.
const Bozza3D = lazy(() =>
  import("@/pages/Bozza3D").then((m) => ({ default: m.Bozza3D })),
);

function Avvio() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="text-xs tracking-[0.4em] text-neon glow animate-pulse-neon">
        NEXUS // AVVIO…
      </div>
    </div>
  );
}

export default function App() {
  const pronto = useStore((s) => s.pronto);
  const idrata = useStore((s) => s.idrata);

  useEffect(() => {
    void idrata();
  }, [idrata]);

  if (!pronto) return <Avvio />;

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<Bozze />} />
          <Route path="/crea" element={<NuovaBozza />} />
          <Route
            path="/bozze/:id"
            element={
              <Suspense fallback={<Avvio />}>
                <Bozza3D />
              </Suspense>
            }
          />
          <Route path="*" element={<Bozze />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
