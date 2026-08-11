export function LoanProgress({ value }: { value: number }) {
  return <div className="loan-progress h-0.5 bg-[#f0edf4]" aria-label={`Andamento de ${Math.round(value)}%`}><span className="block h-full rounded bg-gradient-to-r from-[#8f73eb] to-[#6540d9]" style={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }} /></div>;
}
