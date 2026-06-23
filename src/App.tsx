import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useStore } from "@/store/store";
import { AppShell } from "@/components/Shell";
import { Login } from "@/pages/Login";
import { Records } from "@/pages/Records";
import { Dashboard } from "@/pages/Dashboard";
import { Anagrafiche } from "@/pages/Anagrafiche";
import { ClienteScheda } from "@/pages/ClienteScheda";
import { OperatoreScheda } from "@/pages/OperatoreScheda";
import { Agenda } from "@/pages/Agenda";

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
        <Route index element={<Records />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="anagrafiche" element={<Anagrafiche />} />
        <Route path="cliente/:id" element={<ClienteScheda />} />
        <Route path="operatore/:id" element={<OperatoreScheda />} />
        <Route path="agenda" element={<Agenda />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
