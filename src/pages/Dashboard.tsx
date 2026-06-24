import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MeshStrip, type MeshTono } from "@/components/world/MeshStrip";
import { Avatar, Codice, NumberHero, SectionHeader, Segmented, StatTile, Testata } from "@/components/ui";
import { codiceCliente } from "@/lib/codice-parlante";
import { libroOperatore, riepilogoCliente } from "@/lib/conti";
import { arrotonda, formatEuro, formatOre } from "@/lib/format";
import { operatoreIo } from "@/lib/lavoro-calc";
import { useStore } from "@/store/store";

function KpiHero({ etichetta, valore, sotto, mesh }: { etichetta: string; valore: number; sotto: string; mesh: MeshTono }) {
  return (
    <div className="relative overflow-hidden rounded-bolla p-5">
      <MeshStrip tono={mesh} />
      <div className="relative">
        <span className="font-mono text-[11px] uppercase tracking-label text-white/75">{etichetta}</span>
        <div className="mt-1">
          <NumberHero value={valore} euro tono="bianco" className="text-[42px]" />
        </div>
        <span className="text-sm text-white/75">{sotto}</span>
      </div>
    </div>
  );
}

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

  return (
    <div className="flex flex-col">
      <Testata titolo="Dashboard">
        <Segmented
          value={modo}
          onValueChange={setModo}
          options={[
            { value: "clienti", label: "Clienti" },
            { value: "operai", label: "Squadra" },
          ]}
          layoutId="modo-dashboard"
        />
      </Testata>

      <div className="flex flex-col gap-5 px-5 pt-5">
        {modo === "clienti" ? (
          <>
            <KpiHero etichetta="Fatturabile totale" valore={kc.fatt} sotto={`Incassato ${formatEuro(kc.inc)} · ${kc.deb} debitori`} mesh="brand" />
            <div className="grid grid-cols-2 gap-2">
              <StatTile etichetta="Incassato" tono="verde">{formatEuro(kc.inc)}</StatTile>
              <StatTile etichetta="Da incassare" tono={kc.da > 0 ? "rosso" : "neutro"}>{formatEuro(kc.da)}</StatTile>
            </div>

            <section className="flex flex-col gap-2.5">
              <SectionHeader titolo="Per cliente" conteggio={clienti.length} />
              {clienti.length === 0 ? (
                <p className="py-6 text-center text-sm text-fumo-2">Nessun cliente con movimenti.</p>
              ) : (
                clienti.map(({ c, r }) => {
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
                        <span className={`shrink-0 text-sm font-bold tracking-tight ${r.saldoDaIncassare > 0 ? "text-rosso" : "text-verde"}`}>
                          {r.saldoDaIncassare > 0 ? formatEuro(r.saldoDaIncassare) : "saldato"}
                        </span>
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
            <KpiHero etichetta="Da pagare squadra" valore={ko.saldo} sotto={`${formatOre(ko.ore)} · pagato ${formatEuro(ko.pagato)}`} mesh="blu" />
            <div className="grid grid-cols-2 gap-2">
              <StatTile etichetta="Pagato" tono="verde">{formatEuro(ko.pagato)}</StatTile>
              <StatTile etichetta="Ore squadra">{formatOre(ko.ore)}</StatTile>
            </div>

            <section className="flex flex-col gap-2.5">
              <SectionHeader titolo="Squadra" conteggio={operai.length} />
              {operai.map(({ o, libro }) => {
                const isIo = o.id === io?.id;
                const pct = libro.dovuto > 0 ? arrotonda((libro.pagato / libro.dovuto) * 100) : 100;
                return (
                  <button key={o.id} type="button" onClick={() => navigate(`/operaio/${o.id}`)} className="flex flex-col gap-2 rounded-vetro bg-superficie p-3.5 text-left transition-transform active:scale-[0.99]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-3">
                        <Avatar iniziali={o.nome.slice(0, 2).toUpperCase()} tono={isIo ? "verde" : "blu"} size={36} />
                        <span className="truncate text-sm font-medium">{o.nome} {isIo && <span className="font-mono text-[11px] text-fumo-2">· io</span>}</span>
                      </span>
                      <span className={`shrink-0 text-sm font-bold tracking-tight ${isIo ? "text-verde" : libro.saldo > 0 ? "text-rosso" : "text-verde"}`}>
                        {isIo ? "profitto" : libro.saldo > 0 ? formatEuro(libro.saldo) : "saldato"}
                      </span>
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
