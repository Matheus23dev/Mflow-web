import type { ReactNode } from "react";

export function CollectionSummaryCard({ icon, tone, label, value, detail }: { icon: ReactNode; tone: "purple" | "red"; label: string; value: ReactNode; detail: string }) {
  const toneClasses = tone === "red" ? "bg-rose-50 text-rose-500" : "bg-violet-50 text-violet-600";
  return (
    <div className="flex items-center gap-[13px] rounded-[13px] border border-[#e9e7ef] bg-white px-[18px] py-4">
      <span className={`summary-icon grid size-[35px] shrink-0 place-items-center rounded-[10px] ${toneClasses}`}>{icon}</span>
      <p className="m-0 grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-[3px]"><span className="self-end text-xs leading-tight text-[#888391]">{label}</span><strong className="col-start-2 row-span-2 row-start-1 self-center justify-self-end text-[21px] leading-none tracking-[-0.35px]">{value}</strong><small className="col-start-1 self-start text-[10px] leading-tight text-[#aaa5af]">{detail}</small></p>
    </div>
  );
}
