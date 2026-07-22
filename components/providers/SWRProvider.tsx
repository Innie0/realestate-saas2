'use client';

import { SWRConfig } from 'swr';
import { swrFetcher } from '@/lib/swr';

export default function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: swrFetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 90_000,
        keepPreviousData: true,
      }}
    >
      {children}
    </SWRConfig>
  );
}
