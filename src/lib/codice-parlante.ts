// Codice parlante II-GG-SS-AA, derivato (mai memorizzato). (canone 02 §3.6)
import { GIORNO_MS, UNITA_SPESA } from "./format";
import type { Cliente, Dati } from "./types";

function due(n: number): string {
  return String(Math.min(99, Math.max(0, Math.round(n)))).padStart(2, "0");
}

/** Iniziali: prima lettera del nome (o X) + prima del cognome. */
export function inizialiDa(nome: string, cognome?: string): string {
  const a = (nome?.trim()?.[0] ?? "X").toUpperCase();
  const b = (cognome?.trim()?.[0] ?? "").toUpperCase();
  return a + b || "X";
}

/** Iniziali univoche: base "MR"; se occupata -> "MR1", "MR2"... */
export function assegnaIniziali(nome: string, cognome: string | undefined, clienti: Cliente[]): string {
  const base = inizialiDa(nome, cognome);
  const usate = new Set(clienti.filter((c) => !c.deleted).map((c) => c.inizialiCodice));
  if (!usate.has(base)) return base;
  let i = 1;
  while (usate.has(`${base}${i}`)) i++;
  return `${base}${i}`;
}

export interface PartiCodice {
  gg: number;
  ss: number;
  aa: number;
}

/** GG/SS/AA calcolati dai pagamenti incassati e dai lavori del cliente. */
export function calcolaParti(dati: Dati, clienteId: string, oraMs: number = Date.now()): PartiCodice {
  const pagati = dati.pagamenti.filter(
    (p) => p.clienteId === clienteId && !p.deleted && p.importoIncassato > 0 && p.dataIncasso,
  );

  // GG — giorni medi per incassare
  let gg = 0;
  if (pagati.length) {
    const somma = pagati.reduce((acc, p) => {
      const giorni = Math.max(
        0,
        (new Date(p.dataIncasso!).getTime() - new Date(p.dataEmissione).getTime()) / GIORNO_MS,
      );
      return acc + giorni;
    }, 0);
    gg = somma / pagati.length;
  }

  // SS — spesa media per lavoro / UNITA_SPESA
  let ss = 0;
  if (pagati.length) {
    const totale = pagati.reduce((a, p) => a + p.importoIncassato, 0);
    const nLavori = Math.max(1, new Set(pagati.map((p) => p.lavoroId).filter(Boolean)).size);
    ss = totale / nLavori / UNITA_SPESA;
  }

  // AA — anni interi di collaborazione
  let aa = 0;
  const lavori = dati.lavori.filter((l) => l.clienteId === clienteId && !l.deleted);
  if (lavori.length) {
    const primo = lavori.reduce((min, l) => (l.data < min ? l.data : min), lavori[0].data);
    aa = Math.floor((oraMs - new Date(primo).getTime()) / (365.25 * GIORNO_MS));
  }

  return { gg, ss, aa };
}

export function codiceCliente(dati: Dati, clienteId: string, oraMs?: number): string {
  const cliente = dati.clienti.find((c) => c.id === clienteId);
  if (!cliente) return "??-00-00-00";
  const { gg, ss, aa } = calcolaParti(dati, clienteId, oraMs);
  return `${cliente.inizialiCodice}-${due(gg)}-${due(ss)}-${due(aa)}`;
}

export function leggiCodice(codice: string) {
  const parti = codice.split("-");
  if (parti.length !== 4) return null;
  const [iniziali, gg, ss, aa] = parti;
  return {
    iniziali,
    giorniMedi: Number(gg),
    spesaMedia: Number(ss) * UNITA_SPESA,
    anni: Number(aa),
  };
}
