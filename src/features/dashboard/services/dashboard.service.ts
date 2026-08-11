import { api } from "@/shared/lib/api";
import type { DashboardData } from "@/shared/types";

export const dashboardService = {
  get: () => api<DashboardData>("/dashboard"),
};
