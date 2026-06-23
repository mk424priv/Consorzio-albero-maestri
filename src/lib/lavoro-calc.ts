// CANONE DEI CALCOLI — unica fonte di verità per l'economia di un lavoro.
// Funziona sia con i lavori "canonici" (partecipanti + snapshot) sia con quelli
// legacy (operatoreId + registrazioni ore in db.ore). Le ore vivono comunque in
// db.ore (così Dashboard/profili restano coerenti); `partecipanti` porta lo
// snapshot della tariffa-costo e l'elenco di chi ha lavorato.

import { arrotonda } from "./format";
import type { Database, Lavoro } from "./types";

export type Fase = "fatto" | "da_fare";
export type Modo = "preventivo" | "ore";
export type Conteggio = "totale" | "per_giorni";
export type StatoIncasso = "non_pagato" | "parziale" | "pagato";

// L'operatore "io" (titolare). Sempre presente per canone.
export function operatoreIo(db: Database) {
  return db.operatori.find((o) => o.ruolo === "titolare") ?? db.operatori[0];
}

export function faseLavoro(l: Lavoro): Fase {
  return l.fase ?? (l.stato === "fatto" ? "fatto" : "da_fare");
}
export function modoLavoro(l: Lavoro): Modo {
  return l.modo ?? (l.tipoCompenso === "ore" ? "ore" : "preventivo");
}
export function conteggioLavoro(l: Lavoro): Conteggio {
  return l.conteggio ?? "totale";
}

// Partecipanti effettivi con ore (da db.ore) e tariffa-costo (snapshot o attuale).
export function partecipantiCalc(
  db: Database,
  l: Lavoro,
): { collaboratoreId: string; nome: string; ore: number; tariffa: number }[] {
  const tariffaOf = (id: string) => db.operatori.find((o) => o.id === id)?.tariffaOraria ?? 0;
  const nomeOf = (id: string) => db.operatori.find((o) => o.id === id)?.nome ?? "—";
  const oreDi = (id: string) =>
    arrotonda(db.ore.filter((o) => o.lavoroId === l.id && o.operatoreId === id).reduce((a, o) => a + o.ore, 0));

  // canonico: elenco da `partecipanti`
  if (l.partecipanti && l.partecipanti.length) {
    return l.partecipanti.map((p) => ({
      collaboratoreId: p.collaboratoreId,
      nome: nomeOf(p.collaboratoreId),
      ore: oreDi(p.collaboratoreId),
      tariffa: p.tariffaSnapshot ?? tariffaOf(p.collaboratoreId),
    }));
  }

  // legacy: ricava da db.ore (+ operatoreId del lavoro)
  const ids = new Set<string>();
  for (const o of db.ore.filter((o) => o.lavoroId === l.id)) if (o.operatoreId) ids.add(o.operatoreId);
  if (l.operatoreId) ids.add(l.operatoreId);
  return [...ids].map((id) => ({ collaboratoreId: id, nome: nomeOf(id), ore: oreDi(id), tariffa: tariffaOf(id) }));
}

export interface CalcoloLavoro {
  oreTotali: number;
  oreCliente: number;
  lordo: number;
  costoCollaboratori: number;
  speseTotali: number;
  netto: number;
  incassato: number;
  daIncassare: number;
  statoIncasso: StatoIncasso;
  partecipanti: { collaboratoreId: string; nome: string; ore: number; tariffa: number; costo: number }[];
  fase: Fase;
  modo: Modo;
}

export function calcoloLavoro(db: Database, l: Lavoro): CalcoloLavoro {
  const ioId = operatoreIo(db)?.id;
  const fase = faseLavoro(l);
  const modo = modoLavoro(l);
  const base = partecipantiCalc(db, l);

  const oreTotali = arrotonda(base.reduce((a, p) => a + p.ore, 0));
  const oreCliente = oreTotali;
  const tariffaCli = l.tariffaClienteSnapshot ?? db.clienti.find((c) => c.id === l.clienteId)?.tariffaOraria ?? 0;
  const lordo = modo === "preventivo" ? arrotonda(l.prezzo ?? 0) : arrotonda(oreCliente * tariffaCli);

  const partecipanti = base.map((p) => {
    const escludi = p.collaboratoreId === ioId && !l.contaMieOreComeCosto;
    const costo = escludi ? 0 : arrotonda(p.ore * p.tariffa);
    return { ...p, costo };
  });
  const costoCollaboratori = arrotonda(partecipanti.reduce((a, p) => a + p.costo, 0));
  const speseTotali = arrotonda(db.spese.filter((s) => s.lavoroId === l.id).reduce((a, s) => a + s.importo, 0));

  const pagamenti = db.pagamenti.filter((p) => p.lavoroId === l.id);
  const incassato = fase === "da_fare" ? 0 : arrotonda(pagamenti.reduce((a, p) => a + p.importoIncassato, 0));

  const netto = arrotonda(lordo - speseTotali - costoCollaboratori);
  const daIncassare = arrotonda(Math.max(0, lordo - incassato));
  const statoIncasso: StatoIncasso = incassato <= 0.005 ? "non_pagato" : incassato >= lordo - 0.005 ? "pagato" : "parziale";

  return { oreTotali, oreCliente, lordo, costoCollaboratori, speseTotali, netto, incassato, daIncassare, statoIncasso, partecipanti, fase, modo };
}

// Pagamento aperto (residuo > 0) collegato al lavoro, per l'azione "Incassa".
export function pagamentoApertoLavoro(db: Database, lavoroId: string): string | undefined {
  return db.pagamenti.find((p) => p.lavoroId === lavoroId && p.importoAtteso - p.importoIncassato > 0.005)?.id;
}
