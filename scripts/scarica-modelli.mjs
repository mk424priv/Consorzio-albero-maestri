// Scarica modelli 3D CC0 da Poly Pizza per il Garage. Solo CC0 + match per titolo.
import { writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";

const OUT = "/Users/volodymyrdrach/Projects/Consorzio-albero-maestri/public/modelli";
const UA = { headers: { "user-agent": "Mozilla/5.0 (compatible; AlberoMaestriBot/1.0)" } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// key → { q: query in ordine, ok: termini ammessi nel titolo, no?: termini vietati }
const CATALOGO = {
  // auto
  car: { q: ["car", "sedan", "suv"], ok: ["car", "sedan", "suv", "auto"], no: ["cart", "carton", "cargo"] },
  van: { q: ["van", "minivan", "cargo van"], ok: ["van", "minivan"], no: ["caravan", "vane"] },
  pickup: { q: ["pickup truck", "pickup"], ok: ["pickup", "pick up", "pick-up"] },
  truck: { q: ["truck", "lorry"], ok: ["truck", "lorry"], no: ["pickup", "fork"] },
  tractor: { q: ["tractor", "farm tractor"], ok: ["tractor"] },
  scooter: { q: ["scooter", "moped", "vespa"], ok: ["scooter", "moped", "vespa"] },
  motorbike: { q: ["motorcycle", "motorbike"], ok: ["motorcycle", "motorbike", "motor bike"] },
  // motore
  chainsaw: { q: ["chainsaw", "chain saw", "chainsaw tool"], ok: ["chainsaw", "chain saw"] },
  mower: { q: ["lawn mower", "lawnmower", "mower"], ok: ["mower"] },
  brushcutter: { q: ["string trimmer", "brushcutter", "weed trimmer", "grass trimmer", "weed whacker", "weed eater", "strimmer"], ok: ["trimmer", "brushcutter", "brush cutter", "strimmer", "cutter", "whacker", "weed eater"], no: ["hedge", "nail"] },
  hedgetrimmer: { q: ["hedge trimmer", "hedge cutter"], ok: ["hedge"] },
  generator: { q: ["generator", "portable generator"], ok: ["generator"] },
  pressurewasher: { q: ["pressure washer", "power washer"], ok: ["pressure washer", "power washer", "pressure-washer"] },
  leafblower: { q: ["leaf blower", "leafblower", "blower", "garden blower"], ok: ["blower"] },
  tiller: { q: ["tiller", "cultivator", "rotavator"], ok: ["tiller", "cultivator", "rotavator"] },
  // elettrico
  drill: { q: ["power drill", "drill"], ok: ["drill"], no: ["drillbit", "oil"] },
  grinder: { q: ["angle grinder", "grinder"], ok: ["grinder"], no: ["coffee", "meat", "pepper"] },
  circularsaw: { q: ["circular saw", "table saw", "buzz saw"], ok: ["circular saw", "circular-saw", "buzz saw", "table saw"] },
  jigsaw: { q: ["jigsaw tool", "jig saw", "power jigsaw"], ok: ["jigsaw", "jig saw"], no: ["puzzle"] },
  sander: { q: ["sander", "orbital sander", "belt sander"], ok: ["sander"] },
  welder: { q: ["welder", "welding machine", "welding torch", "welding"], ok: ["welder", "welding"] },
  // manuale
  hammer: { q: ["hammer", "mallet"], ok: ["hammer", "mallet"], no: ["sledge", "jack"] },
  handsaw: { q: ["hand saw", "handsaw", "saw"], ok: ["saw"], no: ["chain", "mill", "blade", "jig", "circular", "see"] },
  axe: { q: ["axe", "hatchet"], ok: ["axe", "hatchet"], no: ["pickaxe", "pick axe"] },
  shovel: { q: ["shovel", "spade"], ok: ["shovel", "spade"] },
  rake: { q: ["rake", "garden rake"], ok: ["rake"], no: ["brake", "drake"] },
  wrench: { q: ["wrench", "spanner"], ok: ["wrench", "spanner"] },
  screwdriver: { q: ["screwdriver"], ok: ["screwdriver", "screw driver"] },
  pliers: { q: ["pliers", "plier"], ok: ["plier"] },
  wheelbarrow: { q: ["wheelbarrow", "wheel barrow"], ok: ["wheelbarrow", "wheel barrow", "barrow"] },
  ladder: { q: ["ladder", "step ladder"], ok: ["ladder"] },
  shears: { q: ["pruning shears", "garden shears", "secateurs", "loppers", "garden scissors", "shears"], ok: ["shears", "secateurs", "pruner", "pruning", "loppers"], no: ["nail"] },
};

const MAX_CANDIDATI = 20;
const MAX_BYTES = 800_000; // PWA: preferisci modelli leggeri, salta i GLB più pesanti

async function getText(url) {
  const res = await fetch(url, UA);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}
function idsDaRicerca(html) {
  const norm = html.replace(/\\u002F/gi, "/");
  const ids = []; const re = /"url":"\/m\/([A-Za-z0-9_-]+)"/g; let m;
  while ((m = re.exec(norm))) if (!ids.includes(m[1])) ids.push(m[1]);
  return ids;
}
function datiModello(html) {
  const norm = html.replace(/\\u002F/gi, "/");
  const glb = norm.match(/https:\/\/static\.poly\.pizza\/[A-Za-z0-9-]+\.glb/);
  const lic = norm.match(/"Licen[cs]e":"([^"]+)"/i);
  const tit = norm.match(/"Title":"([^"]+)"/i);
  const aut = norm.match(/"Creator":\{[^}]*"Username":"([^"]+)"/i) || norm.match(/"Attribution":"([^"]+)"/i);
  return { glb: glb ? glb[0] : null, licenza: lic ? lic[1] : null, titolo: tit ? tit[1] : null, autore: aut ? aut[1] : null };
}
// CC0 e CC-BY entrambe ammesse: l'attribuzione viene registrata in ATTRIBUZIONI.md.
const isCCok = (l) => !!l && /cc0|cc[\s-]?by|creative commons|public domain/i.test(l);
const titoloOk = (titolo, spec) => {
  if (!titolo) return false;
  const t = titolo.toLowerCase();
  if (spec.no && spec.no.some((n) => t.includes(n))) return false;
  return spec.ok.some((k) => t.includes(k));
};

