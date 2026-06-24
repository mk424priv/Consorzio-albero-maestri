import { ArrowLeft, X } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Intestazione } from "@/components/Intestazione";
import { Button, CampoFacolt, Segmented } from "@/components/ui";
import { oggiISO } from "@/lib/format";
import { nuovoId } from "@/lib/id";
import type { Appuntamento } from "@/lib/types";
import { useStore } from "@/store/store";

export function NuovoAppuntamento() {
  const navigate = useNavigate();
  const location = useLocation();
  const salva = useStore((s) => s.salva);
  const dati = useStore((s) => s.dati);

  const st = (location.state ?? {}) as { data?: string; tipo?: "appuntamento" | "promemoria" };
  const [tipo, setTipo] = useState<"appuntamento" | "promemoria">(st.tipo ?? "appuntamento");
  const [titolo, setTitolo] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [data, setData] = useState(st.data ?? oggiISO());
  const [oraInizio, setOraInizio] = useState("");
  const [oraFine, setOraFine] = useState("");
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [usaPeriodo, setUsaPeriodo] = useState(false);
  const [periodoAl, setPeriodoAl] = useState(st.data ?? oggiISO());
  const [errore, setErrore] = useState<string | null>(null);

  const clientiAttivi = dati.clienti.filter((c) => !c.deleted);

  const crea = async () => {
    if (!titolo.trim()) { setErrore("Inserisci un titolo"); return; }
    if (usaPeriodo && periodoAl < data) { setErrore("La data di fine deve essere dopo quella di inizio"); return; }
    const app: Appuntamento = {
      id: nuovoId(),
      tipo,
      titolo: titolo.trim(),
      descrizione: descrizione.trim() || undefined,
      clienteId: clienteId ?? undefined,
      data,
      oraInizio: oraInizio || undefined,
      oraFine: oraFine || undefined,
      periodo: usaPeriodo ? { dal: data, al: periodoAl } : null,
      completato: false,
      creatoIl: oggiISO(),
      updatedAt: "",
    };
    await salva("appuntamenti", app);
    navigate(-1);
  };

  return (
    <div className="flex flex-col gap-3 px-5 pt-4 pb-3">
      <Intestazione
        titolo="Nuovo appuntamento"
        azione={
          <Button size="icona" variant="tenue" onClick={() => navigate(-1)} aria-label="Chiudi">
            <X className="h-5 w-5" />
          </Button>
        }
      />

      <Segmented
        value={tipo}
        onValueChange={(v) => setTipo(v as typeof tipo)}
        options={[
          { value: "appuntamento", label: "Appuntamento" },
          { value: "promemoria", label: "Promemoria" },
        ]}
        layoutId="tipoapp"
      />

      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-xs uppercase tracking-wider text-fumo-2">Titolo</label>
          <input
            value={titolo}
            onChange={(e) => { setTitolo(e.target.value); setErrore(null); }}
            placeholder={tipo === "appuntamento" ? "Es. Sopralluogo villa Rossi" : "Es. Chiamare commercialista"}
            className="h-10 rounded-2xl bg-superficie-bassa px-3 text-sm text-bianco focus-visible:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-xs uppercase tracking-wider text-fumo-2">
            {usaPeriodo ? "Dal" : "Data"}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value || oggiISO())}
              className="h-10 flex-1 rounded-2xl bg-superficie-bassa px-3 font-sans text-sm text-bianco focus-visible:outline-none"
            />
            {usaPeriodo && (
              <>
                <span className="text-fumo-2">–</span>
                <input
                  type="date"
                  value={periodoAl}
                  onChange={(e) => setPeriodoAl(e.target.value || data)}
                  className="h-10 flex-1 rounded-2xl bg-superficie-bassa px-3 font-sans text-sm text-bianco focus-visible:outline-none"
                />
              </>
            )}
          </div>
        </div>

        {tipo === "appuntamento" && !usaPeriodo && (
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={oraInizio}
              onChange={(e) => setOraInizio(e.target.value)}
              className="h-10 flex-1 rounded-btn bg-superficie-bassa px-3 font-sans text-sm text-bianco focus:outline-none"
              aria-label="Ora inizio"
            />
            <span className="text-fumo-2">→</span>
            <input
              type="time"
              value={oraFine}
              onChange={(e) => setOraFine(e.target.value)}
              className="h-10 flex-1 rounded-btn bg-superficie-bassa px-3 font-sans text-sm text-bianco focus:outline-none"
              aria-label="Ora fine"
            />
          </div>
        )}

        {tipo === "appuntamento" && (
          <button
            type="button"
            onClick={() => setUsaPeriodo((v) => !v)}
            className="flex items-center gap-2 px-1 text-sm text-fumo"
          >
            {usaPeriodo ? <X className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4 rotate-180" />}
            {usaPeriodo ? "Rimuovi periodo" : "Imposta periodo (più giorni)"}
          </button>
        )}

        {clientiAttivi.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs uppercase tracking-wider text-fumo-2">Cliente (facoltativo)</label>
            <select
              value={clienteId ?? ""}
              onChange={(e) => setClienteId(e.target.value || null)}
              className="h-10 rounded-2xl bg-superficie-bassa px-3 text-sm text-bianco focus-visible:outline-none"
            >
              <option value="">— nessun cliente —</option>
              {clientiAttivi.map((c) => (
                <option key={c.id} value={c.id}>{c.nome} {c.cognome ?? ""}</option>
              ))}
            </select>
          </div>
        )}

        <CampoFacolt label="Note (facoltativo)" value={descrizione} onValue={setDescrizione} />
      </div>

      {errore && <p className="text-sm text-critico">{errore}</p>}

      <div className="sticky bottom-0 z-10 -mx-5 mt-1 flex gap-2 px-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 glass-alta">
        <Button size="lg" variant="fantasma" onClick={() => navigate(-1)} className="flex-1">
          Annulla
        </Button>
        <Button size="lg" variant="inchiostro" onClick={() => void crea()} className="flex-[2]">
          {tipo === "appuntamento" ? "Salva appuntamento" : "Salva promemoria"}
        </Button>
      </div>
    </div>
  );
}
