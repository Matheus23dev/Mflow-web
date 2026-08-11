import { UsersRound } from "lucide-react";

export function CustomerSummaryStrip({ customers, active, loans }: { customers: number; active: number; loans: number }) {
  return (
    <div className="summary-strip">
      <div><span className="summary-icon"><UsersRound size={19} /></span><p><strong>{customers}</strong><span>clientes cadastrados</span></p></div>
      <div><p><strong>{active}</strong><span>com contratos ativos</span></p></div>
      <div><p><strong>{loans}</strong><span>contratos no histórico</span></p></div>
    </div>
  );
}
