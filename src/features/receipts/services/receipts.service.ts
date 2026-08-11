import { api } from "@/shared/lib/api";
import type {
  Receipt,
  ReceiptKind,
  ReceiptStorageStatus,
} from "@/shared/types";

export const receiptsService = {
  status: () => api<ReceiptStorageStatus>("/receipts/storage/status"),
  list: (loanId: string) => api<Receipt[]>(`/receipts/loans/${loanId}`),
  upload: (
    loanId: string,
    file: File,
    kind: ReceiptKind,
    paymentId?: string,
  ) => {
    const body = new FormData();
    body.set("file", file);
    body.set("kind", kind);
    if (paymentId) body.set("paymentId", paymentId);
    return api<Receipt>(`/receipts/loans/${loanId}`, { method: "POST", body });
  },
  file: (id: string) =>
    api<{ url: string; expiresIn: number }>(`/receipts/${id}/file`),
  remove: (id: string) =>
    api<{ success: boolean }>(`/receipts/${id}`, { method: "DELETE" }),
};
