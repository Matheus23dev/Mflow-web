export function LoanProgress({ value }: { value: number }) {
  return <div className="loan-progress" aria-label={`Andamento de ${Math.round(value)}%`}><span style={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }} /></div>;
}
