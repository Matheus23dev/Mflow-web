import { api, queryString } from "@/shared/lib/api";
import type { ReportData } from "@/shared/types";

export const reportsService = {
  get: (from: string, to: string) => api<ReportData>(`/reports${queryString({ from, to })}`),
};
