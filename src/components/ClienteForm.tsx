import { MODALITA, etichetta } from "@/lib/dominio";

type ClienteVals = {
  id?: string;
  nome?: string;
  cognome?: string;
  telefono?: string | null;
  email?: string | null;
  luogo?: string | null;
  tariffaOraria?: number | null;
  modalitaPredefinita?: string;
  note?: string | null;
};

export default function ClienteForm({
  action,
  cliente,
  testoBottone,
}: {
  action: (fd: FormData) => void | Promise<void>;
  cliente?: ClienteVals;
  testoBottone: string;
}) {
  return (
    <form action={action} className="card p-6 grid gap-4 max-w-2xl">
      {cliente?.id && <input type="hidden" name="id" value={cliente.id} />}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Nome *</label>
          <input name="nome" className="input" defaultValue={cliente?.nome ?? ""} required />
        </div>
        <div>
          <label className="label">Cognome *</label>
          <input name="cognome" className="input" defaultValue={cliente?.cognome ?? ""} required />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Telefono</label>
          <input name="telefono" className="input" defaultValue={cliente?.telefono ?? ""} />
        </div>
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" className="input" defaultValue={cliente?.email ?? ""} />
        </div>
      </div>
      <div>
        <label className="label">Luogo (villa, giardino, zona)</label>
        <input name="luogo" className="input" defaultValue={cliente?.luogo ?? ""} placeholder="es. Villa Rossi, Marina di Campo (Elba)" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Accordo economico</label>
          <select name="modalitaPredefinita" className="select" defaultValue={cliente?.modalitaPredefinita ?? "preventivo"}>
            {MODALITA.map((m) => (
              <option key={m} value={m}>{etichetta(m)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Tariffa oraria (€/h)</label>
          <input name="tariffaOraria" type="number" step="0.01" className="input" defaultValue={cliente?.tariffaOraria ?? ""} placeholder="es. 30" />
        </div>
      </div>
      <div>
        <label className="label">Note</label>
        <textarea name="note" className="textarea" rows={2} defaultValue={cliente?.note ?? ""} />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary">{testoBottone}</button>
      </div>
    </form>
  );
}
