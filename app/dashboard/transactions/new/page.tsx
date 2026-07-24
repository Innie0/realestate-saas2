// New Transaction Page
// Form for creating a new transaction

'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import TransactionForm from '@/components/TransactionForm';
import { ProjectTransactionPrefill } from '@/lib/project-transaction-prefill';
import { SkeletonFormCard } from '@/components/skeletons';

function NewTransactionPageContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project_id') || undefined;

  const [prefill, setPrefill] = useState<ProjectTransactionPrefill | null>(null);
  const [isPrefillLoading, setIsPrefillLoading] = useState(!!projectId);
  const [prefillError, setPrefillError] = useState('');

  // Legacy URL params — used when opening without project_id or as fallback
  const legacyAddress = searchParams.get('address') || undefined;
  const legacyCity = searchParams.get('city') || undefined;
  const legacyState = searchParams.get('state') || undefined;
  const legacyPriceParam = searchParams.get('price');
  const legacyPrice = legacyPriceParam ? Number(legacyPriceParam) : undefined;

  useEffect(() => {
    document.title = 'New Transaction - Oikaro';
  }, []);

  useEffect(() => {
    if (!projectId) {
      setPrefill(null);
      setIsPrefillLoading(false);
      return;
    }

    let cancelled = false;

    async function loadPrefill() {
      setIsPrefillLoading(true);
      setPrefillError('');

      try {
        const response = await fetch(`/api/projects/${projectId}/transaction-prefill`);
        const data = await response.json();

        if (cancelled) return;

        if (!data.success) {
          throw new Error(data.error || 'Failed to load project details');
        }

        setPrefill(data.data);
      } catch (err: unknown) {
        if (!cancelled) {
          setPrefillError(err instanceof Error ? err.message : 'Failed to load project details');
        }
      } finally {
        if (!cancelled) {
          setIsPrefillLoading(false);
        }
      }
    }

    loadPrefill();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const backHref = projectId ? `/dashboard/projects/${projectId}` : '/dashboard/transactions';
  const backLabel = projectId ? 'Back to project' : 'Back to transactions';

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
          <Link
            href={backHref}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Transaction</h1>
            <p className="text-gray-700">
              {prefill?.project_title
                ? `Start a deal for ${prefill.project_title}`
                : 'Create a new real estate transaction to track its progress'}
            </p>
          </div>
        </div>

        {prefillError && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-[10px] text-amber-800 text-[13px]">
            Could not load listing details ({prefillError}). You can still enter property info manually.
          </div>
        )}

        <div className="rounded-[10px] border border-gray-200 p-6 bg-[var(--surface)]">
          {isPrefillLoading ? (
            <SkeletonFormCard fields={6} />
          ) : (
            <TransactionForm
              defaultProjectId={projectId}
              defaultAddress={prefill?.property_address || legacyAddress}
              defaultCity={prefill?.property_city || legacyCity}
              defaultState={prefill?.property_state || legacyState}
              defaultZip={prefill?.property_zip || undefined}
              defaultPropertyType={prefill?.property_type || undefined}
              defaultPrice={
                prefill?.offer_price && prefill.offer_price > 0
                  ? prefill.offer_price
                  : legacyPrice && legacyPrice > 0
                    ? legacyPrice
                    : undefined
              }
              linkedProjectTitle={prefill?.project_title}
            />
          )}
        </div>

        <p className="text-center text-[12.5px] text-gray-500">
          <Link href={backHref} className="hover:text-gray-700 underline underline-offset-2">
            {backLabel}
          </Link>
        </p>
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
