import { useMemo } from "react";
import { History } from "lucide-react";
import { useStore } from "@/store/store";
import { storicoMensile } from "@/lib/conti";
import { euro, meseAnnoIT } from "@/lib/format";
import { Card, EmptyState, PageHeader } from "@/components/ui";

export function Storico() {
  const db = useStore((s) => s.db);
  const righe = useMemo(() => storicoMensile(db), [db]);

  return (
    <div>
      <PageHeader
        titolo="Storico mensile"
        sottotitolo="Mese per mese: atteso, incassato, uscite, saldo"
        icona={<History size={22} />}
      />

      {righe.length === 0 ? (
        <EmptyState icona={<History size={26} />} testo="Ancora nessun movimento registrato." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="am-table">
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
                  <td className="font-medium text-ink">{meseAnnoIT(r.anno, r.mese)}</td>
                  <td className="text-right text-muted">{euro(r.atteso)}</td>
                  <td className="text-right text-success">{euro(r.incassato)}</td>
                  <td className="text-right text-danger">{euro(r.uscite)}</td>
                  <td className={`text-right font-semibold ${r.saldo >= 0 ? "text-success" : "text-danger"}`}>{euro(r.saldo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <p className="mt-4 text-xs text-muted">
        Atteso = pagamenti emessi nel mese · Incassato = pagamenti incassati nel mese · Saldo = incassato − uscite.
      </p>
    </div>
  );
}
