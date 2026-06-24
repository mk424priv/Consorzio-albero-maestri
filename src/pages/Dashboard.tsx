import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, Codice, Cruscotto, NumberHero, SectionHeader, Segmented, StatTile } from "@/components/ui";
import { codiceCliente } from "@/lib/codice-parlante";
import { cn } from "@/lib/cn";
import { libroOperatore, riepilogoCliente } from "@/lib/conti";
import { arrotonda, formatEuro, formatOre } from "@/lib/format";
import { operatoreIo } from "@/lib/lavoro-calc";
import { useStore } from "@/store/store";

function Barra({ pct, tono = "verde" }: { pct: number; tono?: "verde" | "blu" }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-superficie-alta">
      <div className={tono === "verde" ? "h-full rounded-full bg-verde" : "h-full rounded-full bg-blu"} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

export function Dashboard() {
  const dati = useStore((s) => s.dati);
  const navigate = useNavigate();
  const [modo, setModo] = useState<"clienti" | "operai">("clienti");
  const [filtroL, setFiltroL] = useState<"tutti" | "aperti" | "chiusi">("tutti");
  const io = operatoreIo(dati);

  const clienti = useMemo(
    () =>
      dati.clienti
        .filter((c) => !c.deleted)
        .map((c) => ({ c, r: riepilogoCliente(dati, c.id) }))
        .filter((x) => x.r.numeroLavori > 0)
        .sort((a, b) => b.r.saldoDaIncassare - a.r.saldoDaIncassare),
    [dati],
  );
  const operai = useMemo(
    () => dati.operatori.filter((o) => !o.deleted).map((o) => ({ o, libro: libroOperatore(dati, o.id) })).sort((a, b) => b.libro.saldo - a.libro.saldo),
    [dati],
  );

  const kc = clienti.reduce((a, { r }) => ({ fatt: a.fatt + r.valoreFatturabile, inc: a.inc + r.totaleIncassato, da: a.da + r.saldoDaIncassare, deb: a.deb + (r.saldoDaIncassare > 0 ? 1 : 0) }), { fatt: 0, inc: 0, da: 0, deb: 0 });
  const ko = operai.reduce((a, { o, libro }) => ({ ore: a.ore + libro.ore, dovuto: a.dovuto + (o.id === io?.id ? 0 : libro.dovuto), pagato: a.pagato + libro.pagato, saldo: a.saldo + libro.saldo }), { ore: 0, dovuto: 0, pagato: 0, saldo: 0 });

  const clientiVis = clienti.filter(({ r }) => filtroL === "tutti" || (filtroL === "aperti" ? r.saldoDaIncassare > 0 : r.saldoDaIncassare <= 0));
  const operaiVis = operai.filter(({ libro }) => filtroL === "tutti" || (filtroL === "aperti" ? libro.saldo > 0 : libro.saldo <= 0));
  const etichetteFiltro: [string, string, string] = modo === "clienti" ? ["Tutti", "Debitori", "Saldati"] : ["Tutti", "Da pagare", "Saldati"];
  const ChipFiltri = () => (
    <div className="no-scrollbar flex gap-2 overflow-x-auto">
      {(["tutti", "aperti", "chiusi"] as const).map((v, i) => (
        <button key={v} type="button" onClick={() => setFiltroL(v)} className={cn("shrink-0 rounded-pill px-3.5 py-1.5 text-sm font-medium transition-colors", filtroL === v ? "bg-scuro text-white" : "bg-superficie text-fumo shadow-card")}>
          {etichetteFiltro[i]}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col">
      <Cruscotto titolo="Dashboard" mesh={modo === "clienti" ? "brand" : "blu"}>
        <Segmented
          value={modo}
          onValueChange={setModo}
          options={[
            { value: "clienti", label: "Clienti" },
            { value: "operai", label: "Squadra" },
          ]}
          layoutId="modo-dashboard"
          className="w-full"
        />
        <div className="mt-5 flex flex-col items-center text-center">
          <span className="font-mono text-[11px] uppercase tracking-label text-fumo">{modo === "clienti" ? "Fatturabile totale" : "Da pagare squadra"}</span>
          <NumberHero value={modo === "clienti" ? kc.fatt : ko.saldo} euro tono={modo === "clienti" ? "bianco" : "rosso"} className="text-[44px]" />
          <span className="mt-1 font-mono text-xs text-fumo">
            {modo === "clienti" ? `Incassato ${formatEuro(kc.inc)} · ${kc.deb} debitori` : `${formatOre(ko.ore)} · pagato ${formatEuro(ko.pagato)}`}
          </span>
        </div>
      </Cruscotto>

      <div className="flex flex-col gap-5 px-4 pt-5">
        {modo === "clienti" ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <StatTile etichetta="Incassato" tono="verde">{formatEuro(kc.inc)}</StatTile>
              <StatTile etichetta="Da incassare" tono={kc.da > 0 ? "rosso" : "neutro"}>{formatEuro(kc.da)}</StatTile>
            </div>
            <ChipFiltri />
            <section className="flex flex-col gap-2.5">
              <SectionHeader titolo="Per cliente" conteggio={clientiVis.length} />
              {clientiVis.length === 0 ? (
                <p className="py-6 text-center text-sm text-fumo-2">Nessun cliente in questa vista.</p>
              ) : (
                clientiVis.map(({ c, r }) => {
                  const pct = r.valoreFatturabile > 0 ? arrotonda((r.totaleIncassato / r.valoreFatturabile) * 100) : 100;
                  return (
                    <button key={c.id} type="button" onClick={() => navigate(`/cliente/${c.id}`)} className="flex flex-col gap-2 rounded-vetro bg-superficie p-3.5 text-left transition-transform active:scale-[0.99]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-3">
                          <Avatar iniziali={`${c.nome[0] ?? ""}${c.cognome?.[0] ?? ""}`.toUpperCase() || "?"} tono={r.saldoDaIncassare > 0 ? "rosso" : "verde"} size={36} />
                          <span className="flex min-w-0 flex-col items-start">
                            <span className="truncate text-sm font-medium">{c.nome} {c.cognome ?? ""}</span>
                            <Codice value={codiceCliente(dati, c.id)} />
                          </span>
                        </span>
                        <span className={`shrink-0 text-sm font-bold tracking-tight ${r.saldoDaIncassare > 0 ? "text-rosso" : "text-verde"}`}>{r.saldoDaIncassare > 0 ? formatEuro(r.saldoDaIncassare) : "saldato"}</span>
                      </div>
                      <Barra pct={pct} tono="verde" />
                      <span className="font-mono text-[11px] text-fumo-2">{formatOre(r.oreTotali)} · fatt. {formatEuro(r.valoreFatturabile)} · inc. {formatEuro(r.totaleIncassato)}</span>
                    </button>
                  );
                })
              )}
            </section>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <StatTile etichetta="Pagato" tono="verde">{formatEuro(ko.pagato)}</StatTile>
              <StatTile etichetta="Ore squadra">{formatOre(ko.ore)}</StatTile>
            </div>
            <ChipFiltri />
            <section className="flex flex-col gap-2.5">
              <SectionHeader titolo="Squadra" conteggio={operaiVis.length} />
              {operaiVis.length === 0 ? (
                <p className="py-6 text-center text-sm text-fumo-2">Nessuno in questa vista.</p>
              ) : operaiVis.map(({ o, libro }) => {
                const isIo = o.id === io?.id;
                const pct = libro.dovuto > 0 ? arrotonda((libro.pagato / libro.dovuto) * 100) : 100;
                return (
                  <button key={o.id} type="button" onClick={() => navigate(`/operaio/${o.id}`)} className="flex flex-col gap-2 rounded-vetro bg-superficie p-3.5 text-left transition-transform active:scale-[0.99]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-3">
                        <Avatar iniziali={o.nome.slice(0, 2).toUpperCase()} tono={isIo ? "verde" : "blu"} size={36} />
                        <span className="truncate text-sm font-medium">{o.nome} {isIo && <span className="font-mono text-[11px] text-fumo-2">· io</span>}</span>
                      </span>
                      <span className={`shrink-0 text-sm font-bold tracking-tight ${isIo ? "text-verde" : libro.saldo > 0 ? "text-rosso" : "text-verde"}`}>{isIo ? "profitto" : libro.saldo > 0 ? formatEuro(libro.saldo) : "saldato"}</span>
                    </div>
                    {isIo ? (
                      <span className="font-mono text-[11px] text-fumo-2">{formatOre(libro.ore)} · le mie ore = profitto, non costo</span>
                    ) : (
                      <>
                        <Barra pct={pct} tono="blu" />
                        <span className="font-mono text-[11px] text-fumo-2">{formatOre(libro.ore)} · dovuto {formatEuro(libro.dovuto)} · pagato {formatEuro(libro.pagato)}</span>
                      </>
                    )}
                  </button>
                );
              })}
            </section>
          </>
        )}
        <p className="pb-2 pt-1 text-center font-mono text-[11px] text-fumo-2">clienti = entrate · squadra = uscite</p>
      </div>
    </div>
  );
}
