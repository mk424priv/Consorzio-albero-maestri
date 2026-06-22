import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useStore } from "@/store/store";
import { Layout } from "@/components/Layout";
import { Login } from "@/pages/Login";
import { Cruscotto } from "@/pages/Cruscotto";
import { Calendario } from "@/pages/Calendario";
import { Clienti } from "@/pages/Clienti";
import { ClienteDettaglio } from "@/pages/ClienteDettaglio";
import { ClienteNuovo, ClienteModifica } from "@/pages/ClienteForm";
import { Preventivi } from "@/pages/Preventivi";
import { Ore } from "@/pages/Ore";
import { Pagamenti } from "@/pages/Pagamenti";
import { Storico } from "@/pages/Storico";
import { Officina } from "@/pages/Officina";
import { Spese } from "@/pages/Spese";

function RichiedeAccesso({ children }: { children: ReactNode }) {
  const autenticato = useStore((s) => s.autenticato);
  const location = useLocation();
  if (!autenticato) return <Navigate to="/login" state={{ da: location.pathname }} replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RichiedeAccesso>
            <Layout />
          </RichiedeAccesso>
        }
      >
        <Route index element={<Cruscotto />} />
        <Route path="calendario" element={<Calendario />} />
        <Route path="clienti" element={<Clienti />} />
        <Route path="clienti/nuovo" element={<ClienteNuovo />} />
        <Route path="clienti/:id" element={<ClienteDettaglio />} />
        <Route path="clienti/:id/modifica" element={<ClienteModifica />} />
        <Route path="preventivi" element={<Preventivi />} />
        <Route path="ore" element={<Ore />} />
        <Route path="pagamenti" element={<Pagamenti />} />
        <Route path="storico" element={<Storico />} />
        <Route path="officina" element={<Officina />} />
        <Route path="spese" element={<Spese />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
