import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import AuthPageShell from '@/components/branding/AuthPageShell';
import CheckoutSuccessClient from './CheckoutSuccessClient';

function CheckoutSuccessFallback() {
  return (
    <AuthPageShell>
      <div className="mt-8 rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center shadow-sm">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-brand-600" aria-hidden />
        <p className="mt-5 text-lg font-semibold text-gray-900">Payment successful</p>
        <p className="mt-2 text-sm text-gray-600">Setting up your account…</p>
      </div>
    </AuthPageShell>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<CheckoutSuccessFallback />}>
      <CheckoutSuccessClient />
    </Suspense>
  );
}
