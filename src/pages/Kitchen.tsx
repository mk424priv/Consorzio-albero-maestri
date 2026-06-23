import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Codice,
  Field,
  Modal,
  Segmented,
  Sheet,
  Stamp,
  Targhetta,
} from "@/components/ui";

/*
  Tappa 1 — vetrina del design system ("kitchen sink").
  Mostra token, tipografia e tutti i primitivi nei loro caratteri.
  Temporanea: in Tappa 3 l'App passa alla shell di navigazione.
*/

const carte = [
  ["carta", "bg-carta"],
  ["carta-alta", "bg-carta-alta"],
  ["carta-bassa", "bg-carta-bassa"],
  ["carta-ombra", "bg-carta-ombra"],
  ["carta-svolto", "bg-carta-svolto"],
  ["carta-programmato", "bg-carta-programmato"],
  ["carta-incasso", "bg-carta-incasso"],
] as const;

const inchiostri = [
  ["inchiostro", "bg-inchiostro"],
  ["medio", "bg-inchiostro-medio"],
  ["debole", "bg-inchiostro-debole"],
] as const;

const accenti = [
  ["ottone", "bg-ottone"],
  ["ottone-scuro", "bg-ottone-scuro"],
  ["lichene", "bg-lichene"],
  ["positivo", "bg-positivo"],
  ["attenzione", "bg-attenzione"],
  ["critico", "bg-critico"],
] as const;

function Sezione({ titolo, children }: { titolo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-inchiostro-debole">
        {titolo}
      </h2>
      {children}
    </section>
  );
}

export function Kitchen() {
  const [carattere, setCarattere] = useState<"svolto" | "programmato">("svolto");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="grana min-h-dvh">
      <div className="mx-auto flex max-w-md flex-col gap-9 px-5 py-10">
        <header className="flex flex-col gap-1">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-inchiostro-debole">
            design system · vetrina
          </p>
          <h1 className="font-display text-4xl font-semibold text-inchiostro">
            Quaderno di bottega
          </h1>
          <p className="text-sm text-inchiostro-medio">
            Carta, inchiostro, ottone. Materiale, non colore.
          </p>
        </header>

        <Sezione titolo="Palette">
          <div className="grid grid-cols-4 gap-2">
            {[...carte, ...inchiostri, ...accenti].map(([name, bg]) => (
              <div key={name} className="flex flex-col gap-1">
                <div className={`h-12 rounded-targhetta border border-carta-ombra ${bg}`} />
                <span className="font-mono text-[0.6rem] text-inchiostro-debole">{name}</span>
              </div>
            ))}
          </div>
        </Sezione>

        <Sezione titolo="Tipografia">
          <Card className="flex flex-col gap-2 p-4">
            <p className="font-display text-3xl text-inchiostro">Fraunces · titoli e date</p>
            <p className="font-sans text-base text-inchiostro-medio">
              Inter · corpo del testo, leggibile al sole in campo.
            </p>
            <p className="font-mono text-lg tabular-nums text-ottone-scuro">
              IBM Plex Mono · € 1.240,00 · IS-12-04-03
            </p>
          </Card>
        </Sezione>

        <Sezione titolo="Bottoni">
          <div className="flex flex-wrap gap-2">
            <Button variant="ottone">Ottone</Button>
            <Button variant="inchiostro">Inchiostro</Button>
            <Button variant="tenue">Tenue</Button>
            <Button variant="fantasma">Fantasma</Button>
            <Button variant="critico">Critico</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm">sm</Button>
            <Button size="md">md</Button>
            <Button size="lg">lg</Button>
            <Button size="icona" aria-label="aggiungi">+</Button>
          </div>
        </Sezione>

        <Sezione titolo="Stati (badge, codice, timbro)">
          <div className="flex flex-wrap items-center gap-2">
            <Badge stato="positivo">pagato</Badge>
            <Badge stato="attenzione">da incassare</Badge>
            <Badge stato="critico">scaduto</Badge>
            <Badge stato="lichene">potatura</Badge>
            <Badge stato="ottone">preventivo</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Codice value="RS-08-04-02" />
            <Stamp>svolto</Stamp>
            <Stamp color="lichene">programmato</Stamp>
          </div>
        </Sezione>

        <Sezione titolo="Targhetta (oggetto-eroe)">
          <div className="flex items-center gap-3">
            <Targhetta giorno={24} giornoSettimana="mar" mese="giu" />
            <Targhetta giorno={1} giornoSettimana="lun" mese="lug" />
          </div>
        </Sezione>

        <Sezione titolo="Superfici / carattere">
          <Card tono="svolto" className="p-4">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg">Svolto</span>
              <Stamp>fatto</Stamp>
            </div>
            <p className="mt-1 text-sm text-inchiostro-medio">
              Caldo, posato, "ricevuta". Non trema piu'.
            </p>
          </Card>
          <Card tono="programmato" className="p-4">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg">Programmato</span>
              <Stamp color="lichene">da fare</Stamp>
            </div>
            <p className="mt-1 text-sm text-inchiostro-medio">
              Freddo, leggero, "copia a matita". Galleggia.
            </p>
          </Card>
          <Card tono="incasso" className="p-4">
            <span className="font-display text-lg text-inchiostro-chiaro">Cassa</span>
            <p className="mt-1 font-mono text-2xl tabular-nums text-ottone-chiaro">€ 3.480,00</p>
            <p className="text-sm text-inchiostro-chiaro/70">Scuro, ottone, inciso come metallo.</p>
          </Card>
        </Sezione>

        <Sezione titolo="Form / segmentato">
          <Field label="Cliente" placeholder="Nome o ragione sociale" />
          <Field label="Tariffa oraria" placeholder="0,00" suffix="€/h" inputMode="decimal" />
          <Segmented
            value={carattere}
            onValueChange={setCarattere}
            options={[
              { value: "svolto", label: "Svolto" },
              { value: "programmato", label: "Programmato" },
            ]}
          />
          <p className="text-sm text-inchiostro-debole">
            Selezionato: <span className="font-mono text-inchiostro-medio">{carattere}</span>
          </p>
        </Sezione>

        <Sezione titolo="Fogli">
          <div className="flex gap-2">
            <Button variant="inchiostro" onClick={() => setSheetOpen(true)}>
              Apri foglio
            </Button>
            <Button variant="tenue" onClick={() => setModalOpen(true)}>
              Apri modale
            </Button>
          </div>
        </Sezione>

        <Sheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title="Foglio di esempio"
          description="Sale dal basso come una pagina."
        >
          <div className="flex flex-col gap-3">
            <Field label="Ore" placeholder="0" suffix="h" inputMode="decimal" />
            <Button onClick={() => setSheetOpen(false)}>Salva</Button>
          </div>
        </Sheet>

        <Modal
          open={modalOpen}
          onOpenChange={setModalOpen}
          title="Imposta la tariffa"
          description="Serve per calcolare il lavoro a ore."
        >
          <div className="flex flex-col gap-3">
            <Field label="Tariffa oraria" placeholder="0,00" suffix="€/h" inputMode="decimal" />
            <div className="flex justify-end gap-2">
              <Button variant="fantasma" onClick={() => setModalOpen(false)}>
                Annulla
              </Button>
              <Button onClick={() => setModalOpen(false)}>Conferma</Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
