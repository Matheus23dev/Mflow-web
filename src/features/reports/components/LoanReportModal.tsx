import { useMemo, useState } from "react";
import {
  Copy,
  FileText,
  IdCard,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
} from "lucide-react";
import { chargeValues } from "@/shared/lib/charges";
import { date, money } from "@/shared/lib/format";
import {
  paymentMethodSummary,
  paymentsForCharge,
  pixReceiptsForPayments,
} from "@/shared/lib/payments";
import type { Charge, Loan } from "@/shared/types";
import { Avatar, Button, Modal } from "@/shared/ui";
import { ReceiptOpenButton } from "@/features/receipts/components/ReceiptOpenButton";

const loanStatus = {
  ACTIVE: "Em dia",
  OVERDUE: "Em atraso",
  PAID: "Pago",
  RENEWED: "Renovado",
  CANCELLED: "Cancelado",
} as const;

const chargeStatus = {
  PENDING: "Pendente",
  OVERDUE: "Em atraso",
  PAID: "Pago",
  PARTIAL: "Parcial",
} as const;

const frequency = {
  WEEKLY: "Semanal",
  BIWEEKLY: "Quinzenal",
  MONTHLY: "Mensal",
} as const;

const reportLabelClass =
  "text-[9.5px] font-semibold uppercase tracking-[.45px] text-slate-400";
const reportValueClass = "mt-1 min-w-0 break-words text-xs text-slate-800";
const chargeTone = {
  PENDING: "bg-amber-50 text-amber-700",
  OVERDUE: "bg-rose-50 text-rose-700",
  PAID: "bg-emerald-50 text-emerald-700",
  PARTIAL: "bg-blue-50 text-blue-700",
} as const;

function whatsappPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
}

function reportText(loan: Loan) {
  const charges =
    loan.type === "WEEKLY" ? loan.installments : loan.monthlyCharges;
  const lines = [
    "*Resumo do empréstimo*",
    `Cliente: ${loan.customer.name}`,
    `Contrato: ${loan.id}`,
    `Situação: ${loanStatus[loan.status]}`,
    `Data: ${date(loan.loanDate)}`,
    `Valor do empréstimo: ${money(loan.principalAmount)}`,
    loan.type === "WEEKLY"
      ? `Condição: ${loan.installmentCount} parcelas de ${money(loan.installmentAmount)} (${frequency[loan.frequency || "WEEKLY"]})`
      : `Juros mensais: ${loan.monthlyInterestRate ? `${Number(loan.monthlyInterestRate).toLocaleString("pt-BR")}%` : money(loan.monthlyInterestAmount)} | vencimento dia ${loan.monthlyDueDay}`,
    `Juros por atraso: ${money(loan.lateFeePerDay)} por dia`,
    ...(loan.summary.lateFees > 0
      ? [`Juros acumulados: ${money(loan.summary.lateFees)}`]
      : []),
    `Valor atualizado a pagar: ${money(loan.summary.openBalance + loan.summary.lateFees)}`,
    "",
    "*Agenda:*",
    ...charges.slice(0, 20).map((charge) => {
      const label = charge.number
        ? `Parcela ${charge.number}`
        : `Juros ${charge.referenceMonth}`;
      const values = chargeValues(charge, loan.lateFeePerDay);
      const paymentMethod = paymentMethodSummary(
        paymentsForCharge(loan, charge),
      );
      const paidWith =
        values.paid > 0
          ? ` · ${charge.status === "PARTIAL" ? "Parcial" : "Pago"} via ${paymentMethod || "forma não informada"}`
          : "";
      const lateFee =
        values.lateFee > 0
          ? ` (inclui ${money(values.lateFee)} de juros por ${values.overdue} ${values.overdue === 1 ? "dia" : "dias"})`
          : "";
      return `${label}: ${money(values.updatedAmount)} em ${date(charge.dueDate)} — ${chargeStatus[charge.status]}${paidWith}${lateFee}`;
    }),
    ...(charges.length > 20
      ? [`... e mais ${charges.length - 20} cobranças no relatório completo.`]
      : []),
  ];
  return lines.join("\n");
}

