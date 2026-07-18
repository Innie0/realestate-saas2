'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import AuthPageShell from '@/components/branding/AuthPageShell';

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
      <div className="mt-8 rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center shadow-sm">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-brand-600" aria-hidden />
        <p className="mt-5 text-lg font-semibold text-gray-900">Payment successful</p>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
      </div>
    </AuthPageShell>
  );
}
