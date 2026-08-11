import { api, queryString } from "@/shared/lib/api";
import type { CollectionItem, Loan, Payment } from "@/shared/types";

export type CollectionFilter = "today" | "tomorrow" | "week" | "overdue" | "30days";
export type PaymentPayload = Record<string, unknown>;

export const collectionsService = {
  list: (filter: CollectionFilter) => api<CollectionItem[]>(`/collections${queryString({ filter })}`),
  loan: (id: string) => api<Loan>(`/loans/${id}`),
  receive: (payload: PaymentPayload) => api<Payment>("/payments", { method: "POST", body: JSON.stringify(payload) }),
};
