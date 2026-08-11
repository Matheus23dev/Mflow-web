import type { Charge } from "@/shared/types";

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

export function chargeValues(charge: Charge, lateFeePerDay: string) {
  const original = chargeAmount(charge);
  const paid = Number(charge.paidAmount || 0);
  const outstanding = Math.max(0, original - paid);
  const overdue = charge.status === "OVERDUE" ? daysOverdue(charge.dueDate) : 0;
  const lateFee = overdue * Number(lateFeePerDay || 0);

  return { original, paid, outstanding, overdue, lateFee, updatedAmount: outstanding + lateFee };
}
