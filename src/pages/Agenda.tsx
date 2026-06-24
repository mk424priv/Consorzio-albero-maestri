import { motion } from "framer-motion";
import {
  Banknote,
  Bell,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  PencilLine,
  Plus,
  TreePine,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CardLavoro } from "@/components/CardLavoro";
import { Button, Cruscotto, EmptyState, NumberHero, Segmented, Swipeable } from "@/components/ui";
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
import type { Appuntamento, Dati, Lavoro } from "@/lib/types";
import { incassaLavoro, riprogramma, segnaSvolto } from "@/store/azioni";
import { bozzaNonVuota, useBozza } from "@/store/bozza";
import { useStore } from "@/store/store";

// ── Utilities ────────────────────────────────────────────────────────────────

type VistaCalendario = "giorno" | "settimana" | "mese" | "anno";

function meseAdiacente(chiave: string, delta: number): string {
  const [a, m] = chiave.split("-").map(Number);
  const d = new Date(a, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function chiaveAnno(iso: string): string {
  return iso.slice(0, 4);
}

function inizioSettimana(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const day = d.getDay(); // 0=dom
  const lun = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + lun);
  return d.toISOString().slice(0, 10);
}

function settimanaDi(iso: string): string[] {
  const lun = inizioSettimana(iso);
  const d = new Date(lun + "T00:00:00");
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    return x.toISOString().slice(0, 10);
  });
}

function settimanaAdiacente(iso: string, delta: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + delta * 7);
  return d.toISOString().slice(0, 10);
}

// ── Tipi agenda ──────────────────────────────────────────────────────────────

type Filtro = "tutto" | "fare" | "incassare" | "pagati";
const FILTRI: [Filtro, string][] = [
  ["tutto", "Tutto"],
  ["fare", "Da fare"],
  ["incassare", "Da incassare"],
  ["pagati", "Pagati"],
];

// ── Componente card appuntamento ─────────────────────────────────────────────

