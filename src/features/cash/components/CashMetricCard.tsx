import type { ReactNode } from "react";

export function CashMetricCard({ icon, tone, label, value }: { icon: ReactNode; tone: "purple" | "green" | "red"; label: string; value: ReactNode }) {
  const toneClasses = tone === "green" ? "bg-emerald-50 text-emerald-600" : tone === "red" ? "bg-rose-50 text-rose-500" : "bg-violet-50 text-violet-600";
  return <article className="flex min-w-0 items-center gap-[13px] rounded-[13px] border border-[#e9e7ef] bg-white px-[19px] py-[17px]"><span className={`cash-icon grid size-[35px] shrink-0 place-items-center rounded-[10px] ${toneClasses}`}><>{icon}</></span><div className="flex min-w-0 flex-col"><p className="m-0 text-xs text-[#8d8896]">{label}</p><strong className="mt-1 overflow-hidden text-[22px] tracking-[-0.35px] text-ellipsis whitespace-nowrap">{value}</strong></div></article>;
}
