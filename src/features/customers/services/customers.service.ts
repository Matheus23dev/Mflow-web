import { api, queryString } from "@/shared/lib/api";
import type { Customer, CustomerDetails, Loan } from "@/shared/types";

export type CustomerPayload = Pick<Customer, "name" | "phone" | "cpf" | "address" | "notes">;

export const customersService = {
  list: (search = "") => api<Customer[]>(`/customers${queryString({ search })}`),
  find: (id: string) => api<CustomerDetails>(`/customers/${id}`),
  create: (payload: CustomerPayload) => api<Customer>("/customers", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: CustomerPayload) => api<Customer>(`/customers/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  loanReport: (loanId: string) => api<Loan>(`/loans/${loanId}`),
};
