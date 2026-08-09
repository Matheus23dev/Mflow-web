import { useMemo, useState } from "react";
import { Copy, FileText, IdCard, MapPin, MessageCircle, Phone, Printer } from "lucide-react";
import { date, money } from "../lib/format";
import type { Charge, Loan } from "../types";
import { Avatar, Button, Modal } from "./UI";

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

function chargeAmount(charge: Charge) {
  return Number(charge.amount || charge.interestAmount || 0);
}

function daysOverdue(dueDate: string) {
  const due = new Date(dueDate);
  const today = new Date();
  const dueUtc = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.max(0, Math.floor((todayUtc - dueUtc) / 86_400_000));
}

function chargeValues(charge: Charge, lateFeePerDay: string) {
  const original = chargeAmount(charge);
  const paid = Number(charge.paidAmount);
  const outstanding = Math.max(0, original - paid);
  const overdue = charge.status === "OVERDUE" ? daysOverdue(charge.dueDate) : 0;
  const lateFee = overdue * Number(lateFeePerDay || 0);
  return { original, paid, outstanding, overdue, lateFee, updatedAmount: outstanding + lateFee };
}

function whatsappPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
}

function reportText(loan: Loan) {
  const charges = loan.type === "WEEKLY" ? loan.installments : loan.monthlyCharges;
  const lines = [
    "*MFlow | Resumo do empréstimo*",
    `Cliente: ${loan.customer.name}`,
    `Contrato: ${loan.id}`,
    `Situação: ${loanStatus[loan.status]}`,
    `Data: ${date(loan.loanDate)}`,
    `Valor do empréstimo: ${money(loan.principalAmount)}`,
    loan.type === "WEEKLY"
      ? `Condição: ${loan.installmentCount} parcelas de ${money(loan.installmentAmount)} (${frequency[loan.frequency || "WEEKLY"]})`
      : `Juros mensais: ${loan.monthlyInterestRate ? `${Number(loan.monthlyInterestRate).toLocaleString("pt-BR")}%` : money(loan.monthlyInterestAmount)} | vencimento dia ${loan.monthlyDueDay}`,
    `Juros por atraso: ${money(loan.lateFeePerDay)} por dia`,
    ...(loan.summary.lateFees > 0 ? [`Juros acumulados: ${money(loan.summary.lateFees)}`] : []),
    `Valor atualizado a pagar: ${money(loan.summary.openBalance + loan.summary.lateFees)}`,
    "",
    "*Agenda:*",
    ...charges.slice(0, 20).map((charge) => {
      const label = charge.number ? `Parcela ${charge.number}` : `Juros ${charge.referenceMonth}`;
      const values = chargeValues(charge, loan.lateFeePerDay);
      const lateFee = values.lateFee > 0 ? ` (inclui ${money(values.lateFee)} de juros por ${values.overdue} ${values.overdue === 1 ? "dia" : "dias"})` : "";
      return `${label}: ${money(values.updatedAmount)} em ${date(charge.dueDate)} — ${chargeStatus[charge.status]}${lateFee}`;
    }),
    ...(charges.length > 20 ? [`... e mais ${charges.length - 20} cobranças no relatório completo.`] : []),
    "",
    "Relatório informativo emitido pelo MFlow.",
  ];
  return lines.join("\n");
}

