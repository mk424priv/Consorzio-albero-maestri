import { storicoMensile } from "@/lib/conti";
import { euro, meseAnnoIT } from "@/lib/format";
import { Titolo, Vuoto } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function StoricoPage() {
  const righe = await storicoMensile();

  return (
    <div>
      <Titolo titolo="Storico mensile" sottotitolo="Mese per mese: atteso, incassato, uscite, saldo" />

      {righe.length === 0 ? (
        <Vuoto testo="Ancora nessun movimento registrato." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Mese</th>
                <th className="text-right">Atteso</th>
                <th className="text-right">Incassato</th>
                <th className="text-right">Uscite</th>
                <th className="text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {righe.map((r) => (
                <tr key={r.chiave}>
                  <td className="font-medium">{meseAnnoIT(r.anno, r.mese)}</td>
                  <td className="text-right text-[var(--muted)]">{euro(r.atteso)}</td>
                  <td className="text-right text-[var(--success)]">{euro(r.incassato)}</td>
                  <td className="text-right text-[var(--danger)]">{euro(r.uscite)}</td>
                  <td className={`text-right font-medium ${r.saldo >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                    {euro(r.saldo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-[var(--muted)] mt-4">
        Atteso = pagamenti emessi nel mese · Incassato = pagamenti incassati nel mese · Saldo = incassato − uscite.
      </p>
    </div>
  );
}
