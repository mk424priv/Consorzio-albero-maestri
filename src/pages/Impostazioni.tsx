import { ArrowLeft, Download, RotateCcw, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Intestazione } from "@/components/Intestazione";
import { Button, Card, Conferma } from "@/components/ui";
import { esportaJSON, importaJSON } from "@/lib/backup";
import { notificaUndo } from "@/lib/undo";
import { adessoISO, oggiISO } from "@/lib/format";
import { useStore } from "@/store/store";

export function Impostazioni() {
  const navigate = useNavigate();
  const dati = useStore((s) => s.dati);
  const importa = useStore((s) => s.importa);
  const reset = useStore((s) => s.reset);
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [confermaReset, setConfermaReset] = useState(false);

  const esporta = () => {
    const blob = new Blob([esportaJSON(dati)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `albero-maestri-${oggiISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg("Backup esportato.");
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const txt = await file.text();
      await importa(importaJSON(txt));
      setMsg("Dati importati.");
    } catch {
      setMsg("File di backup non valido.");
    }
    e.target.value = "";
  };

  const ricarica = async () => {
    const prima = dati; // snapshot per annullare
    await reset();
    notificaUndo("Dati d'esempio ricaricati", async () => { await importa(prima); });
    setMsg("Dati d'esempio ricaricati.");
  };

  return (
    <div className="flex flex-col gap-4 px-5 pt-5 pb-10">
      <Intestazione
        titolo="Impostazioni"
        sottotitolo="i tuoi dati vivono nel telefono"
        azione={
          <Button size="icona" variant="tenue" onClick={() => navigate(-1)} aria-label="Indietro">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        }
      />

      <Card tono="alta" className="flex flex-col gap-3 p-4">
        <h2 className="font-display text-lg text-bianco">Backup</h2>
        <p className="text-sm text-fumo-2">
          Un file = tutti i tuoi dati. Esporta per salvarli o spostarli su un altro telefono.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="ottone" onClick={esporta}>
            <Download className="h-4 w-4" /> Esporta
          </Button>
          <Button variant="tenue" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> Importa
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => void onFile(e)} />
        </div>
      </Card>

      <Card tono="alta" className="flex flex-col gap-3 p-4">
        <h2 className="font-display text-lg text-bianco">Dati d'esempio</h2>
        <p className="text-sm text-fumo-2">Ricarica i dati d'esempio. Sostituisce tutto quello che c'è ora.</p>
        <Button variant="fantasma" className="self-start" onClick={() => setConfermaReset(true)}>
          <RotateCcw className="h-4 w-4" /> Ricarica esempio
        </Button>
      </Card>

      <Conferma
        open={confermaReset}
        onOpenChange={setConfermaReset}
        titolo="Ricaricare i dati d'esempio?"
        testo="Sostituisce tutto quello che c'è ora. Si può annullare subito dopo."
        etichettaConferma="Sì, ricarica"
        onConferma={() => void ricarica()}
      />

      {msg && <p className="text-center text-sm text-verde">{msg}</p>}

      <p className="text-center font-mono text-[0.65rem] text-fumo-2">Albero Maestri · local-first · {adessoISO().slice(0, 10)}</p>
    </div>
  );
}