export function LoanReportModal({ loan, onClose }: { loan: Loan | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const charges = useMemo(
    () => (loan?.type === "WEEKLY" ? loan.installments : loan?.monthlyCharges) || [],
    [loan],
  );

  if (!loan) return null;

  function printReport() {
    document.body.classList.add("printing-loan-report");
    const finish = () => document.body.classList.remove("printing-loan-report");
    window.addEventListener("afterprint", finish, { once: true });
    window.print();
    window.setTimeout(finish, 1200);
  }

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

  function sendWhatsapp() {
    const url = `https://wa.me/${whatsappPhone(loan!.customer.phone)}?text=${encodeURIComponent(reportText(loan!))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const issuedAt = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());

  return (
    <Modal
      open
      onClose={onClose}
      title="Relatório do empréstimo"
      description="Confira os dados antes de imprimir, salvar em PDF ou enviar ao cliente."
      size="lg"
    >
      <div className="loan-report-print">
        <header className="report-document-header">
          <div className="report-document-brand">
            <span className="brand-mark"><span>M</span></span>
            <div><strong>MFlow</strong><small>Relatório do empréstimo</small></div>
          </div>
          <div className="report-document-id"><span>Contrato</span><strong>{loan.id}</strong><small>Emitido em {issuedAt}</small></div>
        </header>

        <section className="report-client-card">
          <div className="report-client-header">
            <Avatar name={loan.customer.name} size="lg" />
            <div><span>Cliente</span><strong>{loan.customer.name}</strong></div>
          </div>
          <div className="report-client-data">
            <div className="report-client-item"><span><Phone size={14} /> Telefone</span><strong>{loan.customer.phone}</strong></div>
            <div className="report-client-item"><span><IdCard size={14} /> CPF</span><strong>{loan.customer.cpf || "Não informado"}</strong></div>
            <div className="report-client-item report-client-address"><span><MapPin size={14} /> Endereço</span><strong>{loan.customer.address || "Não informado"}</strong></div>
          </div>
        </section>

        <div className="report-contract-status">
          <div><span>Situação atual</span><strong>{loanStatus[loan.status]}</strong></div>
          <div><span>Data do empréstimo</span><strong>{date(loan.loanDate)}</strong></div>
          <div><span>Valor atualizado a pagar</span><strong>{money(loan.summary.openBalance + loan.summary.lateFees)}</strong></div>
          {loan.summary.lateFees > 0 && <div className="report-late-fee-total"><span>Juros por atraso</span><strong>{money(loan.summary.lateFees)}</strong></div>}
          <div><span>Total recebido</span><strong>{money(loan.summary.received)}</strong></div>
        </div>

        <section className="report-section">
          <div className="report-section-title"><FileText size={17} /><strong>Condições do contrato</strong></div>
          <div className="report-terms">
            <div><span>Modalidade</span><strong>{loan.type === "WEEKLY" ? "Parcelado" : "Juros mensal"}</strong></div>
            <div><span>Valor do empréstimo</span><strong>{money(loan.principalAmount)}</strong></div>
            {loan.type === "WEEKLY" ? <>
              <div><span>Total contratado</span><strong>{money(loan.totalContracted)}</strong></div>
              <div><span>Parcelas</span><strong>{loan.installmentCount} × {money(loan.installmentAmount)}</strong></div>
              <div><span>Frequência</span><strong>{frequency[loan.frequency || "WEEKLY"]}</strong></div>
              <div><span>Primeiro vencimento</span><strong>{date(loan.firstDueDate)}</strong></div>
            </> : <>
              <div><span>Juros mensais</span><strong>{loan.monthlyInterestRate ? `${Number(loan.monthlyInterestRate).toLocaleString("pt-BR")}%` : money(loan.monthlyInterestAmount)}</strong></div>
              <div><span>Valor mensal atual</span><strong>{money(loan.monthlyInterestAmount)}</strong></div>
              <div><span>Dia de vencimento</span><strong>Dia {loan.monthlyDueDay}</strong></div>
            </>}
            <div><span>Juros por atraso</span><strong>{money(loan.lateFeePerDay)} por dia</strong></div>
          </div>
        </section>

        <section className="report-section">
          <div className="report-section-title"><strong>Agenda de cobranças</strong><span>{charges.length} itens</span></div>
          <div className="report-schedule">
            {charges.map((charge) => {
              const values = chargeValues(charge, loan.lateFeePerDay);
              return (
                <div className="report-schedule-row" key={charge.id}>
                  <span className="report-charge-number">{charge.number ? `#${charge.number}` : charge.referenceMonth}</span>
                  <div><span>Vencimento</span><strong>{date(charge.dueDate)}</strong></div>
                  <div className="report-charge-amount">
                    <span>{values.lateFee > 0 ? "Total atualizado" : "Valor a pagar"}</span>
                    <strong>{money(values.updatedAmount)}</strong>
                    {values.paid > 0 && <small>Original {money(values.original)} · pago {money(values.paid)}</small>}
                    {values.lateFee > 0 && <small className="report-charge-late-fee">Parcela {money(values.outstanding)} + juros {money(values.lateFee)} · {values.overdue} {values.overdue === 1 ? "dia" : "dias"}</small>}
                  </div>
                  <span className={`report-charge-status report-charge-${charge.status.toLowerCase()}`}>{chargeStatus[charge.status]}</span>
                </div>
              );
            })}
          </div>
        </section>

        <footer className="report-document-footer">
          <p>Este documento é um resumo informativo do contrato e da situação registrada no momento da emissão.</p>
          <span>MFlow · Gestão financeira</span>
        </footer>
      </div>

      <div className="report-actions">
        <Button variant="secondary" onClick={copyReport}><Copy size={17} /> {copied ? "Resumo copiado" : "Copiar resumo"}</Button>
        <Button variant="secondary" onClick={sendWhatsapp}><MessageCircle size={17} /> Enviar no WhatsApp</Button>
        <Button onClick={printReport}><Printer size={17} /> Imprimir / salvar PDF</Button>
      </div>
    </Modal>
  );
}
