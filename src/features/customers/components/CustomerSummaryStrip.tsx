import { UsersRound } from "lucide-react";

export function CustomerSummaryStrip({ customers, active, loans }: { customers: number; active: number; loans: number }) {
  return (
    <div className="summary-strip mb-[17px] grid grid-cols-1 rounded-[13px] border border-[#e9e7ef] bg-white p-2.5 min-[421px]:grid-cols-2 min-[641px]:flex min-[641px]:items-stretch min-[641px]:px-[18px] min-[641px]:py-[14px]">
      <div className="flex min-w-0 items-center gap-2.5 p-2 min-[641px]:min-w-40 min-[641px]:py-0 min-[641px]:pr-[26px]"><span className="summary-icon grid size-[35px] shrink-0 place-items-center rounded-[10px] bg-violet-50 text-violet-600"><UsersRound size={19} /></span><p className="m-0 flex min-w-0 flex-col"><strong className="text-lg">{customers}</strong><span className="text-[11px] text-[#96919e]">clientes cadastrados</span></p></div>
      <div className="flex min-w-0 items-center gap-2.5 border-t border-[#ece9f0] p-2 min-[421px]:border-t-0 min-[641px]:min-w-40 min-[641px]:border-l min-[641px]:py-0 min-[641px]:pl-[27px] min-[641px]:pr-[26px]"><p className="m-0 flex min-w-0 flex-col"><strong className="text-lg">{active}</strong><span className="text-[11px] text-[#96919e]">com contratos ativos</span></p></div>
      <div className="flex min-w-0 items-center gap-2.5 border-t border-[#ece9f0] p-2 min-[421px]:col-span-2 min-[641px]:min-w-40 min-[641px]:border-t-0 min-[641px]:border-l min-[641px]:py-0 min-[641px]:pl-[27px] min-[641px]:pr-[26px]"><p className="m-0 flex min-w-0 flex-col"><strong className="text-lg">{loans}</strong><span className="text-[11px] text-[#96919e]">contratos no histórico</span></p></div>
    </div>
  );
}
