import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, ExternalLink, Monitor, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Btn, Campo, Chip, PannelloAnimato, TitoloSezione, Vuoto } from "@/components/ui";

/**
 * MODULI: collega le tue web-app (Vercel/GitHub Pages/…) come sotto-applicazioni.
 * "Incorporata" le apre dentro NEXUS (iframe — il sito non deve bloccare l'embed
 * con X-Frame-Options/CSP); "Scheda esterna" le apre in una nuova scheda.
 */
export function Integrazioni() {
  const integrazioni = useStore((s) => s.integrazioni);
  const creaIntegrazione = useStore((s) => s.creaIntegrazione);
  const eliminaIntegrazione = useStore((s) => s.eliminaIntegrazione);

  const [aperto, setAperto] = useState(false);
  const [nome, setNome] = useState("");
  const [url, setUrl] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [modalita, setModalita] = useState<"iframe" | "link">("iframe");

  const valido = nome.trim() && /^https:\/\/.+/i.test(url.trim());

  const salva = async () => {
    if (!valido) return;
    await creaIntegrazione({
      nome: nome.trim(),
      url: url.trim(),
      descrizione: descrizione.trim(),
      modalita,
    });
    setNome(""); setUrl(""); setDescrizione(""); setAperto(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-start justify-between gap-3">
        <TitoloSezione sub="Le tue web-app collegate come sotto-applicazioni di NEXUS.">
          MODULI ESTERNI
        </TitoloSezione>
        <Btn variante="neon" onClick={() => setAperto(!aperto)}>
          <Plus className="size-4" /> Collega app
        </Btn>
      </div>

      {aperto && (
        <PannelloAnimato className="space-y-3 p-5">
          <Campo label="Nome" placeholder="es. Calcolatore fiscale" value={nome} onChange={(e) => setNome(e.target.value)} />
          <Campo label="URL (https)" placeholder="https://mia-app.vercel.app" value={url} onChange={(e) => setUrl(e.target.value)} />
          <Campo label="Descrizione (facoltativa)" value={descrizione} onChange={(e) => setDescrizione(e.target.value)} />
          <div className="flex gap-2">
            <Chip attivo={modalita === "iframe"} onClick={() => setModalita("iframe")}>
              <Monitor className="mr-1 inline size-3.5" /> Incorporata
            </Chip>
            <Chip attivo={modalita === "link"} onClick={() => setModalita("link")}>
              <ExternalLink className="mr-1 inline size-3.5" /> Scheda esterna
            </Chip>
          </div>
          <Btn variante="neon" disabled={!valido} onClick={() => void salva()}>
            Salva modulo
          </Btn>
        </PannelloAnimato>
      )}

      {integrazioni.length === 0 && !aperto ? (
        <PannelloAnimato>
          <Vuoto
            icona="⎔"
            titolo="Nessun modulo collegato."
            sub="Collega le web-app che hai pubblicato su Vercel o GitHub Pages."
          />
        </PannelloAnimato>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {integrazioni.map((m, i) => (
            <PannelloAnimato key={m.id} delay={i * 0.05} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-ice">{m.nome}</div>
                  <div className="truncate text-[10px] text-ghost">{m.url}</div>
                  {m.descrizione && <div className="mt-1 text-xs text-ghost">{m.descrizione}</div>}
                </div>
                <button
                  title="Scollega"
                  onClick={() => void eliminaIntegrazione(m.id)}
                  className="cursor-pointer rounded-md p-1.5 text-faint transition-colors hover:text-danger"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="mt-3">
                {m.modalita === "iframe" ? (
                  <Link to={`/integrazioni/${m.id}`}>
                    <Btn variante="neon" className="w-full"><Monitor className="size-4" /> Apri in NEXUS</Btn>
                  </Link>
                ) : (
                  <a href={m.url} target="_blank" rel="noreferrer">
                    <Btn className="w-full"><ExternalLink className="size-4" /> Apri</Btn>
                  </a>
                )}
              </div>
            </PannelloAnimato>
          ))}
        </div>
      )}
    </div>
  );
}

/** Modulo incorporato: la web-app esterna gira dentro NEXUS. */
export function ModuloIncorporato() {
  const { id } = useParams<{ id: string }>();
  const modulo = useStore((s) => s.integrazioni.find((m) => m.id === id));

  if (!modulo) {
    return <Vuoto icona="∅" titolo="Modulo non trovato." />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Link to="/integrazioni" className="text-ghost transition-colors hover:text-neon">
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-ice">{modulo.nome}</h1>
          <div className="text-[10px] tracking-widest text-ghost">{modulo.url}</div>
        </div>
        <a href={modulo.url} target="_blank" rel="noreferrer" className="ml-auto text-ghost transition-colors hover:text-neon" title="Apri in una nuova scheda">
          <ExternalLink className="size-4" />
        </a>
      </div>
      <iframe
        src={modulo.url}
        title={modulo.nome}
        className="h-[calc(100dvh-14rem)] w-full rounded-2xl border border-ice/10 bg-white"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
      />
    </div>
  );
}
