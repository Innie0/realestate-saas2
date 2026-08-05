// TransactionForm component
// Form for creating and editing real estate transactions

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Transaction } from '@/types';
import { TRANSACTION_STATUSES } from '@/lib/transaction-status';
import { revalidateTransactionsCache } from '@/lib/swr';
import ClientPartyField, { ClientSearchResult } from '@/components/transactions/ClientPartyField';

function dateInputValue(value?: string | null): string {
  if (!value) return '';
  return value.includes('T') ? value.slice(0, 10) : value;
}

interface TransactionFormProps {
  transaction?: Transaction; // Existing transaction for editing
  onSuccess?: (transaction: Transaction) => void;
  onCancel?: () => void;
  defaultProjectId?: string; // Link to a listing project (e.g. from Project → Linked tab)
  defaultAddress?: string;
  defaultCity?: string;
  defaultState?: string;
  defaultZip?: string;
  defaultPropertyType?: string;
  defaultPrice?: number;
  linkedProjectTitle?: string;
  initialSection?: 'property' | 'parties' | 'financial' | 'dates';
}

export default function TransactionForm({
  transaction,
  onSuccess,
  onCancel,
  defaultProjectId,
  defaultAddress,
  defaultCity,
  defaultState,
  defaultZip,
  defaultPropertyType,
  defaultPrice,
  linkedProjectTitle,
  initialSection,
}: TransactionFormProps) {
  const router = useRouter();
  const isEditing = !!transaction;

  // Form state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState<'property' | 'parties' | 'financial' | 'dates'>(
    initialSection ?? 'property',
  );

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  // Property info
  const [propertyAddress, setPropertyAddress] = useState(transaction?.property_address || defaultAddress || '');
  const [propertyCity, setPropertyCity] = useState(transaction?.property_city || defaultCity || '');
  const [propertyState, setPropertyState] = useState(transaction?.property_state || defaultState || '');
  const [propertyZip, setPropertyZip] = useState(transaction?.property_zip || defaultZip || '');
  const [propertyType, setPropertyType] = useState(
    transaction?.property_type || defaultPropertyType || 'house',
  );

  // Buyer info
  const [buyerName, setBuyerName] = useState(transaction?.buyer_name || '');
  const [buyerEmail, setBuyerEmail] = useState(transaction?.buyer_email || '');
  const [buyerPhone, setBuyerPhone] = useState(transaction?.buyer_phone || '');
  const [buyerClientId, setBuyerClientId] = useState<string | null>(
    transaction?.buyer_client_id ?? transaction?.client_id ?? null,
  );
  const [buyerAgentName, setBuyerAgentName] = useState(transaction?.buyer_agent_name || '');
  const [buyerAgentEmail, setBuyerAgentEmail] = useState(transaction?.buyer_agent_email || '');
  const [buyerAgentPhone, setBuyerAgentPhone] = useState(transaction?.buyer_agent_phone || '');

  // Seller info
  const [sellerName, setSellerName] = useState(transaction?.seller_name || '');
  const [sellerEmail, setSellerEmail] = useState(transaction?.seller_email || '');
  const [sellerPhone, setSellerPhone] = useState(transaction?.seller_phone || '');
  const [sellerClientId, setSellerClientId] = useState<string | null>(
    transaction?.seller_client_id ?? null,
  );
  const [sellerAgentName, setSellerAgentName] = useState(transaction?.seller_agent_name || '');
  const [sellerAgentEmail, setSellerAgentEmail] = useState(transaction?.seller_agent_email || '');
  const [sellerAgentPhone, setSellerAgentPhone] = useState(transaction?.seller_agent_phone || '');

  // Financial info
  const [offerPrice, setOfferPrice] = useState(
    transaction?.offer_price?.toString()
      || (defaultPrice && defaultPrice > 0 ? String(defaultPrice) : ''),
  );
  const [earnestMoney, setEarnestMoney] = useState(transaction?.earnest_money?.toString() || '');
  const [downPayment, setDownPayment] = useState(transaction?.down_payment?.toString() || '');
  const [loanAmount, setLoanAmount] = useState(transaction?.loan_amount?.toString() || '');
  const [notes, setNotes] = useState(transaction?.notes || '');

  // Important dates
  const [offerDate, setOfferDate] = useState(dateInputValue(transaction?.offer_date));
  const [acceptanceDate, setAcceptanceDate] = useState(dateInputValue(transaction?.acceptance_date));
  const [inspectionDate, setInspectionDate] = useState(dateInputValue(transaction?.inspection_date));
  const [inspectionDeadline, setInspectionDeadline] = useState(dateInputValue(transaction?.inspection_deadline));
  const [appraisalDate, setAppraisalDate] = useState(dateInputValue(transaction?.appraisal_date));
  const [appraisalDeadline, setAppraisalDeadline] = useState(dateInputValue(transaction?.appraisal_deadline));
  const [financingDeadline, setFinancingDeadline] = useState(dateInputValue(transaction?.financing_deadline));
  const [titleDeadline, setTitleDeadline] = useState(dateInputValue(transaction?.title_deadline));
  const [closingDate, setClosingDate] = useState(dateInputValue(transaction?.closing_date));
  const [possessionDate, setPossessionDate] = useState(dateInputValue(transaction?.possession_date));

  // Status
  const [status, setStatus] = useState(transaction?.status || 'active');

  const linkBuyerClient = (client: ClientSearchResult) => {
    setBuyerClientId(client.id);
    setBuyerName(client.name);
    setBuyerEmail(client.email || '');
    setBuyerPhone(client.phone || '');
  };

  const linkSellerClient = (client: ClientSearchResult) => {
    setSellerClientId(client.id);
    setSellerName(client.name);
    setSellerEmail(client.email || '');
    setSellerPhone(client.phone || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate required fields
    if (!propertyAddress.trim()) {
      setError('Property address is required');
      setIsLoading(false);
      return;
    }

    if (!buyerName.trim()) {
      setError('Buyer name is required');
      setIsLoading(false);
      return;
    }

    if (!sellerName.trim()) {
      setError('Seller name is required');
      setIsLoading(false);
      return;
    }

    if (!offerPrice || parseFloat(offerPrice) <= 0) {
      setError('Valid offer price is required');
      setIsLoading(false);
      return;
    }

    const transactionData: Record<string, unknown> = {
      property_address: propertyAddress.trim(),
      property_city: propertyCity.trim() || null,
      property_state: propertyState.trim() || null,
      property_zip: propertyZip.trim() || null,
      property_type: propertyType,
      buyer_name: buyerName.trim(),
      buyer_email: buyerEmail.trim() || null,
      buyer_phone: buyerPhone.trim() || null,
      buyer_agent_name: buyerAgentName.trim() || null,
      buyer_agent_email: buyerAgentEmail.trim() || null,
      buyer_agent_phone: buyerAgentPhone.trim() || null,
      seller_name: sellerName.trim(),
      seller_email: sellerEmail.trim() || null,
      seller_phone: sellerPhone.trim() || null,
      seller_agent_name: sellerAgentName.trim() || null,
      seller_agent_email: sellerAgentEmail.trim() || null,
      seller_agent_phone: sellerAgentPhone.trim() || null,
      offer_price: parseFloat(offerPrice),
      earnest_money: earnestMoney ? parseFloat(earnestMoney) : null,
      down_payment: downPayment ? parseFloat(downPayment) : null,
      loan_amount: loanAmount ? parseFloat(loanAmount) : null,
      notes: notes.trim() || null,
      offer_date: offerDate || null,
      acceptance_date: acceptanceDate || null,
      inspection_date: inspectionDate || null,
      inspection_deadline: inspectionDeadline || null,
      appraisal_date: appraisalDate || null,
      appraisal_deadline: appraisalDeadline || null,
      financing_deadline: financingDeadline || null,
      title_deadline: titleDeadline || null,
      closing_date: closingDate || null,
      possession_date: possessionDate || null,
      buyer_client_id: buyerClientId,
      seller_client_id: sellerClientId,
    };

    if (!isEditing) {
      transactionData.status = status;
      if (defaultProjectId) {
        transactionData.project_id = defaultProjectId;
      }
    }

    try {
      const url = isEditing ? `/api/transactions/${transaction.id}` : '/api/transactions';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save transaction');
      }

      await revalidateTransactionsCache();

      if (onSuccess) {
        onSuccess(data.data);
      } else {
        router.push(`/dashboard/transactions/${data.data.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const sections = [
    { id: 'property', label: 'Property' },
    { id: 'parties', label: 'Buyer & Seller' },
    { id: 'financial', label: 'Financial' },
    { id: 'dates', label: 'Important Dates' },
  ] as const;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-[10px] text-rose-700 text-[13px]">
          {error}
        </div>
      )}

      {!isEditing && defaultProjectId && (
        <div className="px-4 py-2.5 rounded-[10px] bg-teal-50 border border-teal-100 text-teal-800 text-[13px]">
          {linkedProjectTitle ? (
            <>
              Creating transaction for{' '}
              <span className="font-medium">{linkedProjectTitle}</span>
              {' '}— property details are pre-filled from the listing.
            </>
          ) : (
            <>Linked to a listing project — this transaction will show up on that project&apos;s Linked tab.</>
          )}
        </div>
      )}

      {/* Deal status — new transactions only (detail page has its own control) */}
      {!isEditing && (
        <div className="rounded-[10px] border border-gray-150 bg-gray-50 p-4">
          <label className="block text-[13px] font-medium text-gray-900 mb-1.5">Deal status</label>
          <p className="text-[12.5px] text-gray-600 mb-3">
            Set to Closed or Cancelled when the deal is done — it will leave your in-progress list.
          </p>
          <Select
            value={status}
            onChange={(value) => setStatus(value as typeof status)}
            triggerClassName="w-full px-3 py-2 bg-[var(--surface)] border border-gray-200 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            options={TRANSACTION_STATUSES.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />
        </div>
      )}

      {/* Section tabs */}
      <div className="flex gap-0.5 bg-gray-100 p-1 rounded-[10px]">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveSection(section.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-[12.5px] font-medium transition-colors duration-150 ${
              activeSection === section.id
                ? 'bg-gray-900 text-white'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Property Section */}
      {activeSection === 'property' && (
        <div className="space-y-4">
          <h3 className="text-[15px] font-semibold text-gray-900">Property Information</h3>
          
          <Input
            label="Property Address *"
            value={propertyAddress}
            onChange={(e) => setPropertyAddress(e.target.value)}
            placeholder="123 Main Street"
            required
          />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Input
              label="City"
              value={propertyCity}
              onChange={(e) => setPropertyCity(e.target.value)}
              placeholder="City"
            />
            <Input
              label="State"
              value={propertyState}
              onChange={(e) => setPropertyState(e.target.value)}
              placeholder="State"
            />
            <Input
              label="ZIP Code"
              value={propertyZip}
              onChange={(e) => setPropertyZip(e.target.value)}
              placeholder="12345"
            />
          </div>

          <Select
            label="Property Type"
            value={propertyType}
            onChange={(value) => setPropertyType(value as typeof propertyType)}
            triggerClassName="w-full px-3 py-2 bg-[var(--surface)] border border-gray-200 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            options={[
              { value: 'house', label: 'House' },
              { value: 'apartment', label: 'Apartment' },
              { value: 'condo', label: 'Condo' },
              { value: 'land', label: 'Land' },
              { value: 'commercial', label: 'Commercial' },
            ]}
          />
        </div>
      )}

      {/* Parties Section */}
      {activeSection === 'parties' && (
        <div className="space-y-6">
          {/* Buyer Info */}
          <div className="space-y-4">
            <h3 className="text-[15px] font-semibold text-gray-900">Buyer Information</h3>

            <ClientPartyField
              role="buyer"
              name={buyerName}
              email={buyerEmail}
              phone={buyerPhone}
              linkedClientId={buyerClientId}
              onNameChange={setBuyerName}
              onEmailChange={setBuyerEmail}
              onPhoneChange={setBuyerPhone}
              onLinkClient={linkBuyerClient}
              onUnlinkClient={() => setBuyerClientId(null)}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Buyer's Agent"
                value={buyerAgentName}
                onChange={(e) => setBuyerAgentName(e.target.value)}
                placeholder="Agent name"
              />
              <Input
                label="Agent Email"
                type="email"
                value={buyerAgentEmail}
                onChange={(e) => setBuyerAgentEmail(e.target.value)}
                placeholder="agent@email.com"
              />
              <Input
                label="Agent Phone"
                value={buyerAgentPhone}
                onChange={(e) => setBuyerAgentPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          {/* Seller Info */}
          <div className="space-y-4 pt-4 border-t border-gray-150">
            <h3 className="text-[15px] font-semibold text-gray-900">Seller Information</h3>

            <ClientPartyField
              role="seller"
              name={sellerName}
              email={sellerEmail}
              phone={sellerPhone}
              linkedClientId={sellerClientId}
              onNameChange={setSellerName}
              onEmailChange={setSellerEmail}
              onPhoneChange={setSellerPhone}
              onLinkClient={linkSellerClient}
              onUnlinkClient={() => setSellerClientId(null)}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Seller's Agent"
                value={sellerAgentName}
                onChange={(e) => setSellerAgentName(e.target.value)}
                placeholder="Agent name"
              />
              <Input
                label="Agent Email"
                type="email"
                value={sellerAgentEmail}
                onChange={(e) => setSellerAgentEmail(e.target.value)}
                placeholder="agent@email.com"
              />
              <Input
                label="Agent Phone"
                value={sellerAgentPhone}
                onChange={(e) => setSellerAgentPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </div>
      )}

      {/* Financial Section */}
      {activeSection === 'financial' && (
        <div className="space-y-4">
          <h3 className="text-[15px] font-semibold text-gray-900">Financial Information</h3>
          
          <Input
            label="Offer Price *"
            type="number"
            value={offerPrice}
            onChange={(e) => setOfferPrice(e.target.value)}
            placeholder="350000"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Earnest Money"
              type="number"
              value={earnestMoney}
              onChange={(e) => setEarnestMoney(e.target.value)}
              placeholder="10000"
            />
            <Input
              label="Down Payment"
              type="number"
              value={downPayment}
              onChange={(e) => setDownPayment(e.target.value)}
              placeholder="70000"
            />
            <Input
              label="Loan Amount"
              type="number"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              placeholder="280000"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-600 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this transaction..."
              rows={4}
              className="w-full px-3 py-2 bg-[var(--surface)] border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none"
            />
          </div>
        </div>
      )}

      {/* Dates Section */}
      {activeSection === 'dates' && (
        <div className="space-y-4">
          <h3 className="text-[15px] font-semibold text-gray-900">Important Dates</h3>
          <p className="text-[13px] text-gray-600">
            Set key milestone dates to auto-generate timeline, checklist, and reminders.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Offer Date"
              type="date"
              value={offerDate}
              onChange={(e) => setOfferDate(e.target.value)}
            />
            <Input
              label="Acceptance Date"
              type="date"
              value={acceptanceDate}
              onChange={(e) => setAcceptanceDate(e.target.value)}
            />
          </div>

          <div className="pt-4 border-t border-gray-150">
            <h4 className="text-[13px] font-semibold text-gray-700 mb-3">Inspection</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Inspection Date"
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
              />
              <Input
                label="Inspection Deadline"
                type="date"
                value={inspectionDeadline}
                onChange={(e) => setInspectionDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-150">
            <h4 className="text-[13px] font-semibold text-gray-700 mb-3">Appraisal</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Appraisal Date"
                type="date"
                value={appraisalDate}
                onChange={(e) => setAppraisalDate(e.target.value)}
              />
              <Input
                label="Appraisal Deadline"
                type="date"
                value={appraisalDeadline}
                onChange={(e) => setAppraisalDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-150">
            <h4 className="text-[13px] font-semibold text-gray-700 mb-3">Financing & Title</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Financing Deadline"
                type="date"
                value={financingDeadline}
                onChange={(e) => setFinancingDeadline(e.target.value)}
              />
              <Input
                label="Title Deadline"
                type="date"
                value={titleDeadline}
                onChange={(e) => setTitleDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-150">
            <h4 className="text-[13px] font-semibold text-gray-700 mb-3">Closing</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Closing Date"
                type="date"
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
              />
              <Input
                label="Possession Date"
                type="date"
                value={possessionDate}
                onChange={(e) => setPossessionDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Form actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-150">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isLoading}>
          {isEditing ? 'Update Transaction' : 'Create Transaction'}
        </Button>
      </div>
    </form>
  );
}
