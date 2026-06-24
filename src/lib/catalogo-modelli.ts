// AUTO-GENERATO da scripts/scarica-modelli.mjs — non modificare a mano.
// Modelli 3D del Garage scaricati da Poly Pizza (CC0 / CC-BY). File in public/modelli/<key>.glb.
// Attribuzioni complete: public/modelli/ATTRIBUZIONI.md

export interface VoceCatalogo {
  /** Titolo originale del modello su Poly Pizza. */
  titolo: string;
  /** Autore (per attribuzione CC-BY). */
  autore: string;
  /** Licenza (CC0 / CC-BY x.x). */
  licenza: string;
  /** URL pagina sorgente su Poly Pizza. */
  fonte: string;
}

/** Modelli 3D realmente presenti in public/modelli/. La chiave è il modelKey. */
export const CATALOGO_MODELLI: Record<string, VoceCatalogo> = {
  axe: { titolo: "Hatchet", autore: "Poly by Google", licenza: "CC-BY 3.0", fonte: "https://poly.pizza/m/2DrO3g2y_g2" },
  car: { titolo: "Car", autore: "Poly by Google", licenza: "CC-BY 3.0", fonte: "https://poly.pizza/m/75h3mi6uHuC" },
  chainsaw: { titolo: "Chainsaw pole", autore: "CreativeTrio", licenza: "CC0 1.0", fonte: "https://poly.pizza/m/2E38b8bNfm" },
  drill: { titolo: "Drill", autore: "Remy Tauziac", licenza: "CC-BY 3.0", fonte: "https://poly.pizza/m/bhOpjMLGCVp" },
  generator: { titolo: "Generator", autore: "KolosStudios", licenza: "CC-BY 3.0", fonte: "https://poly.pizza/m/K58RQ63qR5" },
  hammer: { titolo: "Mallet", autore: "CreativeTrio", licenza: "CC0 1.0", fonte: "https://poly.pizza/m/OwK7SlAysq" },
  handsaw: { titolo: "Hand Saw", autore: "CreativeTrio", licenza: "CC0 1.0", fonte: "https://poly.pizza/m/rbZHkFchEk" },
  hedgetrimmer: { titolo: "Hedge Straight Long", autore: "Isa Lousberg", licenza: "CC0 1.0", fonte: "https://poly.pizza/m/So5EAOMoNy" },
  ladder: { titolo: "Simple Vertical Ladder", autore: "Jarlan Perez", licenza: "CC-BY 3.0", fonte: "https://poly.pizza/m/8JKJ19ZGyiE" },
  motorbike: { titolo: "Motorcycle", autore: "Poly by Google", licenza: "CC-BY 3.0", fonte: "https://poly.pizza/m/dse64pqMKAR" },
  mower: { titolo: "Lawn mower", autore: "Poly by Google", licenza: "CC-BY 3.0", fonte: "https://poly.pizza/m/1pdSPagFCub" },
  pickup: { titolo: "Pickup Truck", autore: "Quaternius", licenza: "CC0 1.0", fonte: "https://poly.pizza/m/qn4grQgHm8" },
  pliers: { titolo: "Pliers", autore: "jeremy", licenza: "CC-BY 3.0", fonte: "https://poly.pizza/m/14FVXuvklov" },
  rake: { titolo: "Hand Rake", autore: "CreativeTrio", licenza: "CC0 1.0", fonte: "https://poly.pizza/m/svzOLCZ74s" },
  scooter: { titolo: "Vespa", autore: "Jasmine Roberts", licenza: "CC-BY 3.0", fonte: "https://poly.pizza/m/blGLclvvdEM" },
  screwdriver: { titolo: "Screwdriver", autore: "Poly by Google", licenza: "CC-BY 3.0", fonte: "https://poly.pizza/m/a4vSw5RcfdR" },
  shovel: { titolo: "Shovel", autore: "Quaternius", licenza: "CC0 1.0", fonte: "https://poly.pizza/m/oNBQSf87ZJ" },
  tiller: { titolo: "Cultivator", autore: "Daniel Doran", licenza: "CC-BY 3.0", fonte: "https://poly.pizza/m/92k_3jmWtZ6" },
  truck: { titolo: "Truckk", autore: "KolosStudios", licenza: "CC-BY 3.0", fonte: "https://poly.pizza/m/jHwRymyg2C" },
  van: { titolo: "Van", autore: "Poly by Google", licenza: "CC-BY 3.0", fonte: "https://poly.pizza/m/aT_24cDaW1a" },
  wheelbarrow: { titolo: "Wheelbarrow", autore: "Poly by Google", licenza: "CC-BY 3.0", fonte: "https://poly.pizza/m/6XpEkgDXwkU" },
  wrench: { titolo: "Wrench", autore: "CreativeTrio", licenza: "CC0 1.0", fonte: "https://poly.pizza/m/POJHQLnLvB" },
};

/** Elenco dei modelKey con un GLB disponibile. */
export const MODEL_KEYS = Object.keys(CATALOGO_MODELLI);

/** Vero se esiste un GLB per questa chiave. */
export function haModello(key: string | undefined | null): key is string {
  return !!key && key in CATALOGO_MODELLI;
}

/** Percorso pubblico del GLB per una chiave (servito da public/). */
export function urlModello(key: string): string {
  return `/modelli/${key}.glb`;
}
