// Codice parlante del cliente: II-GG-SS-AA
// es. MR-03-12-05 = Mario Rossi, paga in ~3 giorni, spende ~600 €/lavoro,
// cliente da 5 anni. Le parti GG/SS/AA sono SEMPRE calcolate dai dati.

import type { Cliente, Database } from "./types";

const UNITA_SPESA = 50; // ogni unità di SS vale 50 €

function due(n: number): string {
  const v = Math.max(0, Math.min(99, Math.round(n)));
  return String(v).padStart(2, "0");
}

export function inizialiDa(nome: string, cognome: string): string {
  const a = (nome.trim()[0] ?? "X").toUpperCase();
  const b = (cognome.trim()[0] ?? "X").toUpperCase();
  return `${a}${b}`;
}

// Assegna le iniziali con contatore sulle collisioni: MR, MR1, MR2…
export function assegnaIniziali(
  nome: string,
  cognome: string,
  clientiEsistenti: Cliente[],
): string {
  const base = inizialiDa(nome, cognome);
  const set = new Set(
    clientiEsistenti
      .filter((c) => c.inizialiCodice.startsWith(base))
      .map((c) => c.inizialiCodice),
  );
  if (!set.has(base)) return base;
  let i = 1;
  while (set.has(`${base}${i}`)) i++;
  return `${base}${i}`;
}

export type DatiCodice = {
  iniziali: string;
  pagamentiPagati: {
    dataEmissione: string;
    dataIncasso: string | null;
    importoIncassato: number;
    lavoroId: string | null;
  }[];
  dataPrimoLavoro: string | null;
  oggi?: Date;
};

export function calcolaCodice(d: DatiCodice): string {
  const oggi = d.oggi ?? new Date();

  // GG — giorni medi per incassare (su pagamenti pagati con data incasso)
  const conIncasso = d.pagamentiPagati.filter((p) => p.dataIncasso);
  let gg = 0;
  if (conIncasso.length) {
    const somma = conIncasso.reduce((acc, p) => {
      const giorni =
        (new Date(p.dataIncasso!).getTime() -
          new Date(p.dataEmissione).getTime()) /
        86_400_000;
      return acc + Math.max(0, giorni);
    }, 0);
    gg = somma / conIncasso.length;
  }

  // SS — spesa media per lavoro (totale incassato / numero lavori pagati) / 50
  let ss = 0;
  if (d.pagamentiPagati.length) {
    const totale = d.pagamentiPagati.reduce((a, p) => a + p.importoIncassato, 0);
    const lavori = new Set(
      d.pagamentiPagati.map((p, i) => p.lavoroId ?? `pag-${i}`),
    );
    const nLavori = Math.max(1, lavori.size);
    ss = totale / nLavori / UNITA_SPESA;
  }

  // AA — anni interi insieme (dal primo lavoro)
  let aa = 0;
  if (d.dataPrimoLavoro) {
    const ms = oggi.getTime() - new Date(d.dataPrimoLavoro).getTime();
    aa = Math.floor(ms / (365.25 * 86_400_000));
  }

  return `${d.iniziali}-${due(gg)}-${due(ss)}-${due(aa)}`;
}

// Calcola il codice di un cliente leggendo i suoi dati dal database in memoria.
export function codiceCliente(db: Database, clienteId: string): string {
  const cliente = db.clienti.find((c) => c.id === clienteId);
  if (!cliente) return "??-00-00-00";

  const pagamenti = db.pagamenti
    .filter((p) => p.clienteId === clienteId && p.stato === "pagato")
    .map((p) => ({
      dataEmissione: p.dataEmissione,
      dataIncasso: p.dataIncasso ?? null,
      importoIncassato: p.importoIncassato,
      lavoroId: p.lavoroId ?? null,
    }));

  const lavori = db.lavori
    .filter((l) => l.clienteId === clienteId)
    .sort((a, b) => a.data.localeCompare(b.data));

  return calcolaCodice({
    iniziali: cliente.inizialiCodice,
    pagamentiPagati: pagamenti,
    dataPrimoLavoro: lavori[0]?.data ?? null,
  });
}

// Scompone un codice in parti leggibili.
export function leggiCodice(codice: string): {
  iniziali: string;
  giorni: number;
  spesaMedia: number;
  anni: number;
} {
  const [iniziali = "??", gg = "0", ss = "0", aa = "0"] = codice.split("-");
  return {
    iniziali,
    giorni: Number(gg),
    spesaMedia: Number(ss) * UNITA_SPESA,
    anni: Number(aa),
  };
}
