// New Transaction Page
// Form for creating a new transaction

'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Card from '@/components/ui/Card';
import TransactionForm from '@/components/TransactionForm';

export default function NewTransactionPage() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with gradient */}
        <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
        <Link 
          href="/dashboard/transactions"
          className="p-2 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-black to-gray-800 bg-clip-text text-transparent">New Transaction</h1>
          <p className="text-gray-600">
            Create a new real estate transaction to track its progress
          </p>
        </div>
      </div>

        {/* Form */}
        <Card>
          <TransactionForm />
        </Card>
      </div>
    </div>
  );
}
