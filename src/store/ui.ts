// Store dell'interfaccia: fogli (sheet) globali, dialog di conferma,
// preferenza di vista. Permette di aprire una creazione/modifica da ovunque.

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SheetTipo =
  | "cliente"
  | "operatore"
  | "lavoro"
  | "preventivo"
  | "ore"
  | "spesa"
  | "incasso"
  | "riscuoti"
  | "compenso"
  | "attrezzo"
  | "crea"; // menù "Crea"

export interface SheetCtx {
  id?: string; // se presente → modifica
  clienteId?: string;
  operatoreId?: string;
  lavoroId?: string;
  pagamentoId?: string;
  data?: string;
}

export interface Conferma {
  titolo: string;
  descrizione?: string;
  testoConferma?: string;
  pericolo?: boolean;
  onConfirm: () => void;
}

interface StatoUI {
  sheet: { tipo: SheetTipo; ctx: SheetCtx; seq: number } | null;
  conferma: (Conferma & { id: number }) | null;
  vista: "carte" | "tabella";
  schedaLavoro: string | null; // id del lavoro aperto a tutto schermo

  apri: (tipo: SheetTipo, ctx?: SheetCtx) => void;
  chiudi: () => void;
  chiediConferma: (c: Conferma) => void;
  chiudiConferma: () => void;
  setVista: (v: "carte" | "tabella") => void;
  apriSchedaLavoro: (id: string) => void;
  chiudiSchedaLavoro: () => void;
}

let contatore = 0;
let seqSheet = 0;

export const useUI = create<StatoUI>()(
  persist(
    (set) => ({
      sheet: null,
      conferma: null,
      vista: "carte",
      schedaLavoro: null,
      apri: (tipo, ctx = {}) => set({ sheet: { tipo, ctx, seq: ++seqSheet } }),
      chiudi: () => set({ sheet: null }),
      chiediConferma: (c) => set({ conferma: { ...c, id: ++contatore } }),
      chiudiConferma: () => set({ conferma: null }),
      setVista: (vista) => set({ vista }),
      apriSchedaLavoro: (id) => set({ schedaLavoro: id }),
      chiudiSchedaLavoro: () => set({ schedaLavoro: null }),
    }),
    { name: "albero-maestri-ui", partialize: (s) => ({ vista: s.vista }) },
  ),
);
