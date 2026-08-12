import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  CalendarRange,
  CircleDollarSign,
  HandCoins,
  Share2,
  Target,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { money } from "@/shared/lib/format";
import { createPdfFile, sharePdfFile } from "@/shared/lib/pdf";
import {
  Button,
  CompactDateInput,
  ErrorState,
  LoadingState,
  PageHeader,
} from "@/shared/ui";
import { useReports } from "../hooks/useReports";

export function ReportsPage({ refreshKey }: { refreshKey: number }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [preparingPdf, setPreparingPdf] = useState(false);
  const [sharing, setSharing] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const { data, error, reload } = useReports(from, to, refreshKey);

  const chart = useMemo(() => {
    if (!data) return [];
    const entries = [
      { label: "Emprestado", value: data.metrics.totalLent, tone: "purple" },
      { label: "Recebido", value: data.metrics.totalReceived, tone: "green" },
      { label: "Em aberto", value: data.metrics.openBalance, tone: "amber" },
      { label: "Atrasado", value: data.metrics.overdue, tone: "red" },
    ];
    const max = Math.max(...entries.map((item) => item.value), 1);
    return entries.map((item) => ({
      ...item,
      height: Math.max(6, (item.value / max) * 100),
    }));
  }, [data]);

  useEffect(() => {
    if (!data || !reportRef.current) return;
    let cancelled = false;
    setPdfFile(null);
    setPreparingPdf(true);

    const timer = window.setTimeout(() => {
      void createPdfFile(
        reportRef.current!,
        `Relatorios-MFlow-${new Date().toISOString().slice(0, 10)}`,
      )
        .then((file) => {
          if (!cancelled) setPdfFile(file);
        })
        .catch(() => {
          if (!cancelled) setPdfFile(null);
        })
        .finally(() => {
          if (!cancelled) setPreparingPdf(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [data]);

  function changeFrom(value: string) {
    setFrom(value);
    if (value && to && value > to) setTo(value);
  }

  function changeTo(value: string) {
    setTo(value);
    if (value && from && value < from) setFrom(value);
  }

  async function shareReports() {
    if (!pdfFile || sharing) return;
    setSharing(true);
    try {
      const result = await sharePdfFile(pdfFile, "Relatórios MFlow");
      if (result === "downloaded") {
        window.alert("O PDF foi baixado porque este navegador não compartilha arquivos diretamente.");
      }
    } catch {
      window.alert("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setSharing(false);
    }
  }

  return (
    <div
      ref={reportRef}
      className="page-enter data-page report-page min-w-0 max-w-full min-[861px]:flex min-[861px]:h-full min-[861px]:min-h-0 min-[861px]:flex-col min-[861px]:overflow-hidden"
    >
      <PageHeader
        eyebrow="Análise"
        title="Relatórios"
        description="Entenda o retorno, o risco e a composição da sua carteira."
        action={
          <Button
            data-pdf-ignore
            variant="secondary"
            disabled={!pdfFile}
            loading={preparingPdf || sharing}
            onClick={() => void shareReports()}
          >
            <Share2 size={17} /> Compartilhar
          </Button>
        }
      />
      <div data-pdf-ignore className="report-filter panel mb-[17px] flex min-w-0 max-w-full items-center gap-1.5 overflow-hidden rounded-[14px] border border-[#e9e7ef] bg-white p-2.5 shadow-[0_3px_14px_rgba(42,35,65,0.025)] print:hidden min-[641px]:items-end min-[641px]:gap-[9px] min-[641px]:overflow-visible min-[641px]:px-4 min-[641px]:py-3">
        <div className="flex shrink-0 items-center gap-1 text-[10px] text-[#625d6c] min-[641px]:mb-3 min-[641px]:mr-auto min-[641px]:gap-1.5 min-[641px]:text-[11px]">
          <CalendarRange className="shrink-0" size={16} />
          <strong className="hidden min-[361px]:inline">
            Período<span className="hidden min-[641px]:inline"> da análise</span>
          </strong>
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 min-[641px]:contents">
          <label className="flex w-full min-w-0 max-w-full flex-col overflow-hidden min-[641px]:order-2 min-[641px]:w-[150px] min-[641px]:gap-1.5">
            <span className="sr-only truncate text-[10px] font-semibold text-slate-500 min-[641px]:not-sr-only">
              Data inicial
            </span>
            <CompactDateInput
              placeholder="Início"
              max={to || undefined}
              value={from}
              onChange={(event) => changeFrom(event.target.value)}
            />
          </label>
          <span className="shrink-0 text-[9px] text-[#9d98a4] min-[641px]:order-3 min-[641px]:pb-3">
            até
          </span>
          <label className="flex w-full min-w-0 max-w-full flex-col overflow-hidden min-[641px]:order-4 min-[641px]:w-[150px] min-[641px]:gap-1.5">
            <span className="sr-only truncate text-[10px] font-semibold text-slate-500 min-[641px]:not-sr-only">
              Data final
            </span>
            <CompactDateInput
              placeholder="Fim"
              min={from || undefined}
              value={to}
              onChange={(event) => changeTo(event.target.value)}
            />
          </label>
        </div>
        <button
          type="button"
          className="min-h-7 shrink-0 rounded-lg border-0 bg-transparent px-1 py-0.5 text-[9.5px] font-bold text-violet-700 min-[641px]:order-5 min-[641px]:min-h-[42px] min-[641px]:px-3 min-[641px]:py-2.5 min-[641px]:text-[11px]"
          onClick={() => {
            setFrom("");
            setTo("");
          }}
        >
          <span className="min-[641px]:hidden">Todo</span>
          <span className="hidden min-[641px]:inline">Todo período</span>
        </button>
      </div>
      {!data && !error ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {data ? (
        <>
          <div className="report-metric-grid mb-[17px] grid grid-cols-1 gap-[9px] print:grid-cols-4 print:gap-[10px] min-[421px]:grid-cols-2 min-[641px]:gap-[15px] min-[861px]:grid-cols-4 min-[861px]:gap-[10px] [&>article]:min-w-0 [&>article]:rounded-[13px] [&>article]:border [&>article]:border-[#e9e7ef] [&>article]:bg-white [&>article]:p-[13px] min-[641px]:[&>article]:p-[17px] min-[861px]:[&>article]:p-[13px] [&_p]:mb-1 [&_p]:mt-[13px] min-[861px]:[&_p]:mt-2 [&_p]:text-[11px] [&_p]:text-[#8e8997] [&_strong]:block [&_strong]:overflow-hidden [&_strong]:text-xl min-[861px]:[&_strong]:text-lg [&_strong]:tracking-[-0.35px] [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_small]:mt-[3px] [&_small]:block [&_small]:text-[9.5px] [&_small]:text-[#aaa6b0]">
            <article>
              <span className="report-icon grid size-[35px] place-items-center rounded-[10px] bg-violet-50 text-violet-600">
                <HandCoins size={20} />
              </span>
              <p>Total emprestado</p>
              <strong>{money(data.metrics.totalLent)}</strong>
              <small>capital liberado no período</small>
            </article>
            <article>
              <span className="report-icon green grid size-[35px] place-items-center rounded-[10px] bg-emerald-50 text-emerald-600">
                <ArrowDownLeft size={20} />
              </span>
              <p>Total recebido</p>
              <strong>{money(data.metrics.totalReceived)}</strong>
              <small>pagamentos confirmados</small>
            </article>
            <article>
              <span className="report-icon amber grid size-[35px] place-items-center rounded-[10px] bg-amber-50 text-amber-600">
                <WalletCards size={20} />
              </span>
              <p>Saldo em aberto</p>
              <strong>{money(data.metrics.openBalance)}</strong>
              <small>a recuperar da carteira</small>
            </article>
            <article>
              <span className="report-icon red grid size-[35px] place-items-center rounded-[10px] bg-rose-50 text-rose-500">
                <ArrowUpRight size={20} />
              </span>
              <p>Em atraso</p>
              <strong>{money(data.metrics.overdue)}</strong>
              <small>cobranças vencidas</small>
            </article>
          </div>
          <div className="report-grid grid min-w-0 grid-cols-1 items-start gap-4 print:grid-cols-[minmax(0,1.45fr)_minmax(230px,.75fr)] min-[861px]:min-h-0 min-[861px]:flex-1 min-[861px]:grid-cols-[minmax(0,1.45fr)_minmax(230px,.75fr)] min-[861px]:items-stretch min-[1121px]:grid-cols-[minmax(0,1.45fr)_minmax(250px,.75fr)]">
            <section className="panel report-chart-panel min-h-[330px] rounded-[14px] border border-[#e9e7ef] bg-white shadow-[0_3px_14px_rgba(42,35,65,0.025)] min-[861px]:flex min-[861px]:min-h-0 min-[861px]:flex-col">
              <div className="panel-header flex items-center justify-between gap-[15px] px-5 pb-[14px] pt-[19px]">
                <div>
                  <span className="eyebrow m-0 text-[9.5px] font-extrabold uppercase tracking-[1.2px] text-violet-600">
                    Comparativo financeiro
                  </span>
                  <h2 className="mb-0 mt-1 text-base tracking-[-0.2px] text-[#302c39]">
                    Composição da carteira
                  </h2>
                </div>
                <BarChart3 size={20} className="muted text-[#aaa6b1]" />
              </div>
              <div className="bar-chart flex h-[245px] items-stretch justify-around gap-2 border-t border-[#f0eef3] px-3 pb-[22px] pt-5 min-[641px]:gap-[18px] min-[641px]:px-[35px] min-[861px]:h-auto min-[861px]:min-h-0 min-[861px]:flex-1 min-[861px]:pb-4 min-[861px]:pt-3">
                {chart.map((item) => (
                  <div
                    className="bar-column grid w-[min(78px,20%)] grid-rows-[20px_1fr_17px] items-end gap-[5px] text-center"
                    key={item.label}
                  >
                    <div className="bar-value overflow-hidden text-[9.5px] text-[#827d8b] text-ellipsis whitespace-nowrap">
                      {money(item.value)}
                    </div>
                    <div className="bar-track relative flex h-full items-end justify-center border-b border-[#e9e6ee] bg-[repeating-linear-gradient(to_top,#f0edf3_0_1px,transparent_1px_45px)]">
                      <span
                        className={`bar min-h-[5px] w-[64%] rounded-t-md ${item.tone === "green" ? "bg-gradient-to-b from-[#50c79b] to-[#20a875]" : item.tone === "amber" ? "bg-gradient-to-b from-[#efb55f] to-[#d9902a]" : item.tone === "red" ? "bg-gradient-to-b from-[#ef8793] to-[#df5665]" : "bg-gradient-to-b from-[#9276ef] to-[#6944da]"}`}
                        style={{ height: `${item.height}%` }}
                      />
                    </div>
                    <strong className="text-[9.5px] text-[#716c79]">
                      {item.label}
                    </strong>
                  </div>
                ))}
              </div>
            </section>
            <section className="panel profitability-card rounded-[14px] border border-[#e9e7ef] bg-white pb-[13px] shadow-[0_3px_14px_rgba(42,35,65,0.025)] min-[861px]:min-h-0 min-[861px]:overflow-hidden min-[861px]:pb-2">
              <div className="panel-header flex items-center justify-between gap-[15px] px-5 pb-[14px] pt-[19px] min-[861px]:pb-2 min-[861px]:pt-3">
                <div>
                  <span className="eyebrow m-0 text-[9.5px] font-extrabold uppercase tracking-[1.2px] text-violet-600">
                    Rentabilidade
                  </span>
                  <h2 className="mb-0 mt-1 text-base tracking-[-0.2px] text-[#302c39]">
                    Resultado da operação
                  </h2>
                </div>
                <TrendingUp size={20} className="purple-text text-violet-700" />
              </div>
              <div className="profit-main mx-[18px] mb-[14px] flex flex-col rounded-[11px] bg-gradient-to-br from-[#7451e2] to-[#5d3bca] p-[17px] text-white min-[861px]:mb-2 min-[861px]:p-3">
                <span className="text-[11px] text-white/70">
                  Lucro realizado
                </span>
                <strong className="mt-[5px] text-[22px]">
                  {money(data.metrics.realizedProfit)}
                </strong>
                <small className="mt-[3px] text-[9.5px] text-white/60">
                  Recebimentos menos capital recuperado
                </small>
              </div>
              <div className="profit-row mx-[18px] flex items-center justify-between border-t border-[#eeeaf2] px-[3px] py-[11px] min-[861px]:py-2">
                <span className="flex items-center gap-[7px] text-[11px] text-[#8d8995]">
                  <CircleDollarSign size={17} /> Juros recebidos
                </span>
                <strong className="text-xs">
                  {money(data.metrics.interestReceived)}
                </strong>
              </div>
              <div className="profit-row mx-[18px] flex items-center justify-between border-t border-[#eeeaf2] px-[3px] py-[11px] min-[861px]:py-2">
                <span className="flex items-center gap-[7px] text-[11px] text-[#8d8995]">
                  <Target size={17} /> Lucro projetado
                </span>
                <strong className="text-xs">
                  {money(data.metrics.projectedProfit)}
                </strong>
              </div>
              <div className="profit-row mx-[18px] flex items-center justify-between border-t border-[#eeeaf2] px-[3px] py-[11px] min-[861px]:py-2">
                <span className="flex items-center gap-[7px] text-[11px] text-[#8d8995]">
                  <WalletCards size={17} /> Capital recuperado
                </span>
                <strong className="text-xs">
                  {money(data.metrics.capitalRecovered)}
                </strong>
              </div>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
