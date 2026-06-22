import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useStore } from "@/store/store";
import { AppShell } from "@/components/Shell";
import { Login } from "@/pages/Login";
import { Spazio } from "@/pages/Spazio";
import { ClienteScheda } from "@/pages/ClienteScheda";
import { Squadra } from "@/pages/Squadra";
import { OperatoreScheda } from "@/pages/OperatoreScheda";
import { Soldi } from "@/pages/Soldi";
import { Agenda } from "@/pages/Agenda";
import { Admin } from "@/pages/Admin";

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
      <Route element={<RichiedeAccesso><AppShell /></RichiedeAccesso>}>
        <Route index element={<Spazio />} />
        <Route path="cliente/:id" element={<ClienteScheda />} />
        <Route path="squadra" element={<Squadra />} />
        <Route path="operatore/:id" element={<OperatoreScheda />} />
        <Route path="soldi" element={<Soldi />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
