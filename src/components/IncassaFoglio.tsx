import { useState } from "react";
import { Button, Field, Foglio } from "@/components/ui";
import { formatEuro } from "@/lib/format";
import { notificaUndo } from "@/lib/undo";
import { incassaLavoro } from "@/store/azioni";

/** Foglio d'incasso riusabile (Cantiere, menu lavoro): tutto o parziale. */
export function IncassaFoglio({
  open,
  onOpenChange,
  lavoroId,
  daIncassare,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lavoroId: string;
  daIncassare: number;
}) {
  const [altro, setAltro] = useState("");
  const v = Number(altro.replace(",", "."));

  const incassa = async (importo: number) => {
    if (!(importo > 0)) return;
    const a = await incassaLavoro(lavoroId, importo);
    setAltro("");
    onOpenChange(false);
    notificaUndo(`Incassato ${formatEuro(importo)}`, a);
  };

  return (
    <Foglio open={open} onOpenChange={onOpenChange} variante="azione-incasso" titolo="Incassa">
      <p className="mb-4 text-sm text-fumo">
        Da incassare: <span className="font-semibold text-verde">{formatEuro(daIncassare)}</span>
      </p>
      <div className="flex flex-col gap-3">
        <Button size="lg" onClick={() => void incassa(daIncassare)} disabled={!(daIncassare > 0)}>
          Incassa tutto {formatEuro(daIncassare)}
        </Button>
        <Field
          label="Importo parziale"
          value={altro}
          onChange={(e) => setAltro(e.target.value.replace(/[^0-9.,]/g, ""))}
          suffix="€"
          inputMode="decimal"
          placeholder="0,00"
        />
        <Button variant="inchiostro" onClick={() => void incassa(v)} disabled={!(v > 0)}>
          Incassa {v > 0 ? formatEuro(v) : ""}
        </Button>
      </div>
    </Foglio>
  );
}
