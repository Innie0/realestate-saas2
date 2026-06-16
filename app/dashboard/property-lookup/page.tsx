'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function PropertyLookupRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/property-research');
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  );
}
