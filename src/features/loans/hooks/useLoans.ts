import { useCallback, useEffect, useState } from "react";
import type { Loan } from "@/shared/types";
import { loansService, type LoanFilters } from "../services/loans.service";

export function useLoans(status: LoanFilters["status"], type: LoanFilters["type"], refreshKey: number) {
  const [loans, setLoans] = useState<Loan[] | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const result = await loansService.list({ status, type });
      setLoans(result);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar os empréstimos.");
    }
  }, [status, type]);

  useEffect(() => {
    const timer = window.setTimeout(() => void reload(), 0);
    return () => window.clearTimeout(timer);
  }, [reload, refreshKey]);

  return { loans, error, reload };
}
