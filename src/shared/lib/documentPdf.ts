import { chargeValues } from "./charges";
import { formatCpf, formatPhone } from "./format";
import { paymentMethodSummary, paymentsForCharge, pixReceiptsForPayments } from "./payments";
import type { Charge, Loan, ReportData } from "../types";

type Pdf = import("jspdf").jsPDF;
type Color = [number, number, number];

const C = {
  purple: [109, 67, 220] as Color,
  purpleDark: [86, 51, 184] as Color,
  purpleSoft: [246, 242, 255] as Color,
  text: [47, 43, 56] as Color,
  muted: [126, 119, 137] as Color,
  border: [231, 228, 237] as Color,
  soft: [249, 248, 251] as Color,
  green: [32, 168, 117] as Color,
  greenSoft: [237, 251, 246] as Color,
  amber: [217, 144, 42] as Color,
  amberSoft: [255, 248, 232] as Color,
  red: [223, 86, 101] as Color,
  redSoft: [255, 241, 243] as Color,
};

const money = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));

const date = (value: string | Date | null | undefined) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value))
    : "Não informado";

function safeName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9-]+/gi, "-").replace(/^-+|-+$/g, "");
}

function fill(pdf: Pdf, color: Color) {
  pdf.setFillColor(...color);
}

function textColor(pdf: Pdf, color: Color) {
  pdf.setTextColor(...color);
}

function drawColor(pdf: Pdf, color: Color) {
  pdf.setDrawColor(...color);
}

function card(pdf: Pdf, x: number, y: number, width: number, height: number, background: Color = [255, 255, 255], border: Color = C.border) {
  fill(pdf, background);
  drawColor(pdf, border);
  pdf.setLineWidth(0.25);
  pdf.roundedRect(x, y, width, height, 2.2, 2.2, "FD");
}

function fit(pdf: Pdf, value: string, maxWidth: number, size: number, min = 5.5) {
  let result = size;
  pdf.setFontSize(result);
  while (result > min && pdf.getTextWidth(value) > maxWidth) {
    result -= 0.3;
    pdf.setFontSize(result);
  }
}

function header(pdf: Pdf, title: string, subtitle: string, rightTop: string, rightBottom: string) {
  const width = pdf.internal.pageSize.getWidth();
  fill(pdf, C.purpleDark);
  pdf.roundedRect(13, 12.5, 13, 13, 3, 3, "F");
  fill(pdf, C.purple);
  pdf.roundedRect(12, 11.5, 13, 13, 3, 3, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11.5);
  pdf.setTextColor(255, 255, 255);
  pdf.text("M", 18.5, 20.6, { align: "center" });
  textColor(pdf, C.text);
  pdf.setFontSize(15.5);
  pdf.text("MFlow", 29, 20.4);
  pdf.setFont("helvetica", "bold");
  textColor(pdf, C.text);
  pdf.setFontSize(19);
  pdf.text(title, 12, 35);
  pdf.setFont("helvetica", "normal");
  textColor(pdf, C.muted);
  pdf.setFontSize(9);
  pdf.text(subtitle, 12, 40.5);
  pdf.setFont("helvetica", "bold");
  textColor(pdf, C.text);
  pdf.setFontSize(8.5);
  pdf.text(rightTop, width - 12, 17, { align: "right" });
  pdf.setFont("helvetica", "normal");
  textColor(pdf, C.muted);
  pdf.setFontSize(8);
  pdf.text(rightBottom, width - 12, 22, { align: "right" });
  drawColor(pdf, C.purple);
  pdf.setLineWidth(0.65);
  pdf.line(12, 45, width - 12, 45);
}

function topRule(pdf: Pdf) {
  const width = pdf.internal.pageSize.getWidth();
  drawColor(pdf, C.purple);
  pdf.setLineWidth(0.8);
  pdf.line(12, 14, width - 12, 14);
}

function section(pdf: Pdf, title: string, y: number) {
  const width = pdf.internal.pageSize.getWidth();
  pdf.setFont("helvetica", "bold");
  textColor(pdf, C.purple);
  pdf.setFontSize(9.5);
  pdf.text(title.toUpperCase(), 12, y);
  drawColor(pdf, C.border);
  pdf.setLineWidth(0.25);
  pdf.line(12, y + 2.3, width - 12, y + 2.3);
}

