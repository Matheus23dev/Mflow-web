import { api, queryString } from "@/shared/lib/api";
import type { Loan, LoanStatus, LoanType } from "@/shared/types";

export type LoanFilters = { status: LoanStatus | ""; type: LoanType | "" };

export const loansService = {
  list: (filters: LoanFilters) => api<Loan[]>(`/loans${queryString(filters)}`),
  create: (payload: Record<string, unknown>) => api<Loan>("/loans", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: Record<string, unknown>) => api<Loan>(`/loans/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  cancel: (id: string) => api<{ success: boolean }>(`/loans/${id}/cancel`, { method: "POST" }),
};
