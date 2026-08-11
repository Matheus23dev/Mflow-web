import type { Charge, Loan, Payment } from "@/shared/types";

export const paymentMethodLabels: Record<Payment["paymentMethod"], string> = {
  PIX: "Pix",
  CASH: "Dinheiro",
  TRANSFER: "Transferência",
  OTHER: "Outro",
};

export function paymentsForCharge(loan: Loan, charge: Charge) {
  const direct = loan.payments.filter((payment) =>
    charge.number
      ? payment.installmentId === charge.id
      : payment.monthlyChargeId === charge.id,
  );
  if (direct.length) return direct;

  if (charge.status === "PAID") {
    const payoff = loan.payments.filter((payment) => payment.type === "PAYOFF");
    if (payoff.length) return payoff;
  }
  return [];
}

export function paymentMethodSummary(payments: Payment[]) {
  const methods = [
    ...new Set(
      payments.map((payment) => paymentMethodLabels[payment.paymentMethod]),
    ),
  ];
  return methods.join(" + ");
}

export function pixReceiptsForPayments(loan: Loan, payments: Payment[]) {
  const pixPaymentIds = new Set(
    payments
      .filter((payment) => payment.paymentMethod === "PIX")
      .map((payment) => payment.id),
  );
  return loan.receipts.filter(
    (receipt) => receipt.paymentId && pixPaymentIds.has(receipt.paymentId),
  );
}