function field(pdf: Pdf, x: number, y: number, width: number, label: string, value: string) {
  card(pdf, x, y, width, 22, C.soft);
  pdf.setFont("helvetica", "normal");
  textColor(pdf, C.muted);
  pdf.setFontSize(8.5);
  pdf.text(label, x + 4, y + 7.4);
  pdf.setFont("helvetica", "bold");
  textColor(pdf, C.text);
  fit(pdf, value, width - 8, 12, 8);
  pdf.text(value, x + 4, y + 16.3);
}

function footer(pdf: Pdf) {
  const pages = pdf.getNumberOfPages();
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page);
    drawColor(pdf, C.border);
    pdf.setLineWidth(0.2);
    pdf.line(12, height - 11, width - 12, height - 11);
    pdf.setFont("helvetica", "normal");
    textColor(pdf, C.muted);
    pdf.setFontSize(7.5);
    pdf.text(`Página ${page} de ${pages}`, width - 12, height - 6.5, { align: "right" });
  }
}

function asFile(pdf: Pdf, name: string) {
  return new File([pdf.output("blob")], `${safeName(name) || "MFlow"}.pdf`, { type: "application/pdf" });
}

const loanStatus: Record<Loan["status"], string> = {
  ACTIVE: "Em dia", OVERDUE: "Em atraso", PAID: "Pago", RENEWED: "Renovado", CANCELLED: "Cancelado",
};
const chargeStatus: Record<Charge["status"], string> = {
  PENDING: "Pendente", OVERDUE: "Em atraso", PAID: "Pago", PARTIAL: "Parcial",
};
const frequency = { WEEKLY: "Semanal", BIWEEKLY: "Quinzenal", MONTHLY: "Mensal" } as const;

function chargeInfo(loan: Loan, charge: Charge) {
  const values = chargeValues(charge, loan.lateFeePerDay);
  const payments = paymentsForCharge(loan, charge);
  const method = paymentMethodSummary(payments);
  const receipt = pixReceiptsForPayments(loan, payments).length > 0;
  const parts = [chargeStatus[charge.status]];
  if (method) parts.push(`via ${method}`);
  if (receipt) parts.push("comprovante Pix salvo");
  if (values.lateFee > 0) parts.push(`${money(values.lateFee)} de juros`);
  return { values, details: parts.join(" | ") };
}

function chargeRow(pdf: Pdf, loan: Loan, charge: Charge, x: number, y: number, width: number) {
  const { values, details } = chargeInfo(loan, charge);
  const color = charge.status === "PAID" ? C.green : charge.status === "OVERDUE" ? C.red : charge.status === "PARTIAL" ? C.purple : C.amber;
  const soft = charge.status === "PAID" ? C.greenSoft : charge.status === "OVERDUE" ? C.redSoft : charge.status === "PARTIAL" ? C.purpleSoft : C.amberSoft;
  card(pdf, x, y, width, 25);
  fill(pdf, soft);
  pdf.roundedRect(x + 3, y + 3, 19, 19, 2, 2, "F");
  pdf.setFont("helvetica", "bold");
  textColor(pdf, color);
  pdf.setFontSize(9);
  pdf.text(charge.number ? `#${charge.number}` : charge.referenceMonth || "Juros", x + 12.5, y + 14.8, { align: "center" });
  pdf.setFont("helvetica", "bold");
  textColor(pdf, C.text);
  pdf.setFontSize(10.2);
  pdf.text(charge.number ? `Parcela ${charge.number}` : `Juros ${charge.referenceMonth}`, x + 25, y + 8);
  pdf.setFont("helvetica", "bold");
  textColor(pdf, C.text);
  pdf.setFontSize(10.5);
  pdf.text(date(charge.dueDate), x + 25, y + 14.7);
  fit(pdf, details, width - 29, 7.4, 5.8);
  pdf.text(details, x + 25, y + 21.5);
  pdf.setFont("helvetica", "bold");
  textColor(pdf, color);
  fit(pdf, money(values.updatedAmount), 30, 11, 8);
  pdf.text(money(values.updatedAmount), x + width - 4, y + 13.8, { align: "right" });
}

