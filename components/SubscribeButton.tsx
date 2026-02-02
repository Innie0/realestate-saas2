// @ts-nocheck
// Subscribe Button Component
// Redirects user to Stripe Checkout for subscription

'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { CreditCard } from 'lucide-react';

interface SubscribeButtonProps {
  priceId: string;
  planName?: string;
  mode?: 'subscription' | 'payment';
  className?: string;
}

/**
 * SubscribeButton Component
 * Creates a Stripe checkout session and redirects to Stripe
 */
export default function SubscribeButton({ 
  priceId, 
  planName = 'this plan',
  mode = 'subscription',
  className = '',
}: SubscribeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async () => {
    setLoading(true);
    setError('');

    try {
      // Create checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Ensure cookies are sent
        body: JSON.stringify({ priceId, mode }),
      });

      const data = await response.json();

      console.log('[Subscribe] Checkout response:', {
        ok: response.ok,
        status: response.status,
        hasUrl: !!data.url,
        error: data.error,
      });

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout using the URL returned from the API
      if (!data.url) {
        throw new Error('No checkout URL returned');
      }

      console.log('[Subscribe] Redirecting to Stripe Checkout...');
      window.location.href = data.url;
    } catch (err: any) {
      console.error('Subscription error:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <Button
        onClick={handleSubscribe}
        isLoading={loading}
        disabled={loading}
        className="w-full"
      >
        <CreditCard className="w-4 h-4 mr-2" />
        {loading ? 'Processing...' : `Subscribe to ${planName}`}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
