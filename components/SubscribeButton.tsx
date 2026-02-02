// Subscribe Button Component
// Redirects user to Stripe Checkout for subscription

'use client';

import { useState } from 'react';
import { getStripe } from '@/lib/stripe-client';
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
        body: JSON.stringify({ priceId, mode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      const stripe = await getStripe();
      
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }
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
