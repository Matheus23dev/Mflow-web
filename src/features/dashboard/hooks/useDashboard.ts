import { useCallback, useEffect, useState } from "react";
import type { DashboardData } from "@/shared/types";
import { dashboardService } from "../services/dashboard.service";

export function useDashboard(refreshKey: number) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const result = await dashboardService.get();
      setData(result);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar o painel.");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void reload(), 0);
    return () => window.clearTimeout(timer);
  }, [reload, refreshKey]);

  return { data, error, reload };
}
