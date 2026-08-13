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
import type { DashboardData } from "@/shared/types";
import { Avatar, Button, EmptyState, ErrorState, LoadingState, Modal, PageHeader, StatusBadge } from "@/shared/ui";
import { useDashboard } from "../hooks/useDashboard";

type PortfolioKind = "weekly" | "monthly";

const percentage = (value: number) => `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}%`;

function PortfolioDetailsModal({ kind, portfolios, onClose, onNavigate }: { kind: PortfolioKind | null; portfolios: DashboardData["portfolios"]; onClose: () => void; onNavigate: (page: AppPage) => void }) {
  const weekly = portfolios.weekly;
  const monthly = portfolios.monthlyInterest;
  const isWeekly = kind === "weekly";
  const details = isWeekly
    ? [
        ["Capital emprestado", money(weekly.capitalLent), "Valor principal dos contratos ativos"],
        ["Total contratado", money(weekly.totalContracted), "Parcelas completas, já com juros"],
        ["Falta receber", money(weekly.remainingReceivable), "Saldo das parcelas não pagas"],
        ["Recebido", money(weekly.received), "Parcelas recebidas nos contratos ativos"],
        ["Lucro contratado", money(weekly.contractedProfit), "Diferença entre contrato e capital"],
        ["Em atraso", money(weekly.overdueAmount), `${weekly.overdueInstallments} parcelas vencidas, com multa`],
        ["Percentual recebido", percentage(weekly.collectionRate), "Progresso dos contratos ativos"],
        ["Contratos ativos", String(weekly.activeContracts), "Contratos parcelados em andamento"],
      ]
    : [
        ["Capital emprestado", money(monthly.capitalLent), "Valor principal dos contratos ativos"],
        ["Capital em circulação", money(monthly.capitalInCirculation), "Principal ainda em poder dos clientes"],
        ["Juros previstos no mês", money(monthly.interestDueThisMonth), "Cobranças com vencimento neste mês"],
        ["Juros recebidos no mês", money(monthly.interestReceivedThisMonth), "Entradas de juros confirmadas no mês"],
        ["Falta receber no mês", money(monthly.interestRemainingThisMonth), "Saldo das cobranças deste mês"],
        ["Juros anteriores atrasados", money(monthly.previousInterestOverdue), "Pendências vencidas antes deste mês"],
        ["Capital devolvido no mês", money(monthly.principalReturnedThisMonth), "Amortizações e quitações recebidas"],
        ["Rentabilidade mensal", percentage(monthly.monthlyYieldRate), "Juros recebidos sobre o capital em circulação"],
      ];

  return (
    <Modal open={Boolean(kind)} onClose={onClose} title={isWeekly ? "Empréstimos parcelados" : "Juros mensal"} description={isWeekly ? "Valores exclusivos dos contratos parcelados ativos." : "Valores exclusivos da carteira de juros mensal."} size="lg">
      <div className="grid grid-cols-1 gap-2.5 min-[481px]:grid-cols-2">
        {details.map(([label, value, caption], index) => (
          <div className={`min-w-0 rounded-xl border p-4 ${index < 4 ? "border-violet-200 bg-violet-50/70" : "border-slate-200 bg-white"}`} key={label}>
            <span className="text-xs font-medium text-slate-500">{label}</span>
            <strong className="mt-1.5 block overflow-hidden text-xl tracking-[-0.4px] text-slate-900 text-ellipsis whitespace-nowrap">{value}</strong>
            <small className="mt-1 block text-[11px] leading-5 text-slate-500">{caption}</small>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 min-[481px]:flex-row min-[481px]:items-center min-[481px]:justify-between">
        <p className="m-0 text-xs leading-5 text-slate-600">{isWeekly ? "Os juros de atraso ficam separados dos juros contratados nas parcelas." : "Como não há data final, juros futuros ainda não gerados não entram nos totais."}</p>
        <Button className="shrink-0" variant="secondary" onClick={() => { onClose(); onNavigate("loans"); }}>Ver empréstimos <ArrowRight size={15} /></Button>
      </div>
    </Modal>
  );
}

export function DashboardPage({ refreshKey, onNavigate, onNewLoan }: { refreshKey: number; onNavigate: (page: AppPage) => void; onNewLoan: () => void }) {
  const { data, error, reload } = useDashboard(refreshKey);
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioKind | null>(null);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Bom dia" : currentHour < 18 ? "Boa tarde" : "Boa noite";

  if (!data && !error) return <LoadingState label="Preparando sua visão geral" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const m = data.metrics;
  const weekly = data.portfolios.weekly;
  const monthly = data.portfolios.monthlyInterest;
  const portfolioValueClass = "mt-1 block overflow-hidden text-[clamp(16px,5vw,23px)] font-extrabold tracking-[-0.6px] text-ellipsis whitespace-nowrap";

  return (
    <div className="page-enter data-page dashboard-page min-w-0 max-w-full min-[861px]:flex min-[861px]:h-full min-[861px]:min-h-0 min-[861px]:flex-col min-[861px]:overflow-hidden">
      <PageHeader
        eyebrow={`${greeting} · ${new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(new Date())}`}
        title="Visão geral da operação"
        description="Acompanhe cada modalidade separadamente, sem misturar os valores."
        action={<Button onClick={onNewLoan}><Plus size={18} /> Novo empréstimo</Button>}
      />

      <div className="grid grid-cols-1 gap-3 min-[861px]:grid-cols-2 min-[1121px]:gap-4">
        <button type="button" onClick={() => setSelectedPortfolio("weekly")} className="group min-w-0 rounded-2xl border border-transparent bg-gradient-to-br from-[#7350e5] to-[#5b37c7] p-4 text-left text-white shadow-[0_12px_30px_rgba(101,63,209,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(101,63,209,0.27)] min-[641px]:p-5">
          <div className="flex items-center justify-between gap-3"><span className="grid size-10 place-items-center rounded-xl bg-white/15"><HandCoins size={22} /></span><span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold">{weekly.activeContracts} ativos</span></div>
          <div className="mt-3 flex items-end justify-between gap-3"><div><span className="text-[10px] font-extrabold uppercase tracking-[1.3px] text-white/65">Carteira</span><h2 className="mt-1 text-lg font-bold">Empréstimos parcelados</h2></div><span className="flex items-center gap-1 text-[11px] font-bold text-white/80 max-[380px]:hidden">Ver detalhes <ArrowRight className="transition group-hover:translate-x-0.5" size={15} /></span></div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="min-w-0 rounded-xl bg-white/10 p-3"><span className="text-[10.5px] text-white/65">Capital emprestado</span><strong className={portfolioValueClass}>{money(weekly.capitalLent)}</strong></div>
            <div className="min-w-0 rounded-xl bg-white/10 p-3"><span className="text-[10.5px] text-white/65">Total com juros</span><strong className={portfolioValueClass}>{money(weekly.totalContracted)}</strong></div>
            <div className="min-w-0 rounded-xl bg-white/10 p-3"><span className="text-[10.5px] text-white/65">Já recebido</span><strong className={portfolioValueClass}>{money(weekly.received)}</strong></div>
            <div className="min-w-0 rounded-xl bg-white/10 p-3"><span className="text-[10.5px] text-white/65">Falta receber</span><strong className={portfolioValueClass}>{money(weekly.remainingReceivable)}</strong></div>
          </div>
        </button>

        <button type="button" onClick={() => setSelectedPortfolio("monthly")} className="group min-w-0 rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/80 p-4 text-left text-slate-900 shadow-[0_8px_25px_rgba(38,110,82,0.08)] transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_13px_32px_rgba(38,110,82,0.13)] min-[641px]:p-5">
          <div className="flex items-center justify-between gap-3"><span className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><CircleDollarSign size={22} /></span><span className="rounded-full bg-emerald-100 px-3 py-1.5 text-[10px] font-bold text-emerald-700">{monthly.activeContracts} ativos</span></div>
          <div className="mt-3 flex items-end justify-between gap-3"><div><span className="text-[10px] font-extrabold uppercase tracking-[1.3px] text-emerald-600">Carteira</span><h2 className="mt-1 text-lg font-bold">Juros mensal</h2></div><span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 max-[380px]:hidden">Ver detalhes <ArrowRight className="transition group-hover:translate-x-0.5" size={15} /></span></div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="min-w-0 rounded-xl border border-emerald-100 bg-white/80 p-3"><span className="text-[10.5px] text-slate-500">Capital emprestado</span><strong className={portfolioValueClass}>{money(monthly.capitalLent)}</strong></div>
            <div className="min-w-0 rounded-xl border border-emerald-100 bg-white/80 p-3"><span className="text-[10.5px] text-slate-500">Juros do mês</span><strong className={portfolioValueClass}>{money(monthly.interestDueThisMonth)}</strong></div>
            <div className="min-w-0 rounded-xl border border-emerald-100 bg-white/80 p-3"><span className="text-[10.5px] text-slate-500">Juros recebidos</span><strong className={`${portfolioValueClass} text-emerald-700`}>{money(monthly.interestReceivedThisMonth)}</strong></div>
            <div className="min-w-0 rounded-xl border border-emerald-100 bg-white/80 p-3"><span className="text-[10.5px] text-slate-500">Falta receber no mês</span><strong className={portfolioValueClass}>{money(monthly.interestRemainingThisMonth)}</strong></div>
          </div>
        </button>
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
      <PortfolioDetailsModal kind={selectedPortfolio} portfolios={data.portfolios} onClose={() => setSelectedPortfolio(null)} onNavigate={onNavigate} />
    </div>
  );
}
