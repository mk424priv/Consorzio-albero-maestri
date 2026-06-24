// Genera src/lib/catalogo-modelli.ts e public/modelli/ATTRIBUZIONI.md dal manifest.
import { readFile, writeFile } from "node:fs/promises";
const ROOT = "/Users/volodymyrdrach/Projects/Consorzio-albero-maestri";
const { ok } = JSON.parse(await readFile(`${ROOT}/public/modelli/_manifest.json`, "utf8"));
ok.sort((a, b) => a.key.localeCompare(b.key));

const esc = (s) => String(s ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');

// ---- catalogo-modelli.ts ----
const voci = ok.map((m) =>
  `  ${m.key}: { titolo: "${esc(m.titolo)}", autore: "${esc(m.autore || "ignoto")}", licenza: "${esc(m.licenza)}", fonte: "${esc(m.pagina)}" },`
).join("\n");
const ts = `// AUTO-GENERATO da scripts/scarica-modelli.mjs — non modificare a mano.
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
${voci}
};

/** Elenco dei modelKey con un GLB disponibile. */
export const MODEL_KEYS = Object.keys(CATALOGO_MODELLI);

/** Vero se esiste un GLB per questa chiave. */
export function haModello(key: string | undefined | null): key is string {
  return !!key && key in CATALOGO_MODELLI;
}

/** Percorso pubblico del GLB per una chiave (servito da public/). */
export function urlModello(key: string): string {
  return \`/modelli/\${key}.glb\`;
}
`;
await writeFile(`${ROOT}/src/lib/catalogo-modelli.ts`, ts);

// ---- ATTRIBUZIONI.md ----
const righe = ok.map((m) =>
  `| \`${m.key}\` | ${m.titolo} | ${m.autore || "ignoto"} | ${m.licenza} | [link](${m.pagina}) |`
).join("\n");
const md = `# Attribuzioni modelli 3D — Garage

Modelli scaricati da **[Poly Pizza](https://poly.pizza)** con licenza **CC0** o **CC-BY**.
I modelli CC-BY richiedono attribuzione all'autore (sotto). Generato automaticamente.

| modelKey | Titolo | Autore | Licenza | Fonte |
|---|---|---|---|---|
${righe}

> CC0 = nessun obbligo. CC-BY = credito all'autore (questo file lo assolve).
> ${ok.length} modelli, totale ~1.3 MB.
`;
await writeFile(`${ROOT}/public/modelli/ATTRIBUZIONI.md`, md);

console.log(`Generati:\n  src/lib/catalogo-modelli.ts (${ok.length} voci)\n  public/modelli/ATTRIBUZIONI.md`);
console.log("Licenze:", [...new Set(ok.map((m) => m.licenza))].join(", "));
