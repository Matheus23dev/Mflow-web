import {
  ArrowRight,
  CircleDollarSign,
  HandCoins,
  Plus,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import { compactDate, money } from "@/shared/lib/format";
import type { AppPage } from "@/shared/layout/AppShell";
import { Avatar, Button, EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "@/shared/ui";
import { useDashboard } from "../hooks/useDashboard";

type PortfolioKind = "weekly" | "monthly";

const percentage = (value: number) => `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}%`;

export function DashboardPage({ refreshKey, onNavigate, onNewLoan }: { refreshKey: number; onNavigate: (page: AppPage) => void; onNewLoan: () => void }) {
  const { data, error, reload } = useDashboard(refreshKey);
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioKind>("weekly");

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Bom dia" : currentHour < 18 ? "Boa tarde" : "Boa noite";

  if (!data && !error) return <LoadingState label="Preparando sua visão geral" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const m = data.metrics;
  const weekly = data.portfolios.weekly;
  const monthly = data.portfolios.monthlyInterest;
  const isWeekly = selectedPortfolio === "weekly";
  const mainPortfolioMetrics = isWeekly
    ? [
        ["Capital emprestado", money(weekly.capitalLent), "principal dos contratos ativos"],
        ["Total com juros", money(weekly.totalContracted), "valor total contratado"],
        ["Já recebido", money(weekly.received), "parcelas confirmadas"],
        ["Falta receber", money(weekly.remainingReceivable), "parcelas ainda em aberto"],
      ]
    : [
        ["Capital emprestado", money(monthly.capitalLent), "principal dos contratos ativos"],
        ["Juros do mês", money(monthly.interestDueThisMonth), "previstos para este mês"],
        ["Juros recebidos", money(monthly.interestReceivedThisMonth), "confirmados neste mês"],
        ["Falta receber", money(monthly.interestRemainingThisMonth), "juros pendentes do mês"],
      ];
  const secondaryPortfolioMetrics = isWeekly
    ? [
        ["Lucro contratado", money(weekly.contractedProfit)],
        ["Em atraso", money(weekly.overdueAmount)],
        ["Recebido", percentage(weekly.collectionRate)],
        ["Contratos", String(weekly.activeContracts)],
      ]
    : [
        ["Capital em circulação", money(monthly.capitalInCirculation)],
        ["Atrasos anteriores", money(monthly.previousInterestOverdue)],
        ["Capital devolvido", money(monthly.principalReturnedThisMonth)],
        ["Rentabilidade", percentage(monthly.monthlyYieldRate)],
      ];

  return (
    <div className="page-enter data-page dashboard-page min-w-0 max-w-full min-[861px]:flex min-[861px]:h-full min-[861px]:min-h-0 min-[861px]:flex-col min-[861px]:overflow-hidden">
      <PageHeader
        eyebrow={`${greeting} · ${new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(new Date())}`}
        title="Visão geral da operação"
        description="Acompanhe cada modalidade separadamente, sem misturar os valores."
        action={<Button onClick={onNewLoan}><Plus size={18} /> Novo empréstimo</Button>}
      />

      <div className="rounded-2xl border border-[#e6e2ec] bg-white p-2 shadow-[0_7px_25px_rgba(47,38,73,0.06)]">
        <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-[#f5f3f8] p-1" role="tablist" aria-label="Modalidade da carteira">
          <button type="button" role="tab" aria-selected={isWeekly} onClick={() => setSelectedPortfolio("weekly")} className={`flex min-w-0 items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-[11px] font-bold transition min-[421px]:text-xs ${isWeekly ? "bg-white text-violet-700 shadow-[0_3px_10px_rgba(57,42,89,0.1)]" : "text-slate-500 hover:text-slate-700"}`}><HandCoins className="shrink-0" size={17} /><span className="truncate">Parcelados</span></button>
          <button type="button" role="tab" aria-selected={!isWeekly} onClick={() => setSelectedPortfolio("monthly")} className={`flex min-w-0 items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-[11px] font-bold transition min-[421px]:text-xs ${!isWeekly ? "bg-white text-emerald-700 shadow-[0_3px_10px_rgba(57,42,89,0.1)]" : "text-slate-500 hover:text-slate-700"}`}><CircleDollarSign className="shrink-0" size={17} /><span className="truncate">Juros mensal</span></button>
        </div>

        <section className={`mt-2 overflow-hidden rounded-xl border p-3.5 min-[641px]:p-4 ${isWeekly ? "border-violet-100 bg-gradient-to-br from-[#fbfaff] to-[#f4f0ff]" : "border-emerald-100 bg-gradient-to-br from-white to-emerald-50/80"}`}>
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex min-w-0 items-center gap-2.5"><span className={`grid size-9 shrink-0 place-items-center rounded-[10px] ${isWeekly ? "bg-violet-100 text-violet-700" : "bg-emerald-100 text-emerald-700"}`}>{isWeekly ? <HandCoins size={20} /> : <CircleDollarSign size={20} />}</span><div className="min-w-0"><span className={`text-[9px] font-extrabold uppercase tracking-[1.2px] ${isWeekly ? "text-violet-600" : "text-emerald-600"}`}>Carteira selecionada</span><h2 className="mt-0.5 truncate text-[15px] font-bold text-slate-900 min-[421px]:text-base">{isWeekly ? "Empréstimos parcelados" : "Juros mensal"}</h2></div></div>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${isWeekly ? "bg-violet-100 text-violet-700" : "bg-emerald-100 text-emerald-700"}`}>{isWeekly ? weekly.activeContracts : monthly.activeContracts} ativos</span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 min-[641px]:grid-cols-4 min-[641px]:gap-2.5">
            {mainPortfolioMetrics.map(([label, value, caption], index) => (
              <div className="min-w-0 rounded-xl border border-white bg-white/90 p-3 shadow-[0_2px_8px_rgba(45,37,67,0.04)]" key={label}>
                <span className="block truncate text-[10px] text-slate-500 min-[421px]:text-[10.5px]">{label}</span>
                <strong className={`mt-1 block overflow-hidden text-[clamp(14px,4.4vw,21px)] font-extrabold tracking-[-0.5px] text-ellipsis whitespace-nowrap ${!isWeekly && index === 2 ? "text-emerald-700" : "text-slate-900"}`}>{value}</strong>
                <small className="mt-1 hidden text-[9.5px] leading-4 text-slate-400 min-[641px]:block">{caption}</small>
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 min-[641px]:grid-cols-4">
            {secondaryPortfolioMetrics.map(([label, value]) => <div className="min-w-0 rounded-lg border border-slate-200/80 bg-white/55 px-2.5 py-2" key={label}><span className="block truncate text-[9.5px] text-slate-500">{label}</span><strong className="mt-0.5 block overflow-hidden text-xs text-slate-800 text-ellipsis whitespace-nowrap">{value}</strong></div>)}
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-slate-200/70 pt-2.5"><p className="m-0 hidden text-[10.5px] leading-5 text-slate-500 min-[641px]:block">{isWeekly ? "Juros de atraso ficam separados dos juros contratados." : "Juros futuros ainda não gerados não entram nos totais."}</p><button className={`ml-auto inline-flex items-center gap-1 border-0 bg-transparent p-0 text-[11px] font-bold ${isWeekly ? "text-violet-700" : "text-emerald-700"}`} onClick={() => onNavigate("loans")}>Ver empréstimos <ArrowRight size={14} /></button></div>
        </section>
      </div>

      <div className="dashboard-grid mt-[17px] grid min-w-0 grid-cols-1 gap-[14px] min-[861px]:min-h-0 min-[861px]:flex-1 min-[1121px]:grid-cols-[minmax(0,1.7fr)_minmax(260px,.7fr)] min-[1121px]:gap-4">
        <section className="panel upcoming-panel overflow-hidden rounded-[14px] border border-[#e9e7ef] bg-white shadow-[0_3px_14px_rgba(42,35,65,0.025)] min-[861px]:flex min-[861px]:min-h-0 min-[861px]:flex-col">
          <div className="panel-header flex items-center justify-between gap-[15px] px-5 pb-[14px] pt-[19px]"><div><span className="eyebrow m-0 text-[9.5px] font-extrabold uppercase tracking-[1.2px] text-violet-600">Agenda financeira</span><h2 className="mb-0 mt-1 text-base tracking-[-0.2px] text-[#302c39]">Próximas cobranças</h2></div><button className="text-button inline-flex items-center gap-[5px] border-0 bg-transparent p-0 text-[11px] font-bold text-violet-600" onClick={() => onNavigate("collections")}>Ver agenda completa <ArrowRight size={15} /></button></div>
          {data.upcoming.length ? (
            <div className="collection-list compact px-[11px] pb-2.5 min-[861px]:min-h-0 min-[861px]:flex-1 min-[861px]:overflow-y-auto min-[861px]:overscroll-contain">
              {data.upcoming.slice(0, 6).map((item) => (
                <button className="collection-row grid w-full grid-cols-[40px_29px_minmax(80px,1fr)_auto] items-center gap-2 border-0 border-t border-[#f0eef3] bg-transparent px-1.5 py-[9px] text-left text-inherit transition hover:rounded-[9px] hover:bg-[#faf9fc] min-[641px]:grid-cols-[43px_31px_minmax(120px,1fr)_auto_18px] min-[641px]:gap-2.5 min-[641px]:px-[9px] min-[641px]:py-2.5" key={item.id} onClick={() => onNavigate("collections")}>
                  <div className={`date-tile flex h-[42px] w-10 flex-col items-center justify-center rounded-[9px] border leading-none ${item.status === "OVERDUE" ? "overdue border-rose-200 bg-rose-50 text-rose-600" : "border-[#e8e4f0] bg-[#f5f2ff] text-[#5f42c3]"}`}><strong className="text-sm">{new Date(item.dueDate).getUTCDate().toString().padStart(2, "0")}</strong><span className="mt-1 text-[7.5px] font-bold uppercase">{compactDate(item.dueDate).split(" ")[1]}</span></div>
                  <Avatar name={item.customer.name} size="sm" />
                  <div className="collection-person flex min-w-0 flex-col"><strong className="overflow-hidden text-[12.5px] text-ellipsis whitespace-nowrap">{item.customer.name}</strong><span className="mt-[3px] text-[10.5px] text-[#97929f]">{item.label}</span></div>
                  <div className="collection-value flex min-w-[72px] flex-col items-end gap-1 min-[641px]:min-w-[90px]"><strong className="text-[12.5px]">{money(item.updatedAmount)}</strong><StatusBadge status={item.status} /></div>
                  <ArrowRight className="row-arrow hidden text-[#aaa6b1] min-[641px]:block" size={16} />
                </button>
              ))}
            </div>
          ) : <EmptyState title="Agenda tranquila" description="Nenhuma cobrança para os próximos sete dias." />}
        </section>

        <aside className="dashboard-aside flex min-w-0 flex-col gap-3 min-[641px]:gap-4 min-[861px]:min-h-0">
          <section className="panel flex-1 rounded-[14px] border border-[#e9e7ef] bg-white p-4 shadow-[0_3px_14px_rgba(42,35,65,0.025)] min-[641px]:p-5">
            <span className="text-[9.5px] font-extrabold uppercase tracking-[1.2px] text-violet-600">Resumo operacional</span>
            <h2 className="mb-0 mt-1 text-base tracking-[-0.2px] text-[#302c39]">Carteira ativa</h2>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3"><span className="grid size-8 place-items-center rounded-lg bg-violet-100 text-violet-700"><UsersRound size={17} /></span><strong className="mt-2 block text-lg">{m.activeCustomers}</strong><small className="text-[10.5px] text-slate-500">clientes ativos</small></div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3"><span className="grid size-8 place-items-center rounded-lg bg-violet-100 text-violet-700"><HandCoins size={17} /></span><strong className="mt-2 block text-lg">{m.activeLoans}</strong><small className="text-[10.5px] text-slate-500">contratos ativos</small></div>
              <div className="rounded-xl border border-rose-100 bg-rose-50 p-3"><span className="grid size-8 place-items-center rounded-lg bg-rose-100 text-rose-600"><TrendingUp size={17} /></span><strong className="mt-2 block text-lg">{m.overdueLoans}</strong><small className="text-[10.5px] text-slate-500">contratos atrasados</small></div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3"><span className="grid size-8 place-items-center rounded-lg bg-emerald-100 text-emerald-700"><CircleDollarSign size={17} /></span><strong className="mt-2 block text-lg">{m.renewals}</strong><small className="text-[10.5px] text-slate-500">renovações</small></div>
            </div>
            <Button className="mt-3 w-full" variant="secondary" onClick={() => onNavigate("collections")}>Ver cobranças <ArrowRight size={15} /></Button>
          </section>
        </aside>
      </div>
    </div>
  );
}
