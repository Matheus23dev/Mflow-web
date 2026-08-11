import type { ReactNode } from "react";

export function CollectionSummaryCard({ icon, tone, label, value, detail }: { icon: ReactNode; tone: "purple" | "red"; label: string; value: ReactNode; detail: string }) {
  return (
    <div>
      <span className={`summary-icon ${tone}`}>{icon}</span>
      <p><span>{label}</span><strong>{value}</strong><small>{detail}</small></p>
    </div>
  );
}
