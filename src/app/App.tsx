import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Shell } from "@/components/Shell";
import { Dashboard } from "@/pages/Dashboard";
import { Progetti } from "@/pages/Progetti";
import { NuovoProgetto } from "@/pages/NuovoProgetto";
import { DettaglioProgetto } from "@/pages/DettaglioProgetto";
import { Bozze } from "@/pages/Bozze";
import { Integrazioni, ModuloIncorporato } from "@/pages/Integrazioni";
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
          <Route path="/" element={<Dashboard />} />
          <Route path="/progetti" element={<Progetti />} />
          <Route path="/progetti/:id" element={<DettaglioProgetto />} />
          <Route
            path="/progetti/:id/bozza"
            element={
              <Suspense fallback={<Avvio />}>
                <Bozza3D />
              </Suspense>
            }
          />
          <Route path="/crea" element={<NuovoProgetto />} />
          <Route path="/bozze" element={<Bozze />} />
          <Route path="/integrazioni" element={<Integrazioni />} />
          <Route path="/integrazioni/:id" element={<ModuloIncorporato />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
