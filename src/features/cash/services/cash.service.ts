import { api, queryString } from "@/shared/lib/api";
import type { CashData } from "@/shared/types";

export type CashFilters = { from: string; to: string };
export type CashMovementPayload = { type: "INCOME" | "EXPENSE"; amount: number; description: string; transactionDate: string };

export const cashService = {
  list: ({ from, to }: CashFilters) => api<CashData>(`/cash${queryString({ from, to })}`),
  create: (payload: CashMovementPayload) => api("/cash", { method: "POST", body: JSON.stringify(payload) }),
};
