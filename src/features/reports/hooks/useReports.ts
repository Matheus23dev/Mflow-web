import { useCallback, useEffect, useState } from "react";
import type { ReportData } from "@/shared/types";
import { reportsService } from "../services/reports.service";

export function useReports(from: string, to: string, refreshKey: number) {
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const result = await reportsService.get(from, to);
      setData(result);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar os relatórios.");
    }
  }, [from, to]);

  useEffect(() => {
    const timer = window.setTimeout(() => void reload(), 0);
    return () => window.clearTimeout(timer);
  }, [reload, from, to, refreshKey]);

  return { data, error, reload };
}
