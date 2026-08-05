'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import AuthPageShell from '@/components/branding/AuthPageShell';
import AuthFormCard from '@/components/branding/AuthFormCard';

export default function CheckoutSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [message, setMessage] = useState('Setting up your account…');

  useEffect(() => {
    document.title = 'Welcome - Oikaro';
  }, []);

  useEffect(() => {
    if (!sessionId) {
      router.replace('/pricing');
      return;
    }

    let cancelled = false;

    async function verify() {
      try {
        const res = await fetch('/api/stripe/verify-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ sessionId }),
        });

        const data = await res.json().catch(() => ({}));

        if (cancelled) return;

        if (res.status === 401) {
          router.replace(`/auth/login?redirect=${encodeURIComponent(`/checkout-success?session_id=${sessionId}`)}`);
          return;
        }

        if (!res.ok && res.status !== 500) {
          router.replace('/pricing');
          return;
        }

        if (!res.ok) {
          setMessage('Taking you to your dashboard…');
        }

        router.replace('/dashboard?welcome=true');
      } catch {
        if (!cancelled) {
          setMessage('Taking you to your dashboard…');
          router.replace('/dashboard?welcome=true');
        }
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [sessionId, router]);

  return (
    <AuthPageShell>
      <div className="mt-8">
        <AuthFormCard>
          <div className="px-2 py-4 text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#0668E1]" aria-hidden />
            <p className="mt-5 text-lg font-semibold text-mkt-foreground">Payment successful</p>
            <p className="mt-2 text-sm text-mkt-secondary">{message}</p>
          </div>
        </AuthFormCard>
      </div>
    </AuthPageShell>
  );
}
