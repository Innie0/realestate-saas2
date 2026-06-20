'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { Sparkles } from 'lucide-react';

interface UpgradeButtonProps {
  priceId?: string;
  className?: string;
}

export default function UpgradeButton({ priceId, className = '' }: UpgradeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpgrade = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/stripe/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(priceId ? { priceId } : {}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upgrade');
      }

      router.push('/dashboard/account?upgraded=1');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <Button onClick={handleUpgrade} isLoading={loading} disabled={loading} className="w-full">
        <Sparkles className="w-4 h-4 mr-2" />
        {loading ? 'Upgrading...' : 'Upgrade to Pro'}
      </Button>
      <p className="mt-2 text-xs text-center text-gray-500">
        You&apos;ll be charged a prorated amount today. No second free trial.
      </p>
      {error && <p className="mt-2 text-sm text-red-500 text-center">{error}</p>}
    </div>
  );
}
