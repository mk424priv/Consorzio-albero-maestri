// Calcolatore fiscale configurabile per regime forfettario / ordinario / semplificato.
import { arrotonda } from "./format";

export type RegimeFiscale = "forfettario" | "ordinario" | "semplificato";

export interface ImpostazioniFiscali {
  regime: RegimeFiscale;
  /** Aliquota imposta sostitutiva/IRPEF (%). Es: 15 per forfettario startup, 5 per primo anno. */
  aliquotaImposta: number;
  /** Aliquota contributi INPS (%). Es: 26.23 gestione separata. */
  aliquotaContributi: number;
  /** Coefficiente di redditività (%). Solo forfettario. Es: 78 per servizi vari. */
  coefficienteRedditivita: number;
}

const LS_KEY = "albero:fiscale";

export const IMPOSTAZIONI_DEFAULT: ImpostazioniFiscali = {
  regime: "forfettario",
  aliquotaImposta: 15,
  aliquotaContributi: 26.23,
  coefficienteRedditivita: 78,
};

export function caricaImpostazioniFiscali(): ImpostazioniFiscali {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...IMPOSTAZIONI_DEFAULT };
    return { ...IMPOSTAZIONI_DEFAULT, ...(JSON.parse(raw) as Partial<ImpostazioniFiscali>) };
  } catch {
    return { ...IMPOSTAZIONI_DEFAULT };
  }
}

export function salvaImpostazioniFiscali(cfg: ImpostazioniFiscali): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(cfg));
  } catch { /* storage non disponibile */ }
}

export interface CalcoloFiscale {
  lordo: number;
  redditoImponibile: number;
  imposta: number;
  contributi: number;
  totaleTasse: number;
  netto: number;
}

export function calcolaFiscale(lordo: number, cfg: ImpostazioniFiscali): CalcoloFiscale {
  const coeff = cfg.regime === "forfettario" ? cfg.coefficienteRedditivita / 100 : 1;
  const redditoImponibile = arrotonda(lordo * coeff);
  const imposta = arrotonda(redditoImponibile * cfg.aliquotaImposta / 100);
  const contributi = arrotonda(redditoImponibile * cfg.aliquotaContributi / 100);
  const totaleTasse = arrotonda(imposta + contributi);
  const netto = arrotonda(lordo - totaleTasse);
  return { lordo, redditoImponibile, imposta, contributi, totaleTasse, netto };
}
