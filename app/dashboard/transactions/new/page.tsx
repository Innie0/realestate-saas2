// New Transaction Page
// Form for creating a new transaction

'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import TransactionForm from '@/components/TransactionForm';

export default function NewTransactionPage() {
  // Set page title
  React.useEffect(() => {
    document.title = 'New Transaction - Realestic';
  }, []);

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-gray-800">
          <Link
            href="/dashboard/transactions"
            className="p-2 hover:bg-gray-800 rounded-lg transition-all duration-200 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">New Transaction</h1>
            <p className="text-gray-400">
              Create a new real estate transaction to track its progress
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-white/10 p-6 bg-[#111111]">
          <TransactionForm />
        </div>
      </div>
    </div>
  );
}
