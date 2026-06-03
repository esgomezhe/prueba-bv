/**
 * Wrapper fino sobre SWR para cargar datos con estados explícitos.
 *
 * SWR maneja internamente el ciclo fetch/cache/revalidación, evitando el
 * antipatrón de setState dentro de useEffect. Expone una interfaz simple:
 * { data, loading, error, refetch }.
 */
"use client";

import useSWR, { type Key } from "swr";

import type { ApiError } from "@/lib/http";

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

export function useApi<T>(key: Key, fetcher: () => Promise<T>): ApiState<T> {
  const { data, error, isLoading, mutate } = useSWR<T, ApiError>(key, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  return {
    data: data ?? null,
    loading: isLoading,
    error: error ?? null,
    refetch: () => {
      void mutate();
    },
  };
}
