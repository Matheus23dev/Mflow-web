import type { ReactNode } from "react";

export function CashMetricCard({ icon, tone, label, value }: { icon: ReactNode; tone: "purple" | "green" | "red"; label: string; value: ReactNode }) {
  return <article><span className={`cash-icon ${tone}`}><>{icon}</></span><div><p>{label}</p><strong>{value}</strong></div></article>;
}
