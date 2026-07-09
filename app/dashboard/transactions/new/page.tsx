// New Transaction Page
// Form for creating a new transaction

'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import TransactionForm from '@/components/TransactionForm';

function NewTransactionPageContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project_id') || undefined;
  const address = searchParams.get('address') || undefined;
  const city = searchParams.get('city') || undefined;
  const state = searchParams.get('state') || undefined;
  const priceParam = searchParams.get('price');
  const defaultPrice = priceParam ? Number(priceParam) : undefined;

  // Set page title
  React.useEffect(() => {
    document.title = 'New Transaction - Realestic';
  }, []);

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
          <Link
            href="/dashboard/transactions"
            className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Transaction</h1>
            <p className="text-gray-500">
              Create a new real estate transaction to track its progress
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-gray-200 p-6 bg-white">
          <TransactionForm
            defaultProjectId={projectId}
            defaultAddress={address}
            defaultCity={city}
            defaultState={state}
            defaultPrice={defaultPrice && defaultPrice > 0 ? defaultPrice : undefined}
          />
        </div>
      </div>
    </div>
  );
}

export default function NewTransactionPage() {
  return (
    <Suspense fallback={null}>
      <NewTransactionPageContent />
    </Suspense>
  );
}
