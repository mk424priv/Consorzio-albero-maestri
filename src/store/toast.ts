// Piccolo store per le notifiche "toast".
import { create } from "zustand";

export type TipoToast = "success" | "error" | "info";
export interface Toast {
  id: number;
  tipo: TipoToast;
  testo: string;
}

interface StatoToast {
  toasts: Toast[];
  mostra: (testo: string, tipo?: TipoToast) => void;
  chiudi: (id: number) => void;
}

let contatore = 0;

export const useToast = create<StatoToast>((set) => ({
  toasts: [],
  mostra: (testo, tipo = "success") => {
    const id = ++contatore;
    set((s) => ({ toasts: [...s.toasts, { id, tipo, testo }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3200);
  },
  chiudi: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
