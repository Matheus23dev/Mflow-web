import type { ReactNode } from "react";

export function DashboardMetricCard({ featured = false, children }: { featured?: boolean; children: ReactNode }) {
  return (
    <article className={`metric-card min-w-0 rounded-[14px] border p-3 shadow-[0_3px_14px_rgba(42,35,65,0.025)] min-[641px]:p-[19px] ${featured
      ? "metric-featured border-transparent bg-gradient-to-br from-[#7150df] to-[#5e3bcf] text-white shadow-[0_10px_28px_rgba(103,65,213,0.2)] [&_.metric-foot]:border-white/10 [&_.metric-foot]:text-white/70 [&_.metric-foot_button]:text-white [&_.metric-icon]:bg-white/15 [&_.metric-icon]:text-white [&_.metric-trend]:bg-white/10 [&_.metric-trend]:text-white [&>p]:text-white/70 [&>strong]:text-white"
      : "border-[#e9e7ef] bg-white"}`}>
      {children}
    </article>
  );
}
