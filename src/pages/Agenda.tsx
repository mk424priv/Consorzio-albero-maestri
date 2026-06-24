import { motion } from "framer-motion";
import { Banknote, ChevronLeft, ChevronRight, TreePine } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CardLavoro } from "@/components/CardLavoro";
import { Button, Cruscotto, EmptyState, NumberHero, Swipeable } from "@/components/ui";
import {
  chiaveMese,
  formatEuro,
  formatMese,
  formatOre,
  giornoDelMese,
  nomeGiorno,
  oggiISO,
} from "@/lib/format";
import { cn } from "@/lib/cn";
import { calcoloLavoro } from "@/lib/lavoro-calc";
import { notificaUndo } from "@/lib/undo";
import type { Dati, Lavoro } from "@/lib/types";
import { incassaLavoro } from "@/store/azioni";
import { useStore } from "@/store/store";

function meseAdiacente(chiave: string, delta: number): string {
  const [a, m] = chiave.split("-").map(Number);
  const d = new Date(a, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

type Filtro = "tutto" | "fare" | "incassare" | "pagati";
const FILTRI: [Filtro, string][] = [["tutto", "Tutto"], ["fare", "Da fare"], ["incassare", "Da incassare"], ["pagati", "Pagati"]];

export function Agenda() {
  const dati = useStore((s) => s.dati);
  const navigate = useNavigate();
  const oggi = oggiISO();
  const [mese, setMese] = useState(() => chiaveMese(oggi));
  const [filtro, setFiltro] = useState<Filtro>("tutto");

  const matchFiltro = (l: Lavoro) => {
    if (filtro === "tutto") return true;
    if (filtro === "fare") return l.fase === "da_fare";
    if (l.fase !== "fatto") return false;
    const pagato = calcoloLavoro(dati, l).statoIncasso === "pagato";
    return filtro === "pagati" ? pagato : !pagato;
  };

  const { giorni, perGiorno, meseLordo, meseConta } = useMemo(() => {
    const lavori = dati.lavori
      .filter((l) => chiaveMese(l.data) === mese)
      .sort(
        (a, b) =>
          a.data.localeCompare(b.data) ||
          (a.ordineNelGiorno ?? 0) - (b.ordineNelGiorno ?? 0) ||
          (a.oraInizio ?? "").localeCompare(b.oraInizio ?? ""),
      );
    const map = new Map<string, Lavoro[]>();
    let lordo = 0;
    for (const l of lavori) {
      const arr = map.get(l.data) ?? [];
      arr.push(l);
      map.set(l.data, arr);
      if (l.fase === "fatto") lordo += calcoloLavoro(dati, l).lordo;
    }
    const set = new Set(map.keys());
    if (chiaveMese(oggi) === mese) set.add(oggi);
    return { giorni: [...set].sort(), perGiorno: map, meseLordo: lordo, meseConta: lavori.length };
  }, [dati, mese, oggi]);

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
  const cambioMese = chiaveMese(oggi) !== mese;

  return (
    <div className="flex flex-col">
      <Cruscotto
        titolo="Agenda"
        mesh="cielo"
        controllo={
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setMese((m) => meseAdiacente(m, -1))} aria-label="Mese precedente" className="flex h-9 w-9 items-center justify-center rounded-full bg-superficie text-fumo hover:text-bianco">
              <ChevronLeft size={18} />
            </button>
            <span className="w-[84px] text-center font-mono text-xs text-fumo">{formatMese(mese)}</span>
            <button type="button" onClick={() => setMese((m) => meseAdiacente(m, 1))} aria-label="Mese successivo" className="flex h-9 w-9 items-center justify-center rounded-full bg-superficie text-fumo hover:text-bianco">
              <ChevronRight size={18} />
            </button>
          </div>
        }
      >
        <div className="flex flex-col items-center text-center">
          <span className="font-mono text-[11px] uppercase tracking-label text-white/70">Fatturato del mese</span>
          <NumberHero value={meseLordo} euro tono="bianco" className="text-[40px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]" />
          <span className="mt-1 font-mono text-xs text-white/70">
            {meseConta} lavori
            {cambioMese && <button type="button" className="ml-2 underline" onClick={() => setMese(chiaveMese(oggi))}>· oggi</button>}
          </span>
        </div>
      </Cruscotto>

      {vuoto ? (
        <div className="px-4 pt-6">
          <EmptyState
            icon={TreePine}
            titolo={`Nessun lavoro in ${formatMese(mese)}`}
            testo="Tocca ＋ per la prima registrazione."
            azione={<Button onClick={() => navigate("/nuovo")}>＋ Crea registrazione</Button>}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4 px-4 pt-4">
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
            {FILTRI.map(([v, l]) => (
              <button key={v} type="button" onClick={() => setFiltro(v)} className={cn("shrink-0 rounded-pill px-3.5 py-1.5 text-sm font-medium transition-colors", filtro === v ? "bg-white text-black" : "bg-superficie text-fumo")}>
                {l}
              </button>
            ))}
          </div>
          {filtro !== "tutto" && !giorni.some((iso) => (perGiorno.get(iso) ?? []).some(matchFiltro)) && (
            <p className="py-8 text-center text-sm text-fumo-2">Niente in «{FILTRI.find(([v]) => v === filtro)?.[1]}» questo mese.</p>
          )}
          {giorni.map((iso) => {
            const ls = (perGiorno.get(iso) ?? []).filter(matchFiltro);
            if (filtro !== "tutto" && ls.length === 0) return null;
            const s = sommaGiorno(iso);
            const isOggi = iso === oggi;
            return (
              <motion.section key={iso} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-8% 0px" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
                <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-2 bg-fondo/85 px-4 py-2 backdrop-blur-md">
                  <span className="flex items-center gap-2.5">
                    <span className={cn("flex h-11 w-11 flex-col items-center justify-center rounded-2xl leading-none", isOggi ? "bg-blu text-white shadow-flottante" : "bg-superficie text-bianco")}>
                      <span className="font-display text-base font-bold">{giornoDelMese(iso)}</span>
                      <span className="font-mono text-[8px] uppercase tracking-wider opacity-70">{nomeGiorno(iso, true)}</span>
                    </span>
                    <span className="flex flex-col leading-tight">
                      <span className="text-sm font-semibold capitalize">{nomeGiorno(iso)}</span>
                      {isOggi && <span className="font-mono text-[10px] uppercase tracking-label text-blu">oggi</span>}
                    </span>
                  </span>
                  {s.lordo > 0 && <span className="font-mono text-xs text-fumo-2">{formatEuro(s.lordo)} · {formatOre(s.ore)}</span>}
                </div>
                <div className="mt-2.5 flex flex-col gap-2.5">
                  {ls.length === 0 ? (
                    <button type="button" onClick={() => navigate("/nuovo")} className="rounded-vetro border border-dashed border-white/10 py-3 text-center font-mono text-xs text-fumo-2 hover:border-white/20">
                      ＋ crea lavoro
                    </button>
                  ) : (
                    ls.map((l) => <Riga key={l.id} lavoro={l} dati={dati} />)
                  )}
                </div>
              </motion.section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Riga({ lavoro, dati }: { lavoro: Lavoro; dati: Dati }) {
  const c = calcoloLavoro(dati, lavoro);
  const daIncassare = lavoro.fase === "fatto" && c.statoIncasso !== "pagato";
  const card = <CardLavoro lavoro={lavoro} />;
  if (!daIncassare) return card;
  return (
    <Swipeable
      azione={
        <span className="flex items-center gap-1.5 font-semibold text-rosso">
          <Banknote size={16} /> Riscuoti
        </span>
      }
      onAzione={async () => {
        const a = await incassaLavoro(lavoro.id, c.daIncassare);
        notificaUndo(`Incassato ${formatEuro(c.daIncassare)}`, a);
      }}
    >
      {card}
    </Swipeable>
  );
}
