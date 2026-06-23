// Motore dei conti: unica fonte dell'economia di un lavoro. (canone 02 §3.2)
import { arrotonda, SOGLIA } from "./format";
import type { Fase, Modo, StatoIncasso } from "./dominio";
import type { Dati, Lavoro, Pagamento } from "./types";

/** L'operatore "io" (titolare). Sempre presente per canone. */
export function operatoreIo(dati: Dati) {
  return dati.operatori.find((o) => o.ruolo === "titolare") ?? dati.operatori[0];
}

export interface PartecipanteCalc {
  collaboratoreId: string;
  nome: string;
  ore: number;
  tariffa: number;
}

/** Partecipanti con ore (da `ore`) e tariffa-costo (snapshot o attuale). */
export function partecipantiCalc(dati: Dati, l: Lavoro): PartecipanteCalc[] {
  const nomeOf = (id: string) => dati.operatori.find((o) => o.id === id)?.nome ?? "—";
  const tariffaOf = (id: string) => dati.operatori.find((o) => o.id === id)?.tariffaOraria ?? 0;
  const oreDi = (id: string) =>
    arrotonda(
      dati.ore
        .filter((o) => o.lavoroId === l.id && o.operatoreId === id && !o.deleted)
        .reduce((a, o) => a + o.ore, 0),
    );

  if (l.partecipanti && l.partecipanti.length) {
    return l.partecipanti.map((p) => ({
      collaboratoreId: p.collaboratoreId,
      nome: nomeOf(p.collaboratoreId),
      ore: oreDi(p.collaboratoreId),
      tariffa: p.tariffaSnapshot ?? tariffaOf(p.collaboratoreId) ?? 0,
    }));
  }
  // fallback: deriva i partecipanti dalle registrazioni ore
  const ids = new Set<string>();
  for (const o of dati.ore.filter((o) => o.lavoroId === l.id && !o.deleted)) {
    if (o.operatoreId) ids.add(o.operatoreId);
  }
  return [...ids].map((id) => ({ collaboratoreId: id, nome: nomeOf(id), ore: oreDi(id), tariffa: tariffaOf(id) ?? 0 }));
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
  partecipanti: (PartecipanteCalc & { costo: number })[];
  fase: Fase;
  modo: Modo;
}

export function calcoloLavoro(dati: Dati, l: Lavoro): CalcoloLavoro {
  const ioId = operatoreIo(dati)?.id;
  const fase = l.fase;
  const modo = l.modo;
  const base = partecipantiCalc(dati, l);

  const oreTotali = arrotonda(base.reduce((a, p) => a + p.ore, 0));
  const oreCliente = oreTotali;
  const tariffaCli =
    l.tariffaClienteSnapshot ?? dati.clienti.find((c) => c.id === l.clienteId)?.tariffaOraria ?? 0;

  const lordo =
    modo === "preventivo" ? arrotonda(l.prezzo ?? 0) : arrotonda(oreCliente * (tariffaCli ?? 0));

  const partecipanti = base.map((p) => {
    const escludi = p.collaboratoreId === ioId && !l.contaMieOreComeCosto;
    const costo = escludi ? 0 : arrotonda(p.ore * p.tariffa);
    return { ...p, costo };
  });
  const costoCollaboratori = arrotonda(partecipanti.reduce((a, p) => a + p.costo, 0));
  const speseTotali = arrotonda(
    dati.spese.filter((s) => s.lavoroId === l.id && !s.deleted).reduce((a, s) => a + s.importo, 0),
  );

  const incassato =
    fase === "da_fare"
      ? 0
      : arrotonda(
          dati.pagamenti
            .filter((p) => p.lavoroId === l.id && !p.deleted)
            .reduce((a, p) => a + p.importoIncassato, 0),
        );

  const netto = arrotonda(lordo - speseTotali - costoCollaboratori);
  const daIncassare = arrotonda(Math.max(0, lordo - incassato));
  const statoIncasso: StatoIncasso =
    incassato <= SOGLIA ? "non_pagato" : incassato >= lordo - SOGLIA ? "pagato" : "parziale";

  return {
    oreTotali,
    oreCliente,
    lordo,
    costoCollaboratori,
    speseTotali,
    netto,
    incassato,
    daIncassare,
    statoIncasso,
    partecipanti,
    fase,
    modo,
  };
}

/** Pagamento aperto (residuo > soglia) di un lavoro, per l'azione "Incassa". */
export function pagamentoApertoLavoro(dati: Dati, lavoroId: string): Pagamento | undefined {
  return dati.pagamenti.find(
    (p) => p.lavoroId === lavoroId && !p.deleted && p.importoAtteso - p.importoIncassato > SOGLIA,
  );
}
