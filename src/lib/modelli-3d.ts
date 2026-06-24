// Matcher locale deterministico: nome attrezzo (IT) → modelKey del catalogo 3D.
// Puro e offline: nessun import di rete/Gemini, così è testabile e funziona local-first.
// Vedi canone/10. Il GLB vero esiste solo per le chiavi in CATALOGO_MODELLI (haModello).
import type { CategoriaAttrezzo } from "@/lib/types";

/** Categoria di appartenenza di ogni modelKey (anche di chiavi senza GLB scaricato). */
export const CATEGORIA_DI_MODELLO: Record<string, CategoriaAttrezzo> = {
  // auto
  car: "auto", van: "auto", pickup: "auto", truck: "auto", tractor: "auto", scooter: "auto", motorbike: "auto",
  // motore
  chainsaw: "motore", mower: "motore", brushcutter: "motore", hedgetrimmer: "motore",
  generator: "motore", pressurewasher: "motore", leafblower: "motore", tiller: "motore",
  // elettrico
  drill: "elettrico", grinder: "elettrico", circularsaw: "elettrico", jigsaw: "elettrico",
  sander: "elettrico", welder: "elettrico",
  // manuale
  hammer: "manuale", handsaw: "manuale", axe: "manuale", shovel: "manuale", rake: "manuale",
  wrench: "manuale", screwdriver: "manuale", pliers: "manuale", wheelbarrow: "manuale",
  ladder: "manuale", shears: "manuale",
};

/** Tutte le chiavi semanticamente note (con o senza GLB). */
export const TUTTE_LE_CHIAVI = Object.keys(CATEGORIA_DI_MODELLO);

// Regole termine→chiave. Ordine: dal più specifico al più generico (così "sega circolare"
// vince su "sega", "pickup" su "auto"). Il testo è già normalizzato (minuscolo, senza accenti).
const REGOLE: ReadonlyArray<readonly [RegExp, string]> = [
  // ─ auto (i più specifici prima di "auto/macchina") ─
  [/\b(pick\s?-?up|pickup)\b/, "pickup"],
  [/\b(furgon\w*|van)\b/, "van"],
  [/\b(camion|autocarro|motrice|truck|lorry)\b/, "truck"],
  [/\b(trattor\w+|tractor)\b/, "tractor"],
  [/\b(scooter|motorin\w|vespa|ciclomotore|apecar|ape\s?car)\b/, "scooter"],
  [/\b(moto|motociclett\w|motorbike|motorcycle)\b/, "motorbike"],
  [/\b(auto|macchin\w|automobile|vettura|berlin\w|car|suv)\b/, "car"],
  // ─ motore ─
  [/\b(motoseg\w*|sega a catena|chainsaw)\b/, "chainsaw"],
  [/\b(decespugliator\w*|tagliabord\w*|brushcutter|strimmer|trimmer)\b/, "brushcutter"],
  [/\b(tagliasiep\w*|siep\w+|hedge)\b/, "hedgetrimmer"],
  [/\b(taglia\s?erb\w*|rasaerb\w*|tosaerb\w*|mower|lawn)\b/, "mower"],
  [/\b(idropulitric\w*|pressure\s?washer|karcher|hidro)\b/, "pressurewasher"],
  [/\b(soffiator\w*|soffia\s?foglie|leaf\s?blower|blower)\b/, "leafblower"],
  [/\b(motozapp\w*|coltivator\w*|fres\w+|tiller|cultivator|rotavator)\b/, "tiller"],
  [/\b(generator\w*|gruppo elettrogeno)\b/, "generator"],
  // ─ elettrico ─
  [/\b(sega circolare|circular\s?saw|troncatric\w*)\b/, "circularsaw"],
  [/\b(seghett\w*|alternativ\w*|jig\s?saw)\b/, "jigsaw"],
  [/\b(trapan\w*|avvitator\w*|drill)\b/, "drill"],
  [/\b(smerigliatric\w*|mola|flex|flessibile|grinder)\b/, "grinder"],
  [/\b(levigatric\w*|sander)\b/, "sander"],
  [/\b(saldatric\w*|saldator\w*|welder|welding)\b/, "welder"],
  // ─ manuale ─
  [/\b(martell\w*|mazza|mazzuol\w*|hammer|mallet)\b/, "hammer"],
  [/\b(asci\w*|accett\w*|scure|roncol\w*|axe|hatchet)\b/, "axe"],
  [/\b(pala|badile|vang\w*|shovel|spade)\b/, "shovel"],
  [/\b(rastrell\w*|rake)\b/, "rake"],
  [/\b(chiave\s?ingles\w*|chiave|brugol\w*|wrench|spanner)\b/, "wrench"],
  [/\b(cacciavit\w*|giravit\w*|screwdriver)\b/, "screwdriver"],
  [/\b(pinz\w+|tronches\w*|pliers)\b/, "pliers"],
  [/\b(carriol\w*|wheelbarrow|barrow)\b/, "wheelbarrow"],
  [/\b(scal\w+|ladder)\b/, "ladder"],
  [/\b(cesoi\w*|forbic\w*|secateurs|shears|potatura|pruner)\b/, "shears"],
  // "sega/segaccio" generica per ultima: non deruba "motosega"/"sega circolare"
  [/\b(seg\w*|saw|handsaw)\b/, "handsaw"],
];

/** Minuscolo + rimozione accenti, per match robusto su input italiano. */
export function normalizza(testo: string): string {
  return testo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export interface EsitoLocale {
  /** Chiave riconosciuta (semantica), o null se nessun termine combacia. */
  key: string | null;
  /** true se il match è "sicuro": termine riconosciuto E coerente con la categoria scelta. */
  certo: boolean;
}

/**
 * Risolve il modelKey dal testo (nome + caratteristiche) e dalla categoria scelta.
 * Strategia: raccoglie tutti i match in ordine di specificità, poi preferisce quello
 * coerente con la `categoria` selezionata nel form. Un match cross-categoria è
 * restituito ma marcato `certo: false` (candidato debole → eventualmente Gemini decide).
 */
export function risolviModelloLocale(
  nome: string,
  caratteristiche: string | undefined,
  categoria: CategoriaAttrezzo,
): EsitoLocale {
  const testo = normalizza(`${nome} ${caratteristiche ?? ""}`);
  const match: string[] = [];
  for (const [re, key] of REGOLE) {
    if (re.test(testo) && !match.includes(key)) match.push(key);
  }
  if (match.length === 0) return { key: null, certo: false };

  const coerente = match.find((k) => CATEGORIA_DI_MODELLO[k] === categoria);
  if (coerente) return { key: coerente, certo: true };
  // solo match in altre categorie: lo proponiamo ma senza certezza
  return { key: match[0], certo: false };
}
