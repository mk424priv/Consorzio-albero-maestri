import { ArrowLeft, Mail, MapPin, Phone, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CardLavoro } from "@/components/CardLavoro";
import { Intestazione } from "@/components/Intestazione";
import { Button, Card, Codice } from "@/components/ui";
import { codiceCliente, leggiCodice } from "@/lib/codice-parlante";
import { riepilogoCliente } from "@/lib/conti";
import { chiaveMese, formatEuro, formatMese, formatOre, oggiISO } from "@/lib/format";
import { calcoloLavoro } from "@/lib/lavoro-calc";
import { useStore } from "@/store/store";

type Filtro = "tutto" | "incassare" | "fare";

function Numero({ label, valore, forte }: { label: string; valore: string; forte?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[0.6rem] uppercase tracking-wider text-inchiostro-chiaro/60">{label}</span>
      <span className={forte ? "font-mono text-base tabular-nums text-ottone-chiaro" : "font-mono text-sm tabular-nums text-inchiostro-chiaro"}>
        {valore}
      </span>
    </div>
  );
}

export function ClienteScheda() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const dati = useStore((s) => s.dati);
  const [filtro, setFiltro] = useState<Filtro>("tutto");
  const [dettagli, setDettagli] = useState(false);

  const cliente = dati.clienti.find((c) => c.id === id);

  const lavori = useMemo(
    () => dati.lavori.filter((l) => !l.deleted && l.clienteId === id).sort((a, b) => b.data.localeCompare(a.data)),
    [dati.lavori, id],
  );

  if (!cliente) {
    return (
      <div className="flex flex-col gap-3">
        <Intestazione titolo="Cliente" />
        <p className="text-sm text-inchiostro-debole">Cliente non trovato.</p>
      </div>
    );
  }

  const codice = codiceCliente(dati, cliente.id);
  const decode = leggiCodice(codice);
  const r = riepilogoCliente(dati, cliente.id);

  const svolti = lavori.filter((l) => l.fase === "fatto");
  const daIncassare = svolti.filter((l) => calcoloLavoro(dati, l).statoIncasso !== "pagato");
  const daFare = lavori.filter((l) => l.fase === "da_fare");
  const visibili = filtro === "incassare" ? daIncassare : filtro === "fare" ? daFare : lavori;

  // calendario: mesi con conteggi
  const perMese = new Map<string, { fatto: number; daFare: number }>();
  for (const l of lavori) {
    const k = chiaveMese(l.data);
    const v = perMese.get(k) ?? { fatto: 0, daFare: 0 };
    if (l.fase === "fatto") v.fatto++;
    else v.daFare++;
    perMese.set(k, v);
  }
  const mesi = [...perMese.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6);
  const prossimo = daFare
    .filter((l) => l.data >= oggiISO())
    .sort((a, b) => a.data.localeCompare(b.data))[0];

  return (
    <div className="flex flex-col gap-4 pb-24">
      <Intestazione
        titolo={`${cliente.nome} ${cliente.cognome ?? ""}`.trim()}
        sottotitolo={cliente.luogo}
        azione={
          <Button size="icona" variant="tenue" onClick={() => navigate(-1)} aria-label="Indietro">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        }
      />

      {/* contatti */}
      {(cliente.telefono || cliente.email || cliente.luogo) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-inchiostro-medio">
          {cliente.telefono && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {cliente.telefono}</span>}
          {cliente.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {cliente.email}</span>}
          {cliente.luogo && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {cliente.luogo}</span>}
        </div>
      )}

      {/* identità: codice grande + decodifica */}
      <div className="flex flex-col items-center gap-1.5 py-1">
        <Codice value={codice} grande />
        {decode && r.numeroLavori > 0 && (
          <p className="font-mono text-xs text-inchiostro-debole">
            paga in ~{decode.giorniMedi} gg · ~{formatEuro(decode.spesaMedia)}/lavoro · {decode.anni} anni
          </p>
        )}
      </div>

      {/* riepilogo inciso */}
      <Card tono="incasso" className="flex flex-col gap-3 p-4">
        <div className="grid grid-cols-4 gap-2">
          <Numero label="Da incassare" valore={formatEuro(r.saldoDaIncassare)} forte />
          <Numero label="Incassato" valore={formatEuro(r.totaleIncassato)} />
          <Numero label="Lavori" valore={String(r.numeroLavori)} />
          <Numero label="Ore" valore={formatOre(r.oreTotali)} />
        </div>
        <button type="button" onClick={() => setDettagli((v) => !v)} className="self-start font-mono text-[0.65rem] uppercase tracking-wider text-ottone-chiaro/80">
          {dettagli ? "− dettagli" : "+ dettagli economici"}
        </button>
        {dettagli && (
          <div className="grid grid-cols-4 gap-2 border-t border-inchiostro-chiaro/15 pt-2">
            <Numero label="Margine" valore={formatEuro(r.margine)} />
            <Numero label="Fatturabile" valore={formatEuro(r.valoreFatturabile)} />
            <Numero label="Manodopera" valore={formatEuro(r.costoManodopera)} />
            <Numero label="Spese" valore={formatEuro(r.spese)} />
          </div>
        )}
      </Card>

      {/* calendario compatto */}
      {mesi.length > 0 && (
        <Card tono="piana" className="flex flex-col gap-1.5 p-3">
          <span className="font-mono text-xs uppercase tracking-wider text-inchiostro-debole">Lavori nel tempo</span>
          {mesi.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between text-sm">
              <span className="font-mono text-xs uppercase text-inchiostro-medio">{formatMese(k)}</span>
              <span className="font-mono text-xs">
                {"●".repeat(v.fatto)}
                <span className="text-inchiostro-debole">{"◌".repeat(v.daFare)}</span>
              </span>
            </div>
          ))}
          {prossimo && (
            <p className="mt-1 border-t border-carta-ombra pt-1.5 font-mono text-xs text-lichene">
              prossimo: ◌ {prossimo.titolo}
            </p>
          )}
        </Card>
      )}

      {/* segmento 3 stati */}
      <div className="flex rounded-targhetta bg-carta-bassa p-1">
        {([["tutto", "Tutto"], ["incassare", "Da incassare"], ["fare", "Da fare"]] as const).map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setFiltro(v)}
            className={filtro === v ? "flex-1 rounded-[0.5rem] bg-carta-alta px-2 py-1.5 text-sm font-medium text-inchiostro shadow-svolto" : "flex-1 rounded-[0.5rem] px-2 py-1.5 text-sm text-inchiostro-debole"}
          >
            {label}
          </button>
        ))}
      </div>

      {/* lista lavori */}
      <div className="flex flex-col gap-2">
        {visibili.length === 0 ? (
          <p className="py-6 text-center text-sm text-inchiostro-debole">
            {filtro === "incassare" ? "Niente da incassare." : filtro === "fare" ? "Nessun lavoro in programma." : "Ancora nessun lavoro."}
          </p>
        ) : (
          visibili.map((l) => <CardLavoro key={l.id} lavoro={l} />)
        )}
      </div>

      {/* CTA sticky */}
      <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30">
        <div className="mx-auto flex max-w-md px-4">
          <Button
            size="lg"
            className="w-full shadow-targhetta"
            onClick={() => navigate("/nuovo", { state: { clienteId: cliente.id } })}
          >
            <Plus className="h-5 w-5" /> Nuovo lavoro per {cliente.nome}
          </Button>
        </div>
      </div>
    </div>
  );
}
