import { useCallback, useEffect, useState } from "react";
import type { CollectionItem } from "@/shared/types";
import { collectionsService, type CollectionFilter } from "../services/collections.service";

export function useCollections(
  filter: CollectionFilter,
  refreshKey: number,
  from?: string,
  to?: string,
) {
  const [items, setItems] = useState<CollectionItem[] | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const result = await collectionsService.list(filter, from, to);
      setItems(result);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar as cobranças.");
    }
  }, [filter, from, to]);

  useEffect(() => {
    const timer = window.setTimeout(() => void reload(), 0);
    return () => window.clearTimeout(timer);
  }, [reload, refreshKey]);

  return { items, error, reload };
}