async function risolviKey(key, spec) {
  for (const q of spec.q) {
    let ids = [];
    try { ids = idsDaRicerca(await getText(`https://poly.pizza/search/${encodeURIComponent(q)}`)); }
    catch { continue; }
    for (const id of ids.slice(0, MAX_CANDIDATI)) {
      try {
        const d = datiModello(await getText(`https://poly.pizza/m/${id}`));
        await sleep(90);
        if (d.glb && isCCok(d.licenza) && titoloOk(d.titolo, spec)) {
          const buf = Buffer.from(await (await fetch(d.glb, UA)).arrayBuffer());
          if (buf.length < 256 || buf.subarray(0, 4).toString() !== "glTF") continue;
          if (buf.length > MAX_BYTES) continue; // troppo pesante per una PWA: prova il prossimo
          await writeFile(`${OUT}/${key}.glb`, buf);
          return { key, ...d, id, pagina: `https://poly.pizza/m/${id}`, bytes: buf.length };
        }
      } catch { /* prossimo */ }
    }
  }
  return null;
}
async function pool(items, n, fn) {
  const out = []; let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = items[i++]; out.push(await fn(k)); } }));
  return out;
}
async function main() {
  if (existsSync(OUT)) await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  const keys = Object.keys(CATALOGO);
  console.log(`Risolvo ${keys.length} attrezzi (CC0 + match titolo)…\n`);
  const esiti = await pool(keys, 4, async (key) => {
    const r = await risolviKey(key, CATALOGO[key]);
    console.log(r ? `✓ ${key.padEnd(14)} ${String(r.bytes).padStart(7)}B  "${r.titolo}" by ${r.autore || "?"}` : `✗ ${key.padEnd(14)} nessun CC0 pertinente`);
    return r || { key, missing: true };
  });
  const ok = esiti.filter((e) => !e.missing);
  const ko = esiti.filter((e) => e.missing).map((e) => e.key);
  await writeFile(`${OUT}/_manifest.json`, JSON.stringify({ ok, ko }, null, 2));
  console.log(`\nFatto: ${ok.length}/${keys.length}. Mancanti: ${ko.join(", ") || "—"}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
