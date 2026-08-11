import type { ReactNode } from "react";

export function DashboardMetricCard({ featured = false, children }: { featured?: boolean; children: ReactNode }) {
  return <article className={`metric-card ${featured ? "metric-featured" : ""}`}>{children}</article>;
}
