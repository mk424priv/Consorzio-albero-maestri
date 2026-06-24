import { Banknote, CalendarClock, Check, Copy, Pencil, Scissors, Trash2, Undo2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { StornaFoglio } from "@/components/AzioniLavoro";
import { IncassaFoglio } from "@/components/IncassaFoglio";
import { ActionRow, type Azione, Button, Conferma, Foglio } from "@/components/ui";
import { formatEuro } from "@/lib/format";
import { calcoloLavoro } from "@/lib/lavoro-calc";
import type { Lavoro } from "@/lib/types";
import { notificaUndo } from "@/lib/undo";
import { duplicaLavoro, eliminaLavoro, riprogramma, segnaSvolto, spezzaLavoro } from "@/store/azioni";
import { useStore } from "@/store/store";

function Riga({ label, valore, forte }: { label: string; valore: string; forte?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-fumo">{label}</span>
      <span className={forte ? "font-mono text-sm font-bold tabular-nums text-bianco" : "font-mono text-xs tabular-nums text-fumo-2"}>{valore}</span>
    </div>
  );
}

/** Menu contestuale del lavoro: statistiche al volo + azioni rapide (canone 08 §4.1/4.5). */
export function MenuLavoro({ lavoro, open, onOpenChange }: { lavoro: Lavoro; open: boolean; onOpenChange: (o: boolean) => void }) {
  const dati = useStore((s) => s.dati);
  const navigate = useNavigate();
  const [incassa, setIncassa] = useState(false);
  const [storna, setStorna] = useState(false);
  const [elimina, setElimina] = useState(false);
  const calc = calcoloLavoro(dati, lavoro);
  const svolto = lavoro.fase === "fatto";
  const chiudi = () => onOpenChange(false);

  const azioni: Azione[] = [
    { icon: Pencil, label: "Modifica", onClick: () => { chiudi(); navigate("/nuovo", { state: { lavoroId: lavoro.id } }); } },
    svolto
      ? { icon: CalendarClock, label: "Riprogramma", onClick: async () => { chiudi(); notificaUndo("Riprogrammato", await riprogramma(lavoro.id)); } }
      : { icon: Check, label: "Svolto", onClick: async () => { chiudi(); notificaUndo("Segnato svolto", await segnaSvolto(lavoro.id)); } },
    { icon: Copy, label: "Duplica", onClick: async () => { chiudi(); const r = await duplicaLavoro(lavoro.id); if (r) { notificaUndo("Duplicato", r.annulla); navigate(`/lavoro/${r.id}`); } } },
    { icon: Trash2, label: "Archivia", onClick: () => setElimina(true) },
  ];

  return (
    <>
      <Foglio open={open} onOpenChange={onOpenChange} variante="dettaglio" titolo={lavoro.titolo}>
        <div className="mb-5 flex flex-col gap-1.5 rounded-vetro bg-superficie-bassa p-3.5">
          <Riga label="Lordo" valore={formatEuro(calc.lordo)} />
          <Riga label="Costo collaboratori" valore={formatEuro(calc.costoCollaboratori)} />
          <Riga label="Spese" valore={formatEuro(calc.speseTotali)} />
          <Riga label="Netto" valore={formatEuro(calc.netto)} forte />
          {svolto && <Riga label="Incassato" valore={formatEuro(calc.incassato)} />}
          {svolto && calc.daIncassare > 0 && <Riga label="Da incassare" valore={formatEuro(calc.daIncassare)} />}
        </div>

        <ActionRow azioni={azioni} />

        <div className="mt-5 flex flex-col gap-2">
          {svolto && calc.daIncassare > 0 && (
            <Button onClick={() => setIncassa(true)}><Banknote size={16} /> Incassa {formatEuro(calc.daIncassare)}</Button>
          )}
          {svolto && calc.incassato > 0 && (
            <Button variant="tenue" onClick={() => setStorna(true)}><Undo2 size={16} /> Storna incasso</Button>
          )}
          <Button variant="tenue" onClick={async () => { chiudi(); const r = await spezzaLavoro(lavoro.id); if (r) { notificaUndo("Lavoro spezzato", r.annulla); navigate(`/lavoro/${r.id}`); } }}>
            <Scissors size={16} /> Spezza (fatto + resto)
          </Button>
        </div>
      </Foglio>

      {svolto && (
        <IncassaFoglio open={incassa} onOpenChange={(o) => { setIncassa(o); if (!o) chiudi(); }} lavoroId={lavoro.id} daIncassare={calc.daIncassare} />
      )}
      {svolto && (
        <StornaFoglio open={storna} onOpenChange={(o) => { setStorna(o); if (!o) chiudi(); }} lavoroId={lavoro.id} incassato={calc.incassato} />
      )}
      <Conferma
        open={elimina}
        onOpenChange={setElimina}
        titolo="Archiviare il lavoro?"
        testo="Si ripristina subito dal messaggio o dal Cestino."
        etichettaConferma="Archivia"
        onConferma={() => void (async () => { setElimina(false); chiudi(); notificaUndo("Lavoro archiviato", await eliminaLavoro(lavoro.id)); })()}
      />
    </>
  );
}
