// @ts-nocheck
// Subscribe Button Component
// Redirects user to Stripe Checkout for subscription

'use client';

import { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';

interface SubscribeButtonProps {
  priceId: string;
  planName?: string;
  planSlug?: string;
  mode?: 'subscription' | 'payment';
  className?: string;
  tone?: 'default' | 'marketing';
  /** Secondary style for non-popular plan on marketing pages */
  variant?: 'primary' | 'secondary';
}

export default function SubscribeButton({
  priceId,
  planName = 'this plan',
  planSlug,
  mode = 'subscription',
  className = '',
  tone = 'default',
  variant = 'primary',
}: SubscribeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ priceId, mode }),
      });

      const data = await response.json();

      if (response.status === 401) {
        const slug = planSlug || planName.toLowerCase();
        window.location.href = `/auth/signup?plan=${slug}`;
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (!data.url) {
        throw new Error('No checkout URL returned');
      }

      window.location.href = data.url;
    } catch (err: any) {
      console.error('Subscription error:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (tone === 'marketing') {
    const isPrimary = variant === 'primary';
    return (
      <div className={className}>
        <button
          type="button"
          onClick={handleSubscribe}
          disabled={loading}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-mkt-button py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            isPrimary
              ? 'bg-[#0668E1] text-white hover:bg-[#0450b0]'
              : 'border border-mkt-border bg-mkt-background text-mkt-foreground'
          }`}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="h-4 w-4" />
          )}
          {loading ? 'Processing...' : `Start 7-day free trial — ${planName}`}
        </button>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className={className}>
      <Button onClick={handleSubscribe} isLoading={loading} disabled={loading} className="w-full">
        <CreditCard className="w-4 h-4 mr-2" />
        {loading ? 'Processing...' : `Start 7-day free trial — ${planName}`}
      </Button>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
