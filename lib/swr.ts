import useSWR, { mutate as globalMutate, type SWRConfiguration } from 'swr';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  [key: string]: unknown;
}

export async function swrFetcher<T = unknown>(url: string): Promise<ApiResponse<T>> {
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Request failed');
  }
  return json;
}

/** Re-fetch all cached transaction list endpoints (any filter/limit). */
export function revalidateTransactionsCache() {
  return globalMutate(
    (key) => typeof key === 'string' && key.startsWith('/api/transactions'),
    undefined,
    { revalidate: true },
  );
}

/** Cached API fetch — shows stale data instantly while revalidating in the background. */
export function useApi<T = unknown>(
  url: string | null,
  config?: SWRConfiguration<ApiResponse<T>>,
) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<ApiResponse<T>>(
    url,
    swrFetcher,
    config,
  );

  return {
    response: data,
    data: (data?.data == null ? undefined : data.data) as T | undefined,
    error,
    /** True only when there is no cached data yet (first visit). */
    isLoading: isLoading && data === undefined,
    isValidating,
    mutate,
  };
}
