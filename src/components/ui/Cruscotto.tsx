import type { ReactNode } from "react";
import { MeshStrip, type MeshTono } from "@/components/world/MeshStrip";

/*
  Cruscotto: blocco-testata "dashboard" riusabile (Agenda/Soldi/Dashboard).
  Tema Luce: card BIANCA elevata + un velo di mesh WebGL pastello (vivido ma soffuso) →
  contenuto a inchiostro scuro. Non usarlo dove non serve (Rubrica).
*/
export function Cruscotto({ titolo, controllo, mesh = "brand", children }: { titolo: string; controllo?: ReactNode; mesh?: MeshTono; children: ReactNode }) {
  return (
    <header className="px-4 pt-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{titolo}</h1>
        {controllo}
      </div>
      <div className="relative overflow-hidden rounded-bolla bg-superficie shadow-card">
        <div className="absolute inset-0 opacity-55">
          <MeshStrip tono={mesh} overlay={false} />
        </div>
        <div className="absolute inset-0 bg-white/45" />
        <div className="relative p-5">{children}</div>
      </div>
    </header>
  );
}