function CardAppuntamento({
  app,
  dati,
  onCompleta,
  onElimina,
}: {
  app: Appuntamento;
  dati: Dati;
  onCompleta: () => void;
  onElimina: () => void;
}) {
  const cliente = app.clienteId ? dati.clienti.find((c) => c.id === app.clienteId) : undefined;
  const isPromemoria = app.tipo === "promemoria";
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-vetro bg-superficie px-3 py-2.5 shadow-card",
        app.completato && "opacity-50",
      )}
    >
      <button
        type="button"
        onClick={onCompleta}
        aria-label={app.completato ? "Riapri" : "Segna completato"}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
          app.completato
            ? "border-verde bg-verde text-white"
            : isPromemoria
              ? "border-arancio text-arancio"
              : "border-blu text-blu",
        )}
      >
        {app.completato && <Check className="h-3 w-3" />}
        {!app.completato && isPromemoria && <Bell className="h-3 w-3" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium", app.completato ? "line-through text-fumo-2" : "text-bianco")}>
          {app.titolo}
        </p>
        {(app.oraInizio || cliente) && (
          <div className="mt-0.5 flex flex-wrap gap-2">
            {app.oraInizio && (
              <span className="flex items-center gap-1 font-mono text-[10px] text-fumo-2">
                <Clock className="h-3 w-3" />
                {app.oraInizio}{app.oraFine ? ` → ${app.oraFine}` : ""}
              </span>
            )}
            {cliente && (
              <span className="font-mono text-[10px] text-fumo-2">{cliente.nome}</span>
            )}
          </div>
        )}
        {app.descrizione && <p className="mt-0.5 text-xs text-fumo-2">{app.descrizione}</p>}
      </div>
      <button type="button" onClick={onElimina} aria-label="Elimina" className="mt-0.5 text-fumo-2 hover:text-rosso">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Componente riga lavoro ────────────────────────────────────────────────────

function Riga({ lavoro, dati }: { lavoro: Lavoro; dati: Dati }) {
  const c = calcoloLavoro(dati, lavoro);
  const card = <CardLavoro lavoro={lavoro} />;
  if (lavoro.fase === "da_fare") {
    return (
      <Swipeable
        azioneDx={<span className="flex items-center gap-1.5 font-semibold text-verde"><Check size={16} /> Svolto</span>}
        onAzioneDx={async () => notificaUndo("Segnato svolto", await segnaSvolto(lavoro.id))}
      >
        {card}
      </Swipeable>
    );
  }
  if (c.statoIncasso === "pagato") return card;
  return (
    <Swipeable
      azione={<span className="flex items-center gap-1.5 font-semibold text-rosso"><Banknote size={16} /> Riscuoti</span>}
      onAzione={async () => { const a = await incassaLavoro(lavoro.id, c.daIncassare); notificaUndo(`Incassato ${formatEuro(c.daIncassare)}`, a); }}
      azioneDx={<span className="flex items-center gap-1.5 font-semibold text-blu"><CalendarClock size={16} /> Riprogramma</span>}
      onAzioneDx={async () => notificaUndo("Riprogrammato", await riprogramma(lavoro.id))}
    >
      {card}
    </Swipeable>
  );
}

// ── Vista Mese (originale) ────────────────────────────────────────────────────

function VistaMese({
  dati,
  mese,
  filtro,
  clienteFiltro,
  navigate,
  oggi,
  salva,
  elimina,
}: {
  dati: Dati;
  mese: string;
  filtro: Filtro;
  clienteFiltro: string | null;
  navigate: ReturnType<typeof useNavigate>;
  oggi: string;
  salva: ReturnType<typeof useStore.getState>["salva"];
  elimina: ReturnType<typeof useStore.getState>["elimina"];
}) {
  const matchFiltro = (l: Lavoro) => {
    if (filtro === "tutto") return true;
    if (filtro === "fare") return l.fase === "da_fare";
    if (l.fase !== "fatto") return false;
    const pagato = calcoloLavoro(dati, l).statoIncasso === "pagato";
    return filtro === "pagati" ? pagato : !pagato;
  };

  const matchCliente = (clienteId?: string) => {
    if (!clienteFiltro) return true;
    return clienteId === clienteFiltro;
  };

  const { giorni, perGiorno, perGiornoApp } = useMemo(() => {
    const lavori = dati.lavori
      .filter((l) => !l.deleted && chiaveMese(l.data) === mese && matchCliente(l.clienteId))
      .sort(
        (a, b) =>
          a.data.localeCompare(b.data) ||
          (a.ordineNelGiorno ?? 0) - (b.ordineNelGiorno ?? 0) ||
          (a.oraInizio ?? "").localeCompare(b.oraInizio ?? ""),
      );

    // Lavori multi-giorno: aggiungi a tutti i giorni del periodo
    const map = new Map<string, Lavoro[]>();
    for (const l of lavori) {
      if (l.periodo && l.periodo.dal && l.periodo.al) {
        const d = new Date(l.periodo.dal + "T00:00:00");
        const fine = new Date(l.periodo.al + "T00:00:00");
        while (d <= fine) {
          const iso = d.toISOString().slice(0, 10);
          if (chiaveMese(iso) === mese) {
            const arr = map.get(iso) ?? [];
            if (!arr.find((x) => x.id === l.id)) arr.push(l);
            map.set(iso, arr);
          }
          d.setDate(d.getDate() + 1);
        }
      } else {
        const arr = map.get(l.data) ?? [];
        arr.push(l);
        map.set(l.data, arr);
      }
    }

    // Appuntamenti
    const appMap = new Map<string, Appuntamento[]>();
    for (const a of dati.appuntamenti.filter(
      (a) => !a.deleted && matchCliente(a.clienteId) && chiaveMese(a.data) === mese,
    )) {
      if (a.periodo?.dal && a.periodo.al) {
        const d = new Date(a.periodo.dal + "T00:00:00");
        const fine = new Date(a.periodo.al + "T00:00:00");
        while (d <= fine) {
          const iso = d.toISOString().slice(0, 10);
          if (chiaveMese(iso) === mese) {
            const arr = appMap.get(iso) ?? [];
            arr.push(a);
            appMap.set(iso, arr);
          }
          d.setDate(d.getDate() + 1);
        }
      } else {
        const arr = appMap.get(a.data) ?? [];
        arr.push(a);
        appMap.set(a.data, arr);
      }
    }

    let lordo = 0;
    for (const l of lavori) {
      if (l.fase === "fatto") lordo += calcoloLavoro(dati, l).lordo;
    }

    const set = new Set([...map.keys(), ...appMap.keys()]);
    if (chiaveMese(oggi) === mese) set.add(oggi);
    const giorni = [...set].sort((a, b) => b.localeCompare(a));
    return { giorni, perGiorno: map, perGiornoApp: appMap };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dati, mese, oggi, filtro, clienteFiltro]);

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

  const vuoto =
    giorni.length === 0 || (giorni.length === 1 && (perGiorno.get(giorni[0])?.length ?? 0) === 0 && (perGiornoApp.get(giorni[0])?.length ?? 0) === 0);

  if (vuoto && filtro === "tutto" && !clienteFiltro) {
    return (
      <div className="px-4 pt-6">
        <EmptyState
          icon={TreePine}
          titolo={`Nessun impegno in ${formatMese(mese)}`}
          testo="Tocca ＋ per la prima registrazione."
          azione={<Button onClick={() => navigate("/nuovo")}>＋ Crea lavoro</Button>}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      {giorni.map((iso) => {
        const ls = (perGiorno.get(iso) ?? []).filter(matchFiltro);
        const apps = perGiornoApp.get(iso) ?? [];
        if (filtro !== "tutto" && ls.length === 0 && apps.length === 0) return null;
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
              {/* Appuntamenti e promemoria */}
              {apps.map((a) => (
                <CardAppuntamento
                  key={a.id}
                  app={a}
                  dati={dati}
                  onCompleta={async () => salva("appuntamenti", { ...a, completato: !a.completato })}
                  onElimina={async () => elimina("appuntamenti", a.id)}
                />
              ))}
              {/* Lavori */}
              {ls.length === 0 && apps.length === 0 ? (
                <button type="button" onClick={() => navigate("/nuovo", { state: { data: iso } })} className="rounded-vetro bg-black/[0.03] py-3 text-center font-mono text-xs text-fumo-2 transition-colors hover:bg-black/[0.05]">
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
  );
}

// ── Vista Giorno ──────────────────────────────────────────────────────────────

function VistaGiorno({
  dati,
  giorno,
  setGiorno,
  oggi,
  salva,
  elimina,
  navigate,
}: {
  dati: Dati;
  giorno: string;
  setGiorno: (g: string) => void;
  oggi: string;
  salva: ReturnType<typeof useStore.getState>["salva"];
  elimina: ReturnType<typeof useStore.getState>["elimina"];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const lavori = dati.lavori
    .filter((l) => !l.deleted && l.data === giorno)
    .sort((a, b) => (a.oraInizio ?? "").localeCompare(b.oraInizio ?? ""));
  const apps = dati.appuntamenti.filter((a) => !a.deleted && a.data === giorno);

  const prev = () => {
    const d = new Date(giorno + "T00:00:00");
    d.setDate(d.getDate() - 1);
    setGiorno(d.toISOString().slice(0, 10));
  };
  const next = () => {
    const d = new Date(giorno + "T00:00:00");
    d.setDate(d.getDate() + 1);
    setGiorno(d.toISOString().slice(0, 10));
  };

  return (
    <div className="flex flex-col gap-3 px-4 pt-3">
      <div className="flex items-center justify-between gap-1">
        <button type="button" onClick={prev} className="flex h-9 w-9 items-center justify-center rounded-full bg-superficie text-fumo hover:text-bianco">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold capitalize text-bianco">{nomeGiorno(giorno)}</p>
          <p className="font-mono text-xs text-fumo-2">{giorno}</p>
          {giorno === oggi && <span className="font-mono text-[10px] text-blu">oggi</span>}
        </div>
        <button type="button" onClick={next} className="flex h-9 w-9 items-center justify-center rounded-full bg-superficie text-fumo hover:text-bianco">
          <ChevronRight size={18} />
        </button>
      </div>

      {apps.map((a) => (
        <CardAppuntamento key={a.id} app={a} dati={dati}
          onCompleta={async () => salva("appuntamenti", { ...a, completato: !a.completato })}
          onElimina={async () => elimina("appuntamenti", a.id)}
        />
      ))}

      {lavori.length === 0 && apps.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-fumo-2">Nessun impegno in questa giornata.</p>
          <div className="mt-3 flex justify-center gap-2">
            <Button size="sm" onClick={() => navigate("/nuovo", { state: { data: giorno } })}>＋ Lavoro</Button>
            <Button size="sm" variant="tenue" onClick={() => navigate("/appuntamento/nuovo", { state: { data: giorno } })}>＋ Appuntamento</Button>
          </div>
        </div>
      ) : (
        lavori.map((l) => <Riga key={l.id} lavoro={l} dati={dati} />)
      )}
    </div>
  );
}

// ── Vista Settimana ───────────────────────────────────────────────────────────

function VistaSettimana({
  dati,
  lunedi,
  setLunedi,
  oggi,
  navigate,
  salva,
  elimina,
}: {
  dati: Dati;
  lunedi: string;
  setLunedi: (l: string) => void;
  oggi: string;
  navigate: ReturnType<typeof useNavigate>;
  salva: ReturnType<typeof useStore.getState>["salva"];
  elimina: ReturnType<typeof useStore.getState>["elimina"];
}) {
  const giorni = settimanaDi(lunedi);
  const [giornoSel, setGiornoSel] = useState(oggi >= giorni[0] && oggi <= giorni[6] ? oggi : giorni[0]);

  const lavoriGiorno = dati.lavori
    .filter((l) => !l.deleted && l.data === giornoSel)
    .sort((a, b) => (a.oraInizio ?? "").localeCompare(b.oraInizio ?? ""));
  const appsGiorno = dati.appuntamenti.filter((a) => !a.deleted && a.data === giornoSel);

  return (
    <div className="flex flex-col gap-3 px-4 pt-3">
      <div className="flex items-center justify-between gap-1">
        <button type="button" onClick={() => setLunedi(settimanaAdiacente(lunedi, -1))} className="flex h-9 w-9 items-center justify-center rounded-full bg-superficie text-fumo hover:text-bianco">
          <ChevronLeft size={18} />
        </button>
        <span className="font-mono text-xs text-fumo-2">{giorni[0]} – {giorni[6]}</span>
        <button type="button" onClick={() => setLunedi(settimanaAdiacente(lunedi, 1))} className="flex h-9 w-9 items-center justify-center rounded-full bg-superficie text-fumo hover:text-bianco">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Strip giorni settimana */}
      <div className="grid grid-cols-7 gap-1">
        {giorni.map((iso) => {
          const hasItems =
            dati.lavori.some((l) => !l.deleted && l.data === iso) ||
            dati.appuntamenti.some((a) => !a.deleted && a.data === iso);
          const isOggi = iso === oggi;
          const isSel = iso === giornoSel;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => setGiornoSel(iso)}
              className={cn(
                "flex flex-col items-center rounded-xl py-1.5 transition-colors",
                isSel ? "bg-scuro text-white" : isOggi ? "bg-blu/15 text-blu" : "text-bianco",
              )}
            >
              <span className="font-mono text-[9px] uppercase opacity-60">{nomeGiorno(iso, true)}</span>
              <span className="font-display text-sm font-bold">{giornoDelMese(iso)}</span>
              {hasItems && <span className={cn("mt-0.5 h-1 w-1 rounded-full", isSel ? "bg-white" : "bg-blu")} />}
            </button>
          );
        })}
      </div>

      {appsGiorno.map((a) => (
        <CardAppuntamento key={a.id} app={a} dati={dati}
          onCompleta={async () => salva("appuntamenti", { ...a, completato: !a.completato })}
          onElimina={async () => elimina("appuntamenti", a.id)}
        />
      ))}

      {lavoriGiorno.length === 0 && appsGiorno.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm text-fumo-2">Nessun impegno il {giornoSel}.</p>
          <div className="mt-3 flex justify-center gap-2">
            <Button size="sm" onClick={() => navigate("/nuovo", { state: { data: giornoSel } })}>＋ Lavoro</Button>
            <Button size="sm" variant="tenue" onClick={() => navigate("/appuntamento/nuovo", { state: { data: giornoSel } })}>＋ Appuntamento</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {lavoriGiorno.map((l) => <Riga key={l.id} lavoro={l} dati={dati} />)}
        </div>
      )}
    </div>
  );
}

// ── Vista Anno ────────────────────────────────────────────────────────────────

function VistaAnno({
  dati,
  anno,
  setAnno,
  oggi,
  navigate,
}: {
  dati: Dati;
  anno: string;
  setAnno: (a: string) => void;
  oggi: string;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const NOMI_MESI = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

  const mesi = Array.from({ length: 12 }, (_, i) => {
    const m = `${anno}-${String(i + 1).padStart(2, "0")}`;
    const lavori = dati.lavori.filter((l) => !l.deleted && chiaveMese(l.data) === m);
    const apps = dati.appuntamenti.filter((a) => !a.deleted && chiaveMese(a.data) === m);
    const lordo = lavori.filter((l) => l.fase === "fatto").reduce((a, l) => a + calcoloLavoro(dati, l).lordo, 0);
    return { m, idx: i, lavori, apps, lordo };
  });

  const totAnno = mesi.reduce((a, m) => a + m.lordo, 0);

  return (
    <div className="flex flex-col gap-4 px-4 pt-3">
      <div className="flex items-center justify-between gap-1">
        <button type="button" onClick={() => setAnno(String(Number(anno) - 1))} className="flex h-9 w-9 items-center justify-center rounded-full bg-superficie text-fumo hover:text-bianco">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="font-display text-lg font-bold text-bianco">{anno}</p>
          {totAnno > 0 && <p className="font-mono text-xs text-fumo-2">{formatEuro(totAnno)} fatturati</p>}
        </div>
        <button type="button" onClick={() => setAnno(String(Number(anno) + 1))} className="flex h-9 w-9 items-center justify-center rounded-full bg-superficie text-fumo hover:text-bianco">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {mesi.map(({ m, idx, lavori, apps, lordo }) => {
          const isMeseOggi = chiaveMese(oggi) === m;
          const count = lavori.length + apps.length;
          return (
            <button
              key={m}
              type="button"
              onClick={() => navigate("/", { state: { mese: m } })}
              className={cn(
                "flex flex-col items-start rounded-vetro p-3 text-left transition-colors",
                isMeseOggi ? "bg-blu/15 ring-1 ring-blu/40" : "bg-superficie shadow-card",
              )}
            >
              <span className={cn("font-display text-sm font-semibold", isMeseOggi ? "text-blu" : "text-bianco")}>
                {NOMI_MESI[idx]}
              </span>
              {count > 0 && (
                <span className="font-mono text-[10px] text-fumo-2">{count} impegni</span>
              )}
              {lordo > 0 && (
                <span className="font-mono text-[10px] text-verde">{formatEuro(lordo)}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Agenda (componente principale) ───────────────────────────────────────────

export function Agenda() {
  const dati = useStore((s) => s.dati);
  const salva = useStore((s) => s.salva);
  const elimina = useStore((s) => s.elimina);
  const navigate = useNavigate();
  const oggi = oggiISO();

  const [vista, setVista] = useState<VistaCalendario>("mese");
  const [mese, setMese] = useState(() => chiaveMese(oggi));
  const [anno, setAnno] = useState(() => chiaveAnno(oggi));
  const [giorno, setGiorno] = useState(oggi);
  const [lunedi, setLunedi] = useState(() => inizioSettimana(oggi));
  const [filtro, setFiltro] = useState<Filtro>("tutto");
  const [clienteFiltro, setClienteFiltro] = useState<string | null>(null);
  const bozza = useBozza((s) => s.b);
  const haBozza = bozzaNonVuota(bozza);

  const clientiAttivi = dati.clienti.filter((c) => !c.deleted);

  const meseLordo = useMemo(() => {
    const lavori = dati.lavori.filter((l) => !l.deleted && chiaveMese(l.data) === mese && l.fase === "fatto");
    return lavori.reduce((a, l) => a + calcoloLavoro(dati, l).lordo, 0);
  }, [dati, mese]);

  const meseConta = useMemo(
    () => dati.lavori.filter((l) => !l.deleted && chiaveMese(l.data) === mese).length,
    [dati, mese],
  );

  const cambioMese = chiaveMese(oggi) !== mese;

  return (
    <div className="flex flex-col">
      <Cruscotto
        titolo="Agenda"
        mesh="cielo"
        controllo={
          vista === "mese" ? (
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setMese((m) => meseAdiacente(m, -1))} aria-label="Mese precedente" className="flex h-9 w-9 items-center justify-center rounded-full bg-superficie text-fumo hover:text-bianco">
                <ChevronLeft size={18} />
              </button>
              <span className="w-[84px] text-center font-mono text-xs text-fumo">{formatMese(mese)}</span>
              <button type="button" onClick={() => setMese((m) => meseAdiacente(m, 1))} aria-label="Mese successivo" className="flex h-9 w-9 items-center justify-center rounded-full bg-superficie text-fumo hover:text-bianco">
                <ChevronRight size={18} />
              </button>
            </div>
          ) : null
        }
      >
        <div className="flex flex-col items-center text-center">
          <span className="font-mono text-[11px] uppercase tracking-label text-fumo">Fatturato del mese</span>
          <NumberHero value={meseLordo} euro tono="bianco" className="text-[40px]" />
          <span className="mt-1 font-mono text-xs text-fumo">
            {meseConta} lavori
            {cambioMese && vista === "mese" && (
              <button type="button" className="ml-2 font-semibold text-blu underline" onClick={() => setMese(chiaveMese(oggi))}>· oggi</button>
            )}
          </span>
        </div>
      </Cruscotto>

      {haBozza && (
        <div className="px-4 pt-3">
          <button
            type="button"
            onClick={() => navigate("/nuovo", { state: { riprendi: true } })}
            className="statocard statocard--programmato flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-transform active:scale-[0.99]"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-bianco">
              <PencilLine size={16} className="text-blu" /> Riprendi la registrazione
            </span>
            <span className="truncate font-mono text-[11px] text-fumo-2">{bozza.titolo.trim() || "bozza in sospeso"}</span>
          </button>
        </div>
      )}

      {/* Selezione vista */}
      <div className="px-4 pt-3">
        <Segmented
          value={vista}
          onValueChange={(v) => setVista(v as VistaCalendario)}
          options={[
            { value: "giorno", label: "Giorno" },
            { value: "settimana", label: "Settimana" },
            { value: "mese", label: "Mese" },
            { value: "anno", label: "Anno" },
          ]}
          layoutId="vista-agenda"
        />
      </div>

      {/* Filtri (solo vista mese) */}
      {vista === "mese" && (
        <div className="flex flex-col gap-2 px-4 pt-2">
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
            {FILTRI.map(([v, l]) => (
              <button key={v} type="button" onClick={() => setFiltro(v)} className={cn("shrink-0 rounded-pill px-3.5 py-1.5 text-sm font-medium transition-colors", filtro === v ? "bg-scuro text-white" : "bg-superficie text-fumo shadow-card")}>
                {l}
              </button>
            ))}
          </div>
          {/* Filtro cliente */}
          {clientiAttivi.length > 0 && (
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={() => setClienteFiltro(null)}
                className={cn("shrink-0 rounded-pill px-3 py-1.5 text-xs font-medium transition-colors", !clienteFiltro ? "bg-scuro text-white" : "bg-superficie text-fumo shadow-card")}
              >
                Tutti
              </button>
              {clientiAttivi.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setClienteFiltro(clienteFiltro === c.id ? null : c.id)}
                  className={cn("shrink-0 rounded-pill px-3 py-1.5 text-xs font-medium transition-colors", clienteFiltro === c.id ? "bg-blu text-white" : "bg-superficie text-fumo shadow-card")}
                >
                  {c.nome}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pulsante nuovo appuntamento */}
      <div className="flex justify-end px-4 pt-2">
        <button
          type="button"
          onClick={() => navigate("/appuntamento/nuovo", { state: { data: giorno } })}
          className="flex items-center gap-1.5 rounded-pill bg-superficie px-3 py-1.5 text-xs font-medium text-fumo shadow-card hover:text-bianco"
        >
          <Plus className="h-3.5 w-3.5" /> Appuntamento
        </button>
      </div>

      {/* Contenuto in base alla vista */}
      {vista === "giorno" && (
        <VistaGiorno dati={dati} giorno={giorno} setGiorno={setGiorno} oggi={oggi} salva={salva} elimina={elimina} navigate={navigate} />
      )}
      {vista === "settimana" && (
        <VistaSettimana dati={dati} lunedi={lunedi} setLunedi={setLunedi} oggi={oggi} navigate={navigate} salva={salva} elimina={elimina} />
      )}
      {vista === "mese" && (
        <VistaMese dati={dati} mese={mese} filtro={filtro} clienteFiltro={clienteFiltro} navigate={navigate} oggi={oggi} salva={salva} elimina={elimina} />
      )}
      {vista === "anno" && (
        <VistaAnno dati={dati} anno={anno} setAnno={setAnno} oggi={oggi} navigate={navigate} />
      )}
    </div>
  );
}
