import { useCallback, useEffect, useState } from "react";
import type { CashData } from "@/shared/types";
import { cashService } from "../services/cash.service";

export function useCash(from: string, to: string, refreshKey: number) {
  const [data, setData] = useState<CashData | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const result = await cashService.list({ from, to });
      setData(result);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar o caixa.");
    }
  }, [from, to]);

  useEffect(() => {
    const timer = window.setTimeout(() => void reload(), 0);
    return () => window.clearTimeout(timer);
  }, [reload, refreshKey]);

  return { data, error, reload };
}