export async function createLoanDocumentPdf(loan: Loan) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const usable = 186;
  const gap = 4;

  topRule(pdf);
  section(pdf, "Dados do cliente", 24);
  card(pdf, 12, 29, usable, 32);
  pdf.setFont("helvetica", "bold");
  textColor(pdf, C.text);
  fit(pdf, loan.customer.name, 116, 16.5, 11);
  pdf.text(loan.customer.name, 17, 39);
  fill(pdf, C.purpleSoft);
  pdf.roundedRect(139, 33, 54, 12, 2, 2, "F");
  pdf.setFont("helvetica", "normal");
  textColor(pdf, C.purple);
  pdf.setFontSize(7.4);
  pdf.text("CONTRATO", 143, 37.5);
  pdf.setFont("helvetica", "bold");
  fit(pdf, loan.id, 46, 9.4, 7.2);
  pdf.text(loan.id, 143, 42.5);
  pdf.setFont("helvetica", "normal");
  textColor(pdf, C.muted);
  pdf.setFontSize(9.7);
  pdf.text(`Telefone: ${formatPhone(loan.customer.phone) || "Não informado"}`, 17, 49);
  pdf.text(`CPF: ${formatCpf(loan.customer.cpf) || "Não informado"}`, 93, 49);
  const address = `Endereço: ${loan.customer.address || "Não informado"}`;
  fit(pdf, address, 121, 9.4, 7.5);
  pdf.text(address, 17, 56.5);
  pdf.setFont("helvetica", "normal");
  textColor(pdf, C.muted);
  pdf.setFontSize(8.5);
  pdf.text(`PDF gerado em: ${date(new Date())}`, 193, 56.5, { align: "right" });

  section(pdf, "Resumo financeiro", 70);
  const summary: Array<[string, string, Color]> = [
    ["Situação atual", loanStatus[loan.status], C.purpleSoft],
    ["Valor atualizado a pagar", money(loan.summary.openBalance + loan.summary.lateFees), C.amberSoft],
    ["Total recebido", money(loan.summary.received), C.greenSoft],
    ["Juros por atraso", money(loan.summary.lateFees), C.redSoft],
  ];
  const summaryWidth = (usable - gap * 3) / 4;
  summary.forEach(([label, value, tone], index) => {
    const x = 12 + index * (summaryWidth + gap);
    card(pdf, x, 75, summaryWidth, 25, tone, tone);
    pdf.setFont("helvetica", "normal");
    textColor(pdf, C.muted);
    fit(pdf, label, summaryWidth - 6, 8.2, 6.4);
    pdf.text(label, x + 3, 83);
    pdf.setFont("helvetica", "bold");
    textColor(pdf, C.text);
    fit(pdf, value, summaryWidth - 6, 12.6, 8.5);
    pdf.text(value, x + 3, 94.2);
  });

  section(pdf, "Condições do contrato", 108);
  const conditions: Array<[string, string]> = [
    ["Modalidade", loan.type === "WEEKLY" ? "Parcelado" : "Juros mensal"],
    ["Valor do empréstimo", money(loan.principalAmount)],
    ...(loan.type === "WEEKLY"
      ? ([
          ["Total contratado", money(loan.totalContracted)],
          ["Parcelas", `${loan.installmentCount} x ${money(loan.installmentAmount)}`],
          ["Frequência", frequency[loan.frequency || "WEEKLY"]],
          ["Primeiro vencimento", date(loan.firstDueDate)],
        ] as Array<[string, string]>)
      : ([
          ["Juros mensais", loan.monthlyInterestRate ? `${Number(loan.monthlyInterestRate).toLocaleString("pt-BR")}%` : money(loan.monthlyInterestAmount)],
          ["Valor mensal atual", money(loan.monthlyInterestAmount)],
          ["Dia de vencimento", `Dia ${loan.monthlyDueDay}`],
          ["Juros por atraso", `${money(loan.lateFeePerDay)} por dia`],
        ] as Array<[string, string]>)),
  ];
  const conditionWidth = (usable - gap * 2) / 3;
  conditions.slice(0, 6).forEach(([label, value], index) => {
    field(pdf, 12 + (index % 3) * (conditionWidth + gap), 113 + Math.floor(index / 3) * 25, conditionWidth, label, value);
  });

  if (loan.type === "WEEKLY") {
    const charges = loan.installments;
    let index = 0;
    let agendaY = 173;
    let firstPage = true;
    while (index < charges.length || (firstPage && charges.length === 0)) {
      if (!firstPage) {
        pdf.addPage();
        topRule(pdf);
        agendaY = 29;
      }
      section(pdf, firstPage ? `Agenda de cobranças - ${charges.length} itens` : "Agenda de cobranças - continuação", agendaY - 5);
      if (!charges.length) {
        pdf.setFont("helvetica", "normal");
        textColor(pdf, C.muted);
        pdf.setFontSize(8);
        pdf.text("Nenhuma cobrança registrada.", 12, agendaY + 6);
        break;
      }
      const rowHeight = 27;
      const rows = Math.max(1, Math.floor((281 - agendaY) / rowHeight));
      const pageCharges = charges.slice(index, index + rows * 2);
      const firstColumn = Math.ceil(pageCharges.length / 2);
      const width = (usable - gap) / 2;
      pageCharges.forEach((charge, position) => {
        const column = position < firstColumn ? 0 : 1;
        const row = column === 0 ? position : position - firstColumn;
        chargeRow(pdf, loan, charge, 12 + column * (width + gap), agendaY + row * rowHeight, width);
      });
      index += pageCharges.length;
      firstPage = false;
    }
  }
  footer(pdf);
  return asFile(pdf, `Emprestimo-${loan.customer.name}`);
}

