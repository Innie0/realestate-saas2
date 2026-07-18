'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { CreditCard } from 'lucide-react';

interface SetupStarterButtonProps {
  className?: string;
}

export default function SetupStarterButton({ className = '' }: SetupStarterButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSetup = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/stripe/setup-starter', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not start checkout');
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <Button onClick={handleSetup} isLoading={loading} disabled={loading} className="w-full">
        <CreditCard className="w-4 h-4 mr-2" />
        {loading ? 'Opening checkout...' : 'Connect Starter subscription'}
      </Button>
      <p className="mt-2 text-xs text-center text-gray-700">
        One-time setup via Stripe so you can test the upgrade flow. 7-day trial, card required.
      </p>
      {error && <p className="mt-2 text-sm text-red-500 text-center">{error}</p>}
    </div>
  );
}
