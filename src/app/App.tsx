import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Agenda } from "@/pages/Agenda";
import { Anagrafiche } from "@/pages/Anagrafiche";
import { Cantiere } from "@/pages/Cantiere";
import { ClienteScheda } from "@/pages/ClienteScheda";
import { CreaLavoro } from "@/pages/CreaLavoro";
import { Dashboard } from "@/pages/Dashboard";
import { Kitchen } from "@/pages/Kitchen";
import { OperaioScheda } from "@/pages/OperaioScheda";
import { Soldi } from "@/pages/Soldi";
import { useStore } from "@/store/store";

function Splash() {
  return (
    <div className="grana flex min-h-dvh items-center justify-center">
      <p className="font-display text-2xl text-inchiostro-debole">Albero Maestri…</p>
    </div>
  );
}

export function App() {
  const carica = useStore((s) => s.carica);
  const pronto = useStore((s) => s.pronto);

  useEffect(() => {
    void carica();
  }, [carica]);

  return (
    <MotionConfig reducedMotion="user">
      {!pronto ? (
        <Splash />
      ) : (
        <BrowserRouter>
          <Routes>
            <Route path="/_kitchen" element={<Kitchen />} />
            <Route element={<Layout />}>
              <Route path="/" element={<Agenda />} />
              <Route path="/soldi" element={<Soldi />} />
              <Route path="/anagrafiche" element={<Anagrafiche />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/nuovo" element={<CreaLavoro />} />
              <Route path="/lavoro/:id" element={<Cantiere />} />
              <Route path="/cliente/:id" element={<ClienteScheda />} />
              <Route path="/operaio/:id" element={<OperaioScheda />} />
            </Route>
          </Routes>
        </BrowserRouter>
      )}
    </MotionConfig>
  );
}