export function LoanReportModal({
  loan,
  onClose,
}: {
  loan: Loan | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const charges = useMemo(
    () =>
      (loan?.type === "WEEKLY" ? loan.installments : loan?.monthlyCharges) ||
      [],
    [loan],
  );

  if (!loan) return null;

  async function copyReport() {
    const text = reportText(loan!);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const field = document.createElement("textarea");
      field.value = text;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  async function shareReport() {
    const text = reportText(loan!);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Empréstimo - ${loan!.customer.name}`,
          text,
        });
        return;
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
      }
    }

    await copyReport();
    window.alert("Resumo do empréstimo copiado.");
  }

  function sendWhatsapp() {
    const url = `https://wa.me/${whatsappPhone(loan!.customer.phone)}?text=${encodeURIComponent(reportText(loan!))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const issuedDate = date(loan.loanDate);

  return (
    <Modal
      open
      onClose={onClose}
      title="Relatório do empréstimo"
      description="Confira os dados antes de compartilhar ou enviar ao cliente."
      size="lg"
    >
      <div className="loan-report-print min-w-0 text-slate-700 print:p-[12mm] print:text-black">
        <header className="report-document-header mb-4 flex min-w-0 flex-col gap-3 border-b-2 border-violet-600 pb-3 min-[421px]:flex-row min-[421px]:items-center min-[421px]:justify-between print:flex-row print:items-center print:justify-between">
          <div className="report-document-brand h-2.5 w-24 rounded-full bg-gradient-to-r from-violet-500 to-violet-700 print:bg-violet-700" />
          <div className="report-document-id flex min-w-0 flex-col text-left min-[421px]:items-end min-[421px]:text-right print:items-end print:text-right">
            <span className="min-w-0 break-words text-[10px] uppercase tracking-[.5px] text-slate-500">
              Contrato <strong className="text-slate-800">{loan.id}</strong>
            </span>
            <small className="mt-1 text-[10px] text-slate-400">
              {issuedDate}
            </small>
          </div>
        </header>

        <section className="report-client-card mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="report-client-header flex min-w-0 items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <Avatar name={loan.customer.name} size="lg" />
            <div className="flex min-w-0 flex-col">
              <span className={reportLabelClass}>Cliente</span>
              <strong className="mt-1 min-w-0 break-words text-base text-slate-900">
                {loan.customer.name}
              </strong>
            </div>
          </div>
          <div className="report-client-data grid min-w-0 grid-cols-1 gap-3 px-4 py-3 min-[421px]:grid-cols-2 print:grid-cols-2">
            <div className="report-client-item flex min-w-0 flex-col">
              <span
                className={`${reportLabelClass} flex items-center gap-1.5 normal-case tracking-normal`}
              >
                <Phone size={14} /> Telefone
              </span>
              <strong className={reportValueClass}>
                {loan.customer.phone}
              </strong>
            </div>
            <div className="report-client-item flex min-w-0 flex-col">
              <span
                className={`${reportLabelClass} flex items-center gap-1.5 normal-case tracking-normal`}
              >
                <IdCard size={14} /> CPF
              </span>
              <strong className={reportValueClass}>
                {loan.customer.cpf || "Não informado"}
              </strong>
            </div>
            <div className="report-client-item report-client-address flex min-w-0 flex-col min-[421px]:col-span-2 print:col-span-2">
              <span
                className={`${reportLabelClass} flex items-center gap-1.5 normal-case tracking-normal`}
              >
                <MapPin size={14} /> Endereço
              </span>
              <strong className={reportValueClass}>
                {loan.customer.address || "Não informado"}
              </strong>
            </div>
          </div>
        </section>

        <div className="report-contract-status mb-5 grid min-w-0 grid-cols-1 gap-2 min-[421px]:grid-cols-2 min-[641px]:grid-cols-4 print:grid-cols-4 [&>div]:flex [&>div]:min-w-0 [&>div]:flex-col [&>div]:rounded-xl [&>div]:border [&>div]:border-slate-200 [&>div]:bg-white [&>div]:px-3 [&>div]:py-3 [&_span]:text-[9px] [&_span]:font-semibold [&_span]:uppercase [&_span]:tracking-[.4px] [&_span]:text-slate-400 [&_strong]:mt-1 [&_strong]:min-w-0 [&_strong]:break-words [&_strong]:text-[13px] [&_strong]:text-slate-800">
          <div>
            <span>Situação atual</span>
            <strong>{loanStatus[loan.status]}</strong>
          </div>
          <div>
            <span>Valor atualizado a pagar</span>
            <strong>
              {money(loan.summary.openBalance + loan.summary.lateFees)}
            </strong>
          </div>
          {loan.summary.lateFees > 0 && (
            <div className="report-late-fee-total !border-rose-200 !bg-rose-50 [&>strong]:!text-rose-700">
              <span>Juros por atraso</span>
              <strong>{money(loan.summary.lateFees)}</strong>
            </div>
          )}
          <div>
            <span>Total recebido</span>
            <strong>{money(loan.summary.received)}</strong>
          </div>
        </div>

        <section className="report-section mt-5 min-w-0 break-inside-avoid">
          <div className="report-section-title mb-2.5 flex min-w-0 items-center gap-2 border-b border-slate-200 pb-2 text-sm text-slate-800">
            <FileText className="shrink-0 text-violet-600" size={17} />
            <strong>Condições do contrato</strong>
          </div>
          <div className="report-terms grid min-w-0 grid-cols-1 gap-2 min-[421px]:grid-cols-2 min-[861px]:grid-cols-4 print:grid-cols-4 [&>div]:flex [&>div]:min-w-0 [&>div]:flex-col [&>div]:rounded-lg [&>div]:bg-slate-50 [&>div]:px-3 [&>div]:py-2.5 [&_span]:text-[9.5px] [&_span]:text-slate-400 [&_strong]:mt-1 [&_strong]:min-w-0 [&_strong]:break-words [&_strong]:text-xs [&_strong]:text-slate-800">
            <div>
              <span>Modalidade</span>
              <strong>
                {loan.type === "WEEKLY" ? "Parcelado" : "Juros mensal"}
              </strong>
            </div>
            <div>
              <span>Valor do empréstimo</span>
              <strong>{money(loan.principalAmount)}</strong>
            </div>
            {loan.type === "WEEKLY" ? (
              <>
                <div>
                  <span>Total contratado</span>
                  <strong>{money(loan.totalContracted)}</strong>
                </div>
                <div>
                  <span>Parcelas</span>
                  <strong>
                    {loan.installmentCount} × {money(loan.installmentAmount)}
                  </strong>
                </div>
                <div>
                  <span>Frequência</span>
                  <strong>{frequency[loan.frequency || "WEEKLY"]}</strong>
                </div>
                <div>
                  <span>Primeiro vencimento</span>
                  <strong>{date(loan.firstDueDate)}</strong>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span>Juros mensais</span>
                  <strong>
                    {loan.monthlyInterestRate
                      ? `${Number(loan.monthlyInterestRate).toLocaleString("pt-BR")}%`
                      : money(loan.monthlyInterestAmount)}
                  </strong>
                </div>
                <div>
                  <span>Valor mensal atual</span>
                  <strong>{money(loan.monthlyInterestAmount)}</strong>
                </div>
                <div>
                  <span>Dia de vencimento</span>
                  <strong>Dia {loan.monthlyDueDay}</strong>
                </div>
              </>
            )}
            <div>
              <span>Juros por atraso</span>
              <strong>{money(loan.lateFeePerDay)} por dia</strong>
            </div>
          </div>
        </section>

        <section className="report-section mt-5 min-w-0">
          <div className="report-section-title mb-2.5 flex min-w-0 items-center justify-between gap-3 border-b border-slate-200 pb-2 text-sm text-slate-800">
            <strong>Agenda de cobranças</strong>
            <span className="shrink-0 text-[10px] font-normal text-slate-400">
              {charges.length} itens
            </span>
          </div>
          {(() => {
            const half =
              charges.length > 4
                ? Math.ceil(charges.length / 2)
                : charges.length;
            const col1 = charges.slice(0, half);
            const col2 = charges.slice(half);

            const renderRow = (charge: Charge) => {
              const values = chargeValues(charge, loan.lateFeePerDay);
              const chargePayments = paymentsForCharge(loan, charge);
              const paymentMethod = paymentMethodSummary(chargePayments);
              const pixReceipts = pixReceiptsForPayments(loan, chargePayments);
              return (
                <div
                  className="report-schedule-row grid min-w-0 break-inside-avoid grid-cols-[38px_minmax(0,1fr)_auto] items-center gap-2 border-b border-slate-100 px-1 py-2.5"
                  key={charge.id}
                >
                  <span className="report-charge-number grid min-h-7 place-items-center rounded-lg bg-violet-50 px-1 text-[9.5px] font-extrabold text-violet-700">
                    {charge.number
                      ? `#${charge.number}`
                      : charge.referenceMonth}
                  </span>
                  <div className="report-charge-info flex min-w-0 flex-col">
                    <span className="text-[9.5px] text-slate-400">
                      {date(charge.dueDate)}
                    </span>
                    <strong className="mt-0.5 overflow-hidden text-xs text-slate-800 text-ellipsis whitespace-nowrap">
                      {money(values.updatedAmount)}
                    </strong>
                    {values.paid > 0 ? (
                      <small className="mt-0.5 text-[8.5px] text-slate-400">
                        Pago: {money(values.paid)}
                      </small>
                    ) : null}
                    {values.paid > 0 ? (
                      <small className="mt-0.5 break-words text-[8.5px] font-semibold text-slate-500">
                        {charge.status === "PARTIAL" ? "Parcial" : "Pago"} via{" "}
                        {paymentMethod || "forma não informada"}
                      </small>
                    ) : null}
                    {values.lateFee > 0 ? (
                      <small className="report-charge-late-fee mt-0.5 break-words text-[8.5px] text-rose-600">
                        +{money(values.lateFee)} juros ({values.overdue}d)
                      </small>
                    ) : null}
                  </div>
                  <div className="flex min-w-0 flex-col items-end gap-1">
                    <span
                      className={`report-charge-status report-charge-${charge.status.toLowerCase()} w-max rounded-full px-2 py-1 text-[8.5px] font-bold whitespace-nowrap ${chargeTone[charge.status]}`}
                    >
                      {chargeStatus[charge.status]}
                    </span>
                    {pixReceipts.length ? (
                      <div className="flex flex-wrap justify-end gap-1 print:hidden">
                        {pixReceipts.map((receipt) => (
                          <ReceiptOpenButton
                            key={receipt.id}
                            receipt={receipt}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            };

            return (
              <div className="report-schedule-columns grid min-w-0 grid-cols-1 gap-x-5 min-[641px]:grid-cols-2 print:grid-cols-2">
                <div className="report-schedule-col min-w-0">
                  {col1.map(renderRow)}
                </div>
                {col2.length > 0 ? (
                  <div className="report-schedule-col min-w-0">
                    {col2.map(renderRow)}
                  </div>
                ) : null}
              </div>
            );
          })()}
        </section>
      </div>

      <div className="report-actions mt-5 grid min-w-0 grid-cols-1 gap-2 border-t border-slate-100 pt-4 min-[421px]:grid-cols-2 min-[641px]:flex min-[641px]:justify-end [&>button]:w-full min-[641px]:[&>button]:w-auto print:hidden">
        <Button variant="secondary" onClick={copyReport}>
          <Copy size={17} /> {copied ? "Resumo copiado" : "Copiar resumo"}
        </Button>
        <Button variant="secondary" onClick={sendWhatsapp}>
          <MessageCircle size={17} /> Enviar no WhatsApp
        </Button>
        <Button onClick={() => void shareReport()}>
          <Share2 size={17} /> Compartilhar
        </Button>
      </div>
    </Modal>
  );
}
