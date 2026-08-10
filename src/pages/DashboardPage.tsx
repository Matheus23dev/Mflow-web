import { useCallback, useEffect, useState } from "react";
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
import { api } from "../lib/api";
import { compactDate, money } from "../lib/format";
import type { DashboardData } from "../types";
import type { AppPage } from "../components/AppShell";
import { Avatar, Button, EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "../components/UI";

export function DashboardPage({ refreshKey, onNavigate, onNewLoan }: { refreshKey: number; onNavigate: (page: AppPage) => void; onNewLoan: () => void }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api<DashboardData>("/dashboard").then((result) => { setData(result); setError(""); }).catch((caught) => setError(caught.message));
  }, []);

  useEffect(load, [load, refreshKey]);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Bom dia" : currentHour < 18 ? "Boa tarde" : "Boa noite";

  if (!data && !error) return <LoadingState label="Preparando sua visão geral" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  const m = data.metrics;
  const portfolioTotal = m.totalReceived + m.openBalance;
  const collectionRate = portfolioTotal > 0 ? Math.min(100, (m.totalReceived / portfolioTotal) * 100) : 0;

  return (
    <div className="page-enter data-page dashboard-page">
      <PageHeader
        eyebrow={`${greeting} · ${new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(new Date())}`}
        title="Visão geral da operação"
        description="Acompanhe o que está acontecendo com seu dinheiro hoje."
        action={<Button onClick={onNewLoan}><Plus size={18} /> Novo empréstimo</Button>}
      />

      <div className="metric-grid metric-grid-main">
        <article className="metric-card metric-featured">
          <div className="metric-top"><span className="metric-icon"><HandCoins size={20} /></span><span className="metric-trend positive"><ArrowUpRight size={14} /> Capital ativo</span></div>
          <p>Capital emprestado</p><strong>{money(m.capitalLent)}</strong>
          <div className="metric-foot"><span>{m.activeLoans} contratos ativos</span><button onClick={() => onNavigate("loans")}>Detalhes <ArrowRight size={14} /></button></div>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span className="metric-icon green"><CircleDollarSign size={20} /></span><span className="metric-trend positive"><ArrowUpRight size={14} /> Este mês</span></div>
          <p>Recebido no mês</p><strong>{money(m.receivedThisMonth)}</strong>
          <div className="metric-foot"><span>{money(m.totalReceived)} no total</span></div>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span className="metric-icon amber"><WalletCards size={20} /></span><span className="metric-trend neutral"><CalendarClock size={14} /> A receber</span></div>
          <p>Saldo em aberto</p><strong>{money(m.openBalance)}</strong>
          <div className="metric-foot"><span>{m.activeCustomers} clientes ativos</span></div>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span className="metric-icon red"><TrendingUp size={20} /></span><span className="metric-trend negative"><ArrowDownRight size={14} /> Atenção</span></div>
          <p>Valor em atraso</p><strong>{money(m.overdueAmount)}</strong>
          <div className="metric-foot"><span>{m.overdueLoans} contratos em atraso</span><button onClick={() => onNavigate("collections")}>Cobrar <ArrowRight size={14} /></button></div>
        </article>
      </div>

      <div className="dashboard-grid">
        <section className="panel upcoming-panel">
          <div className="panel-header"><div><span className="eyebrow">Agenda financeira</span><h2>Próximas cobranças</h2></div><button className="text-button" onClick={() => onNavigate("collections")}>Ver agenda completa <ArrowRight size={15} /></button></div>
          {data.upcoming.length ? (
            <div className="collection-list compact">
              {data.upcoming.slice(0, 6).map((item) => (
                <button className="collection-row" key={item.id} onClick={() => onNavigate("collections")}>
                  <div className={`date-tile ${item.status === "OVERDUE" ? "overdue" : ""}`}><strong>{new Date(item.dueDate).getUTCDate().toString().padStart(2, "0")}</strong><span>{compactDate(item.dueDate).split(" ")[1]}</span></div>
                  <Avatar name={item.customer.name} size="sm" />
                  <div className="collection-person"><strong>{item.customer.name}</strong><span>{item.label}</span></div>
                  <div className="collection-value"><strong>{money(item.updatedAmount)}</strong><StatusBadge status={item.status} /></div>
                  <ArrowRight className="row-arrow" size={16} />
                </button>
              ))}
            </div>
          ) : <EmptyState title="Agenda tranquila" description="Nenhuma cobrança para os próximos sete dias." />}
        </section>

        <aside className="dashboard-aside">
          <section className="panel health-card">
            <div className="panel-header"><div><span className="eyebrow">Saúde da carteira</span><h2>Desempenho</h2></div></div>
            <div className="donut-wrap">
              <div className="donut" style={{ "--progress": `${collectionRate * 3.6}deg` } as React.CSSProperties}><div><strong>{collectionRate.toFixed(0)}%</strong><span>recebido</span></div></div>
              <div className="donut-legend"><p><i className="dot dot-purple" /><span>Recebido</span><strong>{money(m.totalReceived)}</strong></p><p><i className="dot dot-soft" /><span>Em aberto</span><strong>{money(m.openBalance)}</strong></p></div>
            </div>
          </section>
          <section className="panel mini-stats">
            <div><span className="mini-icon"><UsersRound size={18} /></span><p><strong>{m.activeCustomers}</strong><span>clientes ativos</span></p></div>
            <div><span className="mini-icon"><TrendingUp size={18} /></span><p><strong>{m.renewals}</strong><span>renovações</span></p></div>
          </section>
        </aside>
      </div>
    </div>
  );
}
