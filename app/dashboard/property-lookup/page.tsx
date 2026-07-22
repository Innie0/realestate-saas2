'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataLoadingState from '@/components/dashboard/DataLoadingState';

export default function PropertyLookupRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/property-research');
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--canvas)]">
      <DataLoadingState
        title="Opening Property Research"
        description="Property Lookup now lives in Property Research — one place for owner records and CMA."
        className="py-10"
      />
    </div>
  );
}
