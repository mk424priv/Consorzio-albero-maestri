// Codice parlante del cliente (PRD §7): II-GG-SS-AA
// es. MR-03-12-05 = Mario Rossi, paga in ~3 giorni, spende ~600 €/lavoro,
// cliente da 5 anni. Le parti GG/SS/AA sono SEMPRE calcolate dai dati.

import { db } from "@/lib/db";

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
export async function assegnaIniziali(
  nome: string,
  cognome: string,
): Promise<string> {
  const base = inizialiDa(nome, cognome);
  const esistenti = await db.cliente.findMany({
    where: { inizialiCodice: { startsWith: base } },
    select: { inizialiCodice: true },
  });
  const set = new Set(esistenti.map((c) => c.inizialiCodice));
  if (!set.has(base)) return base;
  let i = 1;
  while (set.has(`${base}${i}`)) i++;
  return `${base}${i}`;
}

export type DatiCodice = {
  iniziali: string;
  // pagamenti incassati: serve dataEmissione e dataIncasso
  pagamentiPagati: { dataEmissione: Date; dataIncasso: Date | null; importoIncassato: number; lavoroId: string | null }[];
  dataPrimoLavoro: Date | null;
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
        (p.dataIncasso!.getTime() - p.dataEmissione.getTime()) / 86_400_000;
      return acc + Math.max(0, giorni);
    }, 0);
    gg = somma / conIncasso.length;
  }

  // SS — spesa media per lavoro (totale incassato / numero lavori pagati) / 50
  let ss = 0;
  if (d.pagamentiPagati.length) {
    const totale = d.pagamentiPagati.reduce((a, p) => a + p.importoIncassato, 0);
    const lavori = new Set(
      d.pagamentiPagati.map((p) => p.lavoroId ?? `pag-${Math.random()}`),
    );
    const nLavori = Math.max(1, lavori.size);
    ss = totale / nLavori / UNITA_SPESA;
  }

  // AA — anni interi insieme (dal primo lavoro)
  let aa = 0;
  if (d.dataPrimoLavoro) {
    const ms = oggi.getTime() - d.dataPrimoLavoro.getTime();
    aa = Math.floor(ms / (365.25 * 86_400_000));
  }

  return `${d.iniziali}-${due(gg)}-${due(ss)}-${due(aa)}`;
}

// Calcola il codice di un cliente leggendo i suoi dati dal database.
export async function codiceClienteDaDB(clienteId: string): Promise<string> {
  const cliente = await db.cliente.findUnique({
    where: { id: clienteId },
    select: { inizialiCodice: true },
  });
  if (!cliente) return "??-00-00-00";

  const pagamenti = await db.pagamento.findMany({
    where: { clienteId, stato: "pagato" },
    select: {
      dataEmissione: true,
      dataIncasso: true,
      importoIncassato: true,
      lavoroId: true,
    },
  });

  const primoLavoro = await db.lavoro.findFirst({
    where: { clienteId },
    orderBy: { data: "asc" },
    select: { data: true },
  });

  return calcolaCodice({
    iniziali: cliente.inizialiCodice,
    pagamentiPagati: pagamenti,
    dataPrimoLavoro: primoLavoro?.data ?? null,
  });
}
