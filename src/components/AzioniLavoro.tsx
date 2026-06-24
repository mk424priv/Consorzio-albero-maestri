import { useState } from "react";
import { Button, Field, Foglio } from "@/components/ui";
import { formatEuro } from "@/lib/format";
import type { Lavoro } from "@/lib/types";
import { notificaUndo } from "@/lib/undo";
import { convertiSvolto, stornaIncasso } from "@/store/azioni";

/** Storno incasso (reso/errore): riduce l'incassato. (08 §5.2) */
export function StornaFoglio({ open, onOpenChange, lavoroId, incassato }: { open: boolean; onOpenChange: (o: boolean) => void; lavoroId: string; incassato: number }) {
  const [importo, setImporto] = useState("");
  const v = importo ? Number(importo.replace(",", ".")) : incassato;
  const conferma = async () => {
    if (!(v > 0)) return;
    const a = await stornaIncasso(lavoroId, v);
    setImporto("");
    onOpenChange(false);
    notificaUndo(`Stornato ${formatEuro(v)}`, a);
  };
  return (
    <Foglio open={open} onOpenChange={onOpenChange} variante="pericolo" titolo="Storna incasso">
      <p className="mb-4 text-sm text-fumo">Riduci l'incassato (reso o errore). Attuale: <span className="text-bianco">{formatEuro(incassato)}</span>.</p>
      <div className="flex flex-col gap-3">
        <Field label="Importo da stornare" value={importo} onChange={(e) => setImporto(e.target.value.replace(/[^0-9.,]/g, ""))} suffix="€" inputMode="decimal" placeholder={String(incassato)} />
        <Button size="lg" variant="critico" onClick={() => void conferma()} disabled={!(v > 0)}>Storna {formatEuro(v)}</Button>
      </div>
    </Foglio>
  );
}

/** Conversione programmato → svolto chiedendo le ore reali (o il prezzo). (08 §5.3) */
export function ConvertiFoglio({ open, onOpenChange, lavoro }: { open: boolean; onOpenChange: (o: boolean) => void; lavoro: Lavoro }) {
  const isPreventivo = lavoro.modo === "preventivo";
  const [ore, setOre] = useState("");
  const [prezzo, setPrezzo] = useState(lavoro.prezzo != null ? String(lavoro.prezzo) : "");
  const conferma = async () => {
    const o = ore ? Number(ore.replace(",", ".")) : undefined;
    const p = prezzo ? Number(prezzo.replace(",", ".")) : undefined;
    const a = await convertiSvolto(lavoro.id, o, p);
    onOpenChange(false);
    notificaUndo("Segnato svolto", a);
  };
  return (
    <Foglio open={open} onOpenChange={onOpenChange} variante="dettaglio" titolo="Segna come svolto">
      <p className="mb-4 text-sm text-fumo">{isPreventivo ? "Conferma il prezzo concordato." : "Quante ore ci hai messo? (le tue)"}</p>
      <div className="flex flex-col gap-3">
        {isPreventivo ? (
          <Field label="Prezzo" value={prezzo} onChange={(e) => setPrezzo(e.target.value.replace(/[^0-9.,]/g, ""))} suffix="€" inputMode="decimal" />
        ) : (
          <Field label="Ore (le tue)" value={ore} onChange={(e) => setOre(e.target.value.replace(/[^0-9.,]/g, ""))} suffix="h" inputMode="decimal" placeholder="0" />
        )}
        <Button size="lg" onClick={() => void conferma()}>Segna svolto</Button>
      </div>
    </Foglio>
  );
}
