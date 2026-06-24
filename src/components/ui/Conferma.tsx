import { ShieldAlert } from "lucide-react";
import { Button } from "./Button";
import { Foglio } from "./Foglio";

/** Conferma riusabile per azioni irreversibili (sheet `pericolo`). */
export function Conferma({
  open,
  onOpenChange,
  titolo,
  testo,
  etichettaConferma = "Conferma",
  onConferma,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  titolo: string;
  testo?: string;
  etichettaConferma?: string;
  onConferma: () => void;
}) {
  return (
    <Foglio open={open} onOpenChange={onOpenChange} variante="pericolo" titolo={titolo}>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rosso/10 text-rosso">
          <ShieldAlert size={30} />
        </div>
        {testo && <p className="leading-relaxed text-fumo">{testo}</p>}
        <div className="flex w-full flex-col gap-2">
          <Button size="lg" variant="critico" className="bg-rosso text-white hover:bg-rosso/90" onClick={() => { onConferma(); onOpenChange(false); }}>
            {etichettaConferma}
          </Button>
          <Button size="lg" variant="fantasma" onClick={() => onOpenChange(false)}>Annulla</Button>
        </div>
      </div>
    </Foglio>
  );
}
