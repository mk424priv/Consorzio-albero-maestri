import { toast } from "sonner";
import type { Annulla } from "@/store/azioni";

/** Toast di conferma con bottone "Annulla" che esegue l'undo. Nessun vicolo cieco. */
export function notificaUndo(messaggio: string, annulla: Annulla) {
  toast.success(messaggio, {
    action: { label: "Annulla", onClick: () => void annulla() },
    duration: 6000,
  });
}