function metricCard(pdf: Pdf, x: number, y: number, width: number, label: string, value: string, caption: string, color: Color, soft: Color) {
  card(pdf, x, y, width, 34);
  fill(pdf, soft);
  pdf.roundedRect(x + 4, y + 4, 8, 8, 2, 2, "F");
  fill(pdf, color);
  pdf.circle(x + 8, y + 8, 1.5, "F");
  pdf.setFont("helvetica", "normal");
  textColor(pdf, C.muted);
  pdf.setFontSize(7.6);
  pdf.text(label, x + 4, y + 18);
  pdf.setFont("helvetica", "bold");
  textColor(pdf, C.text);
  fit(pdf, value, width - 8, 13.2, 8.5);
  pdf.text(value, x + 4, y + 26);
  pdf.setFont("helvetica", "normal");
  textColor(pdf, C.muted);
  pdf.setFontSize(6.4);
  pdf.text(caption, x + 4, y + 31.5);
}

export async function createReportsDocumentPdf(data: ReportData, from: string, to: string) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const usable = 273;
  const gap = 5;
  const period = from || to ? `${from ? date(from) : "Início"} até ${to ? date(to) : "Hoje"}` : "Todo período";
  header(pdf, "Relatórios", "Retorno, risco e composição da carteira", "Período analisado", period);
  const metrics: Array<[string, string, string, Color, Color]> = [
    ["Total emprestado", money(data.metrics.totalLent), "capital liberado", C.purple, C.purpleSoft],
    ["Total recebido", money(data.metrics.totalReceived), "pagamentos confirmados", C.green, C.greenSoft],
    ["Saldo em aberto", money(data.metrics.openBalance), "a recuperar da carteira", C.amber, C.amberSoft],
    ["Em atraso", money(data.metrics.overdue), "cobranças vencidas", C.red, C.redSoft],
  ];
  const metricWidth = (usable - gap * 3) / 4;
  metrics.forEach(([label, value, caption, color, soft], index) => metricCard(pdf, 12 + index * (metricWidth + gap), 53, metricWidth, label, value, caption, color, soft));

  const chartX = 12;
  const chartY = 94;
  const chartWidth = 178;
  const panelHeight = 94;
  card(pdf, chartX, chartY, chartWidth, panelHeight);
  pdf.setFont("helvetica", "bold");
  textColor(pdf, C.purple);
  pdf.setFontSize(7.5);
  pdf.text("COMPARATIVO FINANCEIRO", chartX + 7, chartY + 9);
  textColor(pdf, C.text);
  pdf.setFontSize(12);
  pdf.text("Composição da carteira", chartX + 7, chartY + 17);
  const items: Array<[string, number, Color]> = [
    ["Emprestado", data.metrics.totalLent, C.purple],
    ["Recebido", data.metrics.totalReceived, C.green],
    ["Em aberto", data.metrics.openBalance, C.amber],
    ["Atrasado", data.metrics.overdue, C.red],
  ];
  const max = Math.max(...items.map((item) => item[1]), 1);
  const plotTop = chartY + 28;
  const plotBottom = chartY + 78;
  drawColor(pdf, C.border);
  pdf.setLineWidth(0.2);
  for (let line = 0; line <= 4; line += 1) pdf.line(chartX + 10, plotTop + ((plotBottom - plotTop) / 4) * line, chartX + chartWidth - 8, plotTop + ((plotBottom - plotTop) / 4) * line);
  items.forEach(([label, value, color], index) => {
    const center = chartX + 28 + index * 40;
    const height = Math.max(2, ((plotBottom - plotTop) * value) / max);
    fill(pdf, color);
    pdf.roundedRect(center - 7, plotBottom - height, 14, height, 1.5, 1.5, "F");
    pdf.setFont("helvetica", "normal");
    textColor(pdf, C.muted);
    fit(pdf, money(value), 31, 7.3, 6.1);
    pdf.text(money(value), center, plotBottom - height - 2.5, { align: "center" });
    pdf.setFont("helvetica", "bold");
    textColor(pdf, C.text);
    pdf.setFontSize(7.2);
    pdf.text(label, center, plotBottom + 6.5, { align: "center" });
  });

  const profitX = chartX + chartWidth + gap;
  const profitWidth = usable - chartWidth - gap;
  card(pdf, profitX, chartY, profitWidth, panelHeight);
  pdf.setFont("helvetica", "bold");
  textColor(pdf, C.purple);
  pdf.setFontSize(7.5);
  pdf.text("RENTABILIDADE", profitX + 7, chartY + 9);
  textColor(pdf, C.text);
  pdf.setFontSize(12);
  pdf.text("Resultado da operação", profitX + 7, chartY + 17);
  fill(pdf, C.purple);
  pdf.roundedRect(profitX + 7, chartY + 23, profitWidth - 14, 28, 2.5, 2.5, "F");
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(225, 215, 255);
  pdf.setFontSize(7.5);
  pdf.text("Lucro realizado", profitX + 12, chartY + 31);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(255, 255, 255);
  fit(pdf, money(data.metrics.realizedProfit), profitWidth - 24, 16, 10);
  pdf.text(money(data.metrics.realizedProfit), profitX + 12, chartY + 42);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.3);
  pdf.text("Recebimentos menos capital recuperado", profitX + 12, chartY + 47);
  const rows: Array<[string, string]> = [
    ["Juros recebidos", money(data.metrics.interestReceived)],
    ["Lucro projetado", money(data.metrics.projectedProfit)],
    ["Capital recuperado", money(data.metrics.capitalRecovered)],
  ];
  rows.forEach(([label, value], index) => {
    const y = chartY + 59 + index * 10;
    drawColor(pdf, C.border);
    pdf.line(profitX + 7, y - 4, profitX + profitWidth - 7, y - 4);
    pdf.setFont("helvetica", "normal");
    textColor(pdf, C.muted);
    pdf.setFontSize(8);
    pdf.text(label, profitX + 8, y + 1);
    pdf.setFont("helvetica", "bold");
    textColor(pdf, C.text);
    fit(pdf, value, 32, 8.5, 6.7);
    pdf.text(value, profitX + profitWidth - 8, y + 1, { align: "right" });
  });
  footer(pdf);
  return asFile(pdf, `Relatorios-MFlow-${new Date().toISOString().slice(0, 10)}`);
}
