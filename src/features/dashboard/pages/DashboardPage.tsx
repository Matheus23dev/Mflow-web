import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CircleDollarSign,
  HandCoins,
  Plus,
  TrendingUp,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { compactDate, money } from "@/shared/lib/format";
import type { AppPage } from "@/shared/layout/AppShell";
import { Avatar, Button, EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "@/shared/ui";
import { useDashboard } from "../hooks/useDashboard";
import { DashboardMetricCard } from "../components/DashboardMetricCard";

export function DashboardPage({ refreshKey, onNavigate, onNewLoan }: { refreshKey: number; onNavigate: (page: AppPage) => void; onNewLoan: () => void }) {
  const { data, error, reload } = useDashboard(refreshKey);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Bom dia" : currentHour < 18 ? "Boa tarde" : "Boa noite";

  if (!data && !error) return <LoadingState label="Preparando sua visão geral" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const m = data.metrics;
  const portfolioTotal = m.totalReceived + m.openBalance;
  const collectionRate = portfolioTotal > 0 ? Math.min(100, (m.totalReceived / portfolioTotal) * 100) : 0;
  const metricTopClass = "metric-top flex items-center justify-between gap-[7px]";
  const metricIconClass = "metric-icon grid size-[35px] place-items-center rounded-[10px]";
  const metricTrendClass = "metric-trend inline-flex items-center gap-[3px] whitespace-nowrap rounded-full px-[7px] py-1 text-[8.5px] font-bold max-[640px]:hidden";
  const metricLabelClass = "mb-[5px] mt-2 text-xs text-[#858090] min-[641px]:mt-4";
  const metricValueClass = "block overflow-hidden text-[clamp(15px,4.5vw,19px)] tracking-[-0.65px] text-ellipsis whitespace-nowrap min-[641px]:text-[clamp(21px,1.9vw,27px)]";
  const metricFootClass = "metric-foot mt-[11px] flex min-h-[18px] items-center justify-between gap-1.5 border-t border-[#f0eef3] pt-2.5 text-[11px] text-[#9995a1]";
  const metricLinkClass = "flex items-center gap-[3px] border-0 bg-transparent p-0 text-[11px] font-bold text-violet-600 max-[640px]:hidden";

  return (
    <div className="page-enter data-page dashboard-page min-w-0 max-w-full min-[861px]:flex min-[861px]:h-full min-[861px]:min-h-0 min-[861px]:flex-col min-[861px]:overflow-hidden">
      <PageHeader
        eyebrow={`${greeting} · ${new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(new Date())}`}
        title="Visão geral da operação"
        description="Acompanhe o que está acontecendo com seu dinheiro hoje."
        action={<Button onClick={onNewLoan}><Plus size={18} /> Novo empréstimo</Button>}
      />

      <div className="metric-grid metric-grid-main grid grid-cols-1 gap-2 min-[421px]:grid-cols-2 min-[641px]:gap-3 min-[1121px]:grid-cols-4 min-[1121px]:gap-[15px]">
        <DashboardMetricCard featured>
          <div className={metricTopClass}><span className={`${metricIconClass} bg-violet-50 text-violet-600`}><HandCoins size={20} /></span><span className={`${metricTrendClass} positive bg-emerald-50 text-emerald-700`}><ArrowUpRight size={14} /> Capital ativo</span></div>
          <p className={metricLabelClass}>Capital emprestado</p><strong className={metricValueClass}>{money(m.capitalLent)}</strong>
          <div className={metricFootClass}><span>{m.activeLoans} contratos ativos</span><button className={metricLinkClass} onClick={() => onNavigate("loans")}>Detalhes <ArrowRight size={14} /></button></div>
        </DashboardMetricCard>
        <DashboardMetricCard>
          <div className={metricTopClass}><span className={`${metricIconClass} green bg-emerald-50 text-emerald-600`}><CircleDollarSign size={20} /></span><span className={`${metricTrendClass} positive bg-emerald-50 text-emerald-700`}><ArrowUpRight size={14} /> Este mês</span></div>
          <p className={metricLabelClass}>Recebido no mês</p><strong className={metricValueClass}>{money(m.receivedThisMonth)}</strong>
          <div className={metricFootClass}><span>{money(m.totalReceived)} no total</span></div>
        </DashboardMetricCard>
        <DashboardMetricCard>
          <div className={metricTopClass}><span className={`${metricIconClass} amber bg-amber-50 text-amber-600`}><WalletCards size={20} /></span><span className={`${metricTrendClass} neutral bg-amber-50 text-amber-700`}><CalendarClock size={14} /> A receber</span></div>
          <p className={metricLabelClass}>Saldo em aberto</p><strong className={metricValueClass}>{money(m.openBalance)}</strong>
          <div className={metricFootClass}><span>{m.activeCustomers} clientes ativos</span></div>
        </DashboardMetricCard>
        <DashboardMetricCard>
          <div className={metricTopClass}><span className={`${metricIconClass} red bg-rose-50 text-rose-500`}><TrendingUp size={20} /></span><span className={`${metricTrendClass} negative bg-rose-50 text-rose-700`}><ArrowDownRight size={14} /> Atenção</span></div>
          <p className={metricLabelClass}>Valor em atraso</p><strong className={metricValueClass}>{money(m.overdueAmount)}</strong>
          <div className={metricFootClass}><span>{m.overdueLoans} contratos em atraso</span><button className={metricLinkClass} onClick={() => onNavigate("collections")}>Cobrar <ArrowRight size={14} /></button></div>
        </DashboardMetricCard>
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
          <section className="panel health-card flex-1 rounded-[14px] border border-[#e9e7ef] bg-white shadow-[0_3px_14px_rgba(42,35,65,0.025)]">
            <div className="panel-header flex items-center justify-between gap-[15px] px-5 pb-[14px] pt-[19px]"><div><span className="eyebrow m-0 text-[9.5px] font-extrabold uppercase tracking-[1.2px] text-violet-600">Saúde da carteira</span><h2 className="mb-0 mt-1 text-base tracking-[-0.2px] text-[#302c39]">Desempenho</h2></div></div>
            <div className="donut-wrap flex flex-col items-stretch gap-[14px] px-4 pb-4 pt-3 min-[641px]:flex-row min-[641px]:items-center min-[641px]:gap-5 min-[641px]:px-5 min-[641px]:pb-[22px] min-[641px]:pt-[7px]">
              <div className="donut relative isolate mx-auto grid size-[108px] shrink-0 place-items-center overflow-hidden rounded-full before:absolute before:inset-[15px] before:rounded-full before:bg-white before:content-['']" style={{ background: `conic-gradient(#7450e9 ${collectionRate * 3.6}deg, #eeeaf5 0)` }}><div className="relative z-[1] flex flex-col items-center"><strong className="text-xl tracking-[-0.5px]">{collectionRate.toFixed(0)}%</strong><span className="text-[10.5px] text-[#9995a1]">recebido</span></div></div>
              <div className="donut-legend grid min-w-0 flex-1 grid-cols-2 gap-2 min-[641px]:block"><p className="m-0 grid min-w-0 grid-cols-[7px_1fr] gap-x-[7px] gap-y-0.5 rounded-[10px] border border-[#eeeaf3] bg-[#faf9fc] px-2.5 py-2 min-[641px]:my-[11px] min-[641px]:border-0 min-[641px]:bg-transparent min-[641px]:p-0"><i className="dot dot-purple mt-0.5 size-1.5 rounded-full bg-violet-600" /><span className="text-[10.5px] text-[#8a8693]">Recebido</span><strong className="col-start-2 overflow-hidden text-[clamp(9.5px,3.2vw,11.5px)] text-ellipsis whitespace-nowrap min-[641px]:text-xs">{money(m.totalReceived)}</strong></p><p className="m-0 grid min-w-0 grid-cols-[7px_1fr] gap-x-[7px] gap-y-0.5 rounded-[10px] border border-[#eeeaf3] bg-[#faf9fc] px-2.5 py-2 min-[641px]:my-[11px] min-[641px]:border-0 min-[641px]:bg-transparent min-[641px]:p-0"><i className="dot dot-soft mt-0.5 size-1.5 rounded-full bg-[#d9d3e7]" /><span className="text-[10.5px] text-[#8a8693]">Em aberto</span><strong className="col-start-2 overflow-hidden text-[clamp(9.5px,3.2vw,11.5px)] text-ellipsis whitespace-nowrap min-[641px]:text-xs">{money(m.openBalance)}</strong></p></div>
            </div>
          </section>
          <section className="panel mini-stats grid grid-cols-2 rounded-[14px] border border-[#e9e7ef] bg-white p-[15px] shadow-[0_3px_14px_rgba(42,35,65,0.025)]">
            <div className="flex items-center gap-[9px] px-2 py-[3px]"><span className="mini-icon grid size-[30px] shrink-0 place-items-center rounded-[9px] bg-violet-50 text-violet-600"><UsersRound size={18} /></span><p className="m-0 flex min-w-0 flex-col"><strong className="text-sm">{m.activeCustomers}</strong><span className="mt-px text-[10px] text-[#9995a2]">clientes ativos</span></p></div>
            <div className="flex items-center gap-[9px] border-l border-[#edeaf1] px-2 py-[3px]"><span className="mini-icon grid size-[30px] shrink-0 place-items-center rounded-[9px] bg-violet-50 text-violet-600"><TrendingUp size={18} /></span><p className="m-0 flex min-w-0 flex-col"><strong className="text-sm">{m.renewals}</strong><span className="mt-px text-[10px] text-[#9995a2]">renovações</span></p></div>
          </section>
        </aside>
      </div>
    </div>
  );
}
