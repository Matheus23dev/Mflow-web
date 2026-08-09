import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, BarChart3, CalendarRange, CircleDollarSign, HandCoins, Printer, Target, TrendingUp, WalletCards } from "lucide-react";
import { api, queryString } from "../lib/api";
import { money } from "../lib/format";
import type { ReportData } from "../types";
import { Button, ErrorState, Input, LoadingState, PageHeader } from "../components/UI";

export function ReportsPage({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = useState<ReportData | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(() => {
    api<ReportData>(`/reports${queryString({ from, to })}`).then((result) => { setData(result); setError(""); }).catch((caught) => setError(caught.message));
  }, [from, to]);
  useEffect(load, [load, refreshKey]);

  const chart = useMemo(() => {
    if (!data) return [];
    const entries = [
      { label: "Emprestado", value: data.metrics.totalLent, tone: "purple" },
      { label: "Recebido", value: data.metrics.totalReceived, tone: "green" },
      { label: "Em aberto", value: data.metrics.openBalance, tone: "amber" },
      { label: "Atrasado", value: data.metrics.overdue, tone: "red" },
    ];
    const max = Math.max(...entries.map((item) => item.value), 1);
    return entries.map((item) => ({ ...item, height: Math.max(6, item.value / max * 100) }));
  }, [data]);

  return (
    <div className="page-enter report-page">
      <PageHeader eyebrow="Análise" title="Relatórios" description="Entenda o retorno, o risco e a composição da sua carteira." action={<Button variant="secondary" onClick={() => window.print()}><Printer size={17} /> Imprimir</Button>} />
      <div className="report-filter panel"><div><CalendarRange size={18} /><strong>Período da análise</strong></div><Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /><span>até</span><Input type="date" min={from} value={to} onChange={(event) => setTo(event.target.value)} /><button onClick={() => { setFrom(""); setTo(""); }}>Todo o período</button></div>
      {!data && !error ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {data ? <>
        <div className="report-metric-grid">
          <article><span className="report-icon"><HandCoins size={20} /></span><p>Total emprestado</p><strong>{money(data.metrics.totalLent)}</strong><small>capital liberado no período</small></article>
          <article><span className="report-icon green"><ArrowDownLeft size={20} /></span><p>Total recebido</p><strong>{money(data.metrics.totalReceived)}</strong><small>pagamentos confirmados</small></article>
          <article><span className="report-icon amber"><WalletCards size={20} /></span><p>Saldo em aberto</p><strong>{money(data.metrics.openBalance)}</strong><small>a recuperar da carteira</small></article>
          <article><span className="report-icon red"><ArrowUpRight size={20} /></span><p>Em atraso</p><strong>{money(data.metrics.overdue)}</strong><small>cobranças vencidas</small></article>
        </div>
        <div className="report-grid">
          <section className="panel report-chart-panel">
            <div className="panel-header"><div><span className="eyebrow">Comparativo financeiro</span><h2>Composição da carteira</h2></div><BarChart3 size={20} className="muted" /></div>
            <div className="bar-chart">
              {chart.map((item) => <div className="bar-column" key={item.label}><div className="bar-value">{money(item.value)}</div><div className="bar-track"><span className={`bar bar-${item.tone}`} style={{ height: `${item.height}%` }} /></div><strong>{item.label}</strong></div>)}
            </div>
          </section>
          <section className="panel profitability-card">
            <div className="panel-header"><div><span className="eyebrow">Rentabilidade</span><h2>Resultado da operação</h2></div><TrendingUp size={20} className="purple-text" /></div>
            <div className="profit-main"><span>Lucro realizado</span><strong>{money(data.metrics.realizedProfit)}</strong><small>Recebimentos menos capital recuperado</small></div>
            <div className="profit-row"><span><CircleDollarSign size={17} /> Juros recebidos</span><strong>{money(data.metrics.interestReceived)}</strong></div>
            <div className="profit-row"><span><Target size={17} /> Lucro projetado</span><strong>{money(data.metrics.projectedProfit)}</strong></div>
            <div className="profit-row"><span><WalletCards size={17} /> Capital recuperado</span><strong>{money(data.metrics.capitalRecovered)}</strong></div>
          </section>
        </div>
      </> : null}
    </div>
  );
}
