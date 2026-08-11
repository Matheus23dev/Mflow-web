import { useCallback, useEffect, useState } from "react";
import type { Customer } from "@/shared/types";
import { customersService } from "../services/customers.service";

export function useCustomers(search: string, refreshKey: number) {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const result = await customersService.list(search);
      setCustomers(result);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar os clientes.");
    }
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void reload(), 0);
    return () => window.clearTimeout(timer);
  }, [reload, refreshKey]);

  return { customers, error, reload };
}
