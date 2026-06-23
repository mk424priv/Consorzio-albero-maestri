import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, TreePine } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CardLavoro } from "@/components/CardLavoro";
import { Button, Targhetta } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  chiaveMese,
  formatEuro,
  formatMese,
  formatOre,
  giornoDelMese,
  nomeGiorno,
  nomeMese,
  oggiISO,
} from "@/lib/format";
import { calcoloLavoro } from "@/lib/lavoro-calc";
import type { Lavoro } from "@/lib/types";
import { useStore } from "@/store/store";

function meseAdiacente(chiave: string, delta: number): string {
  const [a, m] = chiave.split("-").map(Number);
  const d = new Date(a, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function Agenda() {
  const dati = useStore((s) => s.dati);
  const navigate = useNavigate();
  const oggi = oggiISO();
  const [mese, setMese] = useState(() => chiaveMese(oggi));

  const { giorni, perGiorno } = useMemo(() => {
    const lavori = dati.lavori
      .filter((l) => chiaveMese(l.data) === mese)
      .sort(
        (a, b) =>
          a.data.localeCompare(b.data) ||
          (a.ordineNelGiorno ?? 0) - (b.ordineNelGiorno ?? 0) ||
          (a.oraInizio ?? "").localeCompare(b.oraInizio ?? ""),
      );
    const map = new Map<string, Lavoro[]>();
    for (const l of lavori) {
      const arr = map.get(l.data) ?? [];
      arr.push(l);
      map.set(l.data, arr);
    }
    const set = new Set(map.keys());
    if (chiaveMese(oggi) === mese) set.add(oggi); // ancora "oggi"
    return { giorni: [...set].sort(), perGiorno: map };
  }, [dati.lavori, mese, oggi]);

  const { attivo, setRef } = useGiornoAttivo(giorni);

  const sommaGiorno = (iso: string) => {
    const ls = perGiorno.get(iso) ?? [];
    let lordo = 0;
    let ore = 0;
    for (const l of ls.filter((x) => x.fase === "fatto")) {
      const c = calcoloLavoro(dati, l);
      lordo += c.lordo;
      ore += c.oreTotali;
    }
    return { lordo, ore };
  };

  const vuoto = giorni.length === 0 || (giorni.length === 1 && (perGiorno.get(giorni[0])?.length ?? 0) === 0);

  return (
    <div className="flex flex-col">
      <header className="flex items-center justify-between pb-1">
        <h1 className="font-display text-3xl font-semibold text-inchiostro">Agenda</h1>
        <div className="flex items-center gap-1">
          <Button size="icona" variant="tenue" className="h-9 w-9" onClick={() => setMese((m) => meseAdiacente(m, -1))} aria-label="Mese precedente">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="w-24 text-center font-mono text-xs text-inchiostro-medio">{formatMese(mese)}</span>
          <Button size="icona" variant="tenue" className="h-9 w-9" onClick={() => setMese((m) => meseAdiacente(m, 1))} aria-label="Mese successivo">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* targhetta sticky, cambia con il giorno che si avvicina */}
      <div className="sticky top-0 z-20 -mx-4 flex items-center justify-between gap-2 bg-carta/85 px-4 py-2 backdrop-blur">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={attivo || "vuoto"}
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 3 }}
            transition={{ duration: 0.22 }}
          >
            {attivo && (
              <Targhetta giorno={giornoDelMese(attivo)} giornoSettimana={nomeGiorno(attivo, true)} mese={nomeMese(attivo, true)} />
            )}
          </motion.div>
        </AnimatePresence>
        {chiaveMese(oggi) !== mese && (
          <Button size="sm" variant="ottone" onClick={() => setMese(chiaveMese(oggi))}>
            oggi
          </Button>
        )}
      </div>

      {vuoto ? (
        <MeseVuoto mese={mese} onCrea={() => navigate("/nuovo")} />
      ) : (
        <div className="flex flex-col gap-4 pt-3">
          {giorni.map((iso) => {
            const ls = perGiorno.get(iso) ?? [];
            const s = sommaGiorno(iso);
            const isOggi = iso === oggi;
            return (
              <section key={iso} ref={(el) => setRef(iso, el)}>
                <div className="sticky top-[4.25rem] z-10 -mx-4 flex items-baseline justify-between bg-carta/85 px-4 py-1 backdrop-blur">
                  <h2 className={cn("font-display text-sm", isOggi ? "text-ottone-scuro" : "text-inchiostro-medio")}>
                    {nomeGiorno(iso)} {giornoDelMese(iso)}{" "}
                    {isOggi && <span className="font-mono text-[0.6rem] uppercase tracking-wider text-ottone">oggi</span>}
                  </h2>
                  {s.lordo > 0 && (
                    <span className="font-mono text-xs text-inchiostro-debole">
                      {formatEuro(s.lordo)} · {formatOre(s.ore)}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-col gap-2">
                  {ls.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => navigate("/nuovo")}
                      className="rounded-targhetta border border-dashed border-inchiostro-debole/30 py-3 text-center font-mono text-xs text-inchiostro-debole"
                    >
                      ···· nessun lavoro · + crea ····
                    </button>
                  ) : (
                    ls.map((l) => <CardLavoro key={l.id} lavoro={l} />)
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function useGiornoAttivo(giorni: string[]) {
  const [attivo, setAttivo] = useState(giorni[0] ?? "");
  const refs = useRef(new Map<string, HTMLElement | null>());
  const setRef = (iso: string, el: HTMLElement | null) => {
    refs.current.set(iso, el);
  };
  const chiave = giorni.join(",");
  useEffect(() => {
    const onScroll = () => {
      const soglia = 100;
      let corrente = giorni[0] ?? "";
      for (const g of giorni) {
        const el = refs.current.get(g);
        if (el && el.getBoundingClientRect().top <= soglia) corrente = g;
      }
      setAttivo(corrente);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chiave]);
  return { attivo, setRef };
}

function MeseVuoto({ mese, onCrea }: { mese: string; onCrea: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <TreePine className="h-10 w-10 text-lichene" />
      <p className="font-display text-lg text-inchiostro-medio">Nessun lavoro in {formatMese(mese)}</p>
      <p className="text-sm text-inchiostro-debole">Tocca ＋ per creare la prima registrazione.</p>
      <Button onClick={onCrea}>＋ Crea registrazione</Button>
    </div>
  );
}
