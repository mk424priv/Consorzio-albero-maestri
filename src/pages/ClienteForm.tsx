import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Sprout } from "lucide-react";
import { useStore } from "@/store/store";
import { MODALITA, etichetta } from "@/lib/dominio";
import type { Modalita } from "@/lib/dominio";
import type { Cliente } from "@/lib/types";
import { Button, Card, Field, Input, LinkButton, PageHeader, Select, Textarea } from "@/components/ui";
import { useToast } from "@/store/toast";

interface Valori {
  nome: string;
  cognome: string;
  telefono: string;
  email: string;
  luogo: string;
  modalitaPredefinita: Modalita;
  tariffaOraria: string;
  note: string;
}

function FormCliente({
  iniziali,
  onSubmit,
  testoBottone,
}: {
  iniziali: Valori;
  onSubmit: (v: Valori) => void;
  testoBottone: string;
}) {
  const [v, setV] = useState<Valori>(iniziali);
  const set = (k: keyof Valori) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  return (
    <Card className="max-w-2xl p-6 anim-fade-up">
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(v);
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome *"><Input value={v.nome} onChange={set("nome")} required /></Field>
          <Field label="Cognome *"><Input value={v.cognome} onChange={set("cognome")} required /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Telefono"><Input value={v.telefono} onChange={set("telefono")} /></Field>
          <Field label="Email"><Input type="email" value={v.email} onChange={set("email")} /></Field>
        </div>
        <Field label="Luogo (villa, giardino, zona)">
          <Input value={v.luogo} onChange={set("luogo")} placeholder="es. Villa Rossi, Marina di Campo (Elba)" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Accordo economico">
            <Select value={v.modalitaPredefinita} onChange={set("modalitaPredefinita")}>
              {MODALITA.map((m) => <option key={m} value={m}>{etichetta(m)}</option>)}
            </Select>
          </Field>
          <Field label="Tariffa oraria (€/h)">
            <Input type="number" step="0.01" value={v.tariffaOraria} onChange={set("tariffaOraria")} placeholder="es. 30" />
          </Field>
        </div>
        <Field label="Note"><Textarea rows={2} value={v.note} onChange={set("note")} /></Field>
        <div>
          <Button variante="primary" type="submit"><Save size={16} /> {testoBottone}</Button>
        </div>
      </form>
    </Card>
  );
}

const vuoto: Valori = {
  nome: "",
  cognome: "",
  telefono: "",
  email: "",
  luogo: "",
  modalitaPredefinita: "preventivo",
  tariffaOraria: "",
  note: "",
};

function aNumero(s: string): number | null {
  const t = s.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function ClienteNuovo() {
  const creaCliente = useStore((s) => s.creaCliente);
  const navigate = useNavigate();
  const mostra = useToast((s) => s.mostra);

  return (
    <div>
      <PageHeader
        titolo="Nuovo cliente"
        sottotitolo="Il codice parlante si genera da solo"
        icona={<Sprout size={22} />}
        azione={<LinkButton to="/clienti"><ArrowLeft size={15} /> Clienti</LinkButton>}
      />
      <FormCliente
        iniziali={vuoto}
        testoBottone="Crea cliente"
        onSubmit={(v) => {
          if (!v.nome.trim() || !v.cognome.trim()) {
            mostra("Nome e cognome sono obbligatori.", "error");
            return;
          }
          const id = creaCliente({
            nome: v.nome,
            cognome: v.cognome,
            telefono: v.telefono || null,
            email: v.email || null,
            luogo: v.luogo || null,
            tariffaOraria: aNumero(v.tariffaOraria),
            modalitaPredefinita: v.modalitaPredefinita,
            note: v.note || null,
          });
          mostra("Cliente creato!");
          navigate(`/clienti/${id}`);
        }}
      />
    </div>
  );
}

export function ClienteModifica() {
  const { id = "" } = useParams();
  const db = useStore((s) => s.db);
  const aggiornaCliente = useStore((s) => s.aggiornaCliente);
  const navigate = useNavigate();
  const mostra = useToast((s) => s.mostra);

  const cliente = db.clienti.find((c) => c.id === id) as Cliente | undefined;
  if (!cliente) {
    return (
      <PageHeader titolo="Cliente non trovato" azione={<LinkButton to="/clienti"><ArrowLeft size={15} /> Clienti</LinkButton>} />
    );
  }

  const iniziali: Valori = {
    nome: cliente.nome,
    cognome: cliente.cognome,
    telefono: cliente.telefono ?? "",
    email: cliente.email ?? "",
    luogo: cliente.luogo ?? "",
    modalitaPredefinita: cliente.modalitaPredefinita,
    tariffaOraria: cliente.tariffaOraria != null ? String(cliente.tariffaOraria) : "",
    note: cliente.note ?? "",
  };

  return (
    <div>
      <PageHeader
        titolo="Modifica cliente"
        icona={<Sprout size={22} />}
        azione={<LinkButton to={`/clienti/${id}`}><ArrowLeft size={15} /> Annulla</LinkButton>}
      />
      <FormCliente
        iniziali={iniziali}
        testoBottone="Salva modifiche"
        onSubmit={(v) => {
          aggiornaCliente(id, {
            nome: v.nome.trim() || cliente.nome,
            cognome: v.cognome.trim() || cliente.cognome,
            telefono: v.telefono || null,
            email: v.email || null,
            luogo: v.luogo || null,
            tariffaOraria: aNumero(v.tariffaOraria),
            modalitaPredefinita: v.modalitaPredefinita,
            note: v.note || null,
          });
          mostra("Modifiche salvate!");
          navigate(`/clienti/${id}`);
        }}
      />
    </div>
  );
}
