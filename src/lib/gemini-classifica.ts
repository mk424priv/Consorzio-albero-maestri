// Classificatore opzionale via Google Gemini: nome attrezzo (IT) → modelKey del catalogo.
// Local-first: viene interpellato SOLO se è configurata la chiave e il matcher locale è
// incerto. In caso di errore/offline/timeout torna null e si usa il fallback locale.
// La chiave è una VITE_* → finisce nel bundle: usare una chiave dedicata, ristretta per
// dominio in Google Cloud Console. Vedi canone/10.
import { MODEL_KEYS } from "@/lib/catalogo-modelli";
import { CATEGORIA_DI_MODELLO, risolviModelloLocale } from "@/lib/modelli-3d";
import type { CategoriaAttrezzo } from "@/lib/types";

const CHIAVE = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const MODELLO = "gemini-flash-latest";
const TIMEOUT_MS = 7000;

/** true se è configurata una chiave Gemini (altrimenti si resta 100% locali). */
export function geminiDisponibile(): boolean {
  return typeof CHIAVE === "string" && CHIAVE.trim().length > 0;
}

/** Chiavi con GLB disponibile per una categoria (l'enum proposto a Gemini). */
function chiaviPerCategoria(categoria: CategoriaAttrezzo): string[] {
  return MODEL_KEYS.filter((k) => CATEGORIA_DI_MODELLO[k] === categoria);
}

function conTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("gemini-timeout")), ms)),
  ]);
}

/**
 * Chiede a Gemini la chiave del modello 3D più adatta tra quelle DISPONIBILI per la
 * categoria. Output vincolato a un enum, quindi non può inventare chiavi. null se non
 * pertinente o in caso di qualsiasi errore.
 */
export async function classificaConGemini(
  nome: string,
  caratteristiche: string | undefined,
  categoria: CategoriaAttrezzo,
): Promise<string | null> {
  if (!geminiDisponibile()) return null;
  const disponibili = chiaviPerCategoria(categoria);
  if (disponibili.length === 0) return null;

  try {
    // import dinamico: l'SDK resta in un chunk separato, fuori dal bundle iniziale.
    const { GoogleGenAI, Type } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: CHIAVE! });
    const enumKeys = [...disponibili, "none"];
    const prompt =
      `Sei un classificatore di attrezzi e veicoli da giardinaggio/manutenzione del verde.\n` +
      `Dato il nome (in italiano) scegli la CHIAVE del modello 3D più adatta tra quelle elencate.\n` +
      `Categoria: ${categoria}\n` +
      `Nome: ${nome}\n` +
      `Caratteristiche: ${caratteristiche ?? "-"}\n` +
      `Chiavi disponibili: ${disponibili.join(", ")}\n` +
      `Se nessuna è davvero pertinente rispondi con "none". Rispondi solo con la chiave.`;

    const res = await conTimeout(
      ai.models.generateContent({
        model: MODELLO,
        contents: prompt,
        config: {
          temperature: 0,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: { key: { type: Type.STRING, enum: enumKeys } },
            required: ["key"],
          },
        },
      }),
      TIMEOUT_MS,
    );

    const parsed = JSON.parse(res.text ?? "{}") as { key?: string };
    const key = parsed.key;
    return key && key !== "none" && disponibili.includes(key) ? key : null;
  } catch {
    return null; // offline / quota / timeout / CORS → fallback locale
  }
}

/**
 * Punto d'ingresso unico per ricavare il modelKey da salvare sull'attrezzo.
 * 1) matcher locale: se è sicuro, lo usa (niente rete);
 * 2) altrimenti, se Gemini è disponibile, lo interpella;
 * 3) fallback: match locale debole (o null → il renderer userà il placeholder).
 * Chiamato UNA volta al salvataggio: il risultato viene messo in cache sul record.
 */
export async function risolviModelKey(
  nome: string,
  caratteristiche: string | undefined,
  categoria: CategoriaAttrezzo,
): Promise<string | null> {
  const locale = risolviModelloLocale(nome, caratteristiche, categoria);
  if (locale.certo && locale.key) return locale.key;

  if (geminiDisponibile()) {
    const daGemini = await classificaConGemini(nome, caratteristiche, categoria);
    if (daGemini) return daGemini;
  }
  return locale.key;
}
