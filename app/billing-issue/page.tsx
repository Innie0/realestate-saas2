'use client';

import { useEffect, useState } from 'react';
import AuthPageShell from '@/components/branding/AuthPageShell';
import AuthFormCard from '@/components/branding/AuthFormCard';
import { signOut } from '@/lib/supabase';

interface BillingIssue {
  status: string | null;
  amountDue?: number | null;
  currency?: string;
  payUrl?: string | null;
  nextRetry?: number | null;
}

const buttonBase =
  'inline-flex w-full items-center justify-center rounded-mkt-button py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50';

/** Shown to users whose payment failed: pay now or update their card, instead of picking a new plan. */
export default function BillingIssuePage() {
  const [info, setInfo] = useState<BillingIssue | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Update your payment - Oikaro';
    fetch('/api/stripe/billing-issue', { credentials: 'include' })
      .then(async (res) => {
        if (res.status === 401) {
          window.location.href = '/auth/login';
          return;
        }
        const data: BillingIssue = await res.json();
        // Already sorted out (paid, or a different situation): nothing to fix here
        if (data.status && data.status !== 'past_due') {
          window.location.href = data.status === 'active' || data.status === 'trialing' ? '/dashboard' : '/pricing';
          return;
        }
        setInfo(data);
      })
      .catch(() => setInfo({ status: 'past_due' }));
  }, []);

  const openBilling = async () => {
    setOpeningPortal(true);
    setError('');
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error();
      window.location.href = data.url;
    } catch {
      setError("Couldn't open billing. Please try again, or email support@oikaro.com.");
      setOpeningPortal(false);
    }
  };

  const amount =
    info?.amountDue != null
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: (info.currency || 'usd').toUpperCase(),
          minimumFractionDigits: info.amountDue % 1 === 0 ? 0 : 2,
        }).format(info.amountDue)
      : null;
  const retryDate = info?.nextRetry
    ? new Date(info.nextRetry).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : null;

  return (
    <AuthPageShell>
      <div className="mb-6 text-center">
        <h1 className="font-display text-3xl font-medium tracking-[-0.03em] text-mkt-foreground">
          Your payment didn&apos;t go through
        </h1>
        <p className="mt-2 text-sm text-mkt-secondary sm:text-base">
          {amount ? `We couldn't charge ${amount} for your Oikaro plan.` : "We couldn't charge your card for your Oikaro plan."}{' '}
          Your account and everything in it are safe. Your plan comes back as soon as the payment goes through.
        </p>
      </div>

      <AuthFormCard>
        {!info ? (
          <p className="text-center text-sm text-mkt-secondary">Loading…</p>
        ) : (
          <div className="flex flex-col gap-3">
            {info.payUrl && (
              <a href={info.payUrl} className={`${buttonBase} bg-[#0668E1] text-white hover:bg-[#0558c0]`}>
                {amount ? `Pay ${amount} now` : 'Pay now'}
              </a>
            )}
            <button
              type="button"
              onClick={openBilling}
              disabled={openingPortal}
              className={`${buttonBase} ${
                info.payUrl
                  ? 'border border-mkt-border bg-transparent text-mkt-foreground hover:bg-black/[0.03]'
                  : 'bg-[#0668E1] text-white hover:bg-[#0558c0]'
              }`}
            >
              {openingPortal ? 'Opening…' : 'Update your card'}
            </button>

            {error && (
              <p className="text-center text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            {retryDate && (
              <p className="mt-2 text-center text-xs leading-relaxed text-mkt-secondary">
                Or do nothing: we&apos;ll try your card again on {retryDate}.
              </p>
            )}
          </div>
        )}
      </AuthFormCard>

      <p className="mt-6 text-center text-sm text-mkt-secondary">
        Questions? Email{' '}
        <a href="mailto:support@oikaro.com" className="font-medium text-mkt-foreground hover:opacity-70">
          support@oikaro.com
        </a>
        {' · '}
        <button
          type="button"
          onClick={async () => {
            await signOut();
            window.location.href = '/';
          }}
          className="font-medium text-mkt-foreground hover:opacity-70"
        >
          Sign out
        </button>
      </p>
    </AuthPageShell>
  );
}
