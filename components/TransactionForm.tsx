// TransactionForm component
// Form for creating and editing real estate transactions

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Transaction } from '@/types';

interface TransactionFormProps {
  transaction?: Transaction; // Existing transaction for editing
  onSuccess?: (transaction: Transaction) => void;
  onCancel?: () => void;
}

export default function TransactionForm({ transaction, onSuccess, onCancel }: TransactionFormProps) {
  const router = useRouter();
  const isEditing = !!transaction;

  // Form state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState<'property' | 'parties' | 'financial' | 'dates'>('property');

  // Property info
  const [propertyAddress, setPropertyAddress] = useState(transaction?.property_address || '');
  const [propertyCity, setPropertyCity] = useState(transaction?.property_city || '');
  const [propertyState, setPropertyState] = useState(transaction?.property_state || '');
  const [propertyZip, setPropertyZip] = useState(transaction?.property_zip || '');
  const [propertyType, setPropertyType] = useState(transaction?.property_type || 'house');

  // Buyer info
  const [buyerName, setBuyerName] = useState(transaction?.buyer_name || '');
  const [buyerEmail, setBuyerEmail] = useState(transaction?.buyer_email || '');
  const [buyerPhone, setBuyerPhone] = useState(transaction?.buyer_phone || '');
  const [buyerAgentName, setBuyerAgentName] = useState(transaction?.buyer_agent_name || '');
  const [buyerAgentEmail, setBuyerAgentEmail] = useState(transaction?.buyer_agent_email || '');
  const [buyerAgentPhone, setBuyerAgentPhone] = useState(transaction?.buyer_agent_phone || '');

  // Seller info
  const [sellerName, setSellerName] = useState(transaction?.seller_name || '');
  const [sellerEmail, setSellerEmail] = useState(transaction?.seller_email || '');
  const [sellerPhone, setSellerPhone] = useState(transaction?.seller_phone || '');
  const [sellerAgentName, setSellerAgentName] = useState(transaction?.seller_agent_name || '');
  const [sellerAgentEmail, setSellerAgentEmail] = useState(transaction?.seller_agent_email || '');
  const [sellerAgentPhone, setSellerAgentPhone] = useState(transaction?.seller_agent_phone || '');

  // Financial info
  const [offerPrice, setOfferPrice] = useState(transaction?.offer_price?.toString() || '');
  const [earnestMoney, setEarnestMoney] = useState(transaction?.earnest_money?.toString() || '');
  const [downPayment, setDownPayment] = useState(transaction?.down_payment?.toString() || '');
  const [loanAmount, setLoanAmount] = useState(transaction?.loan_amount?.toString() || '');
  const [notes, setNotes] = useState(transaction?.notes || '');

  // Important dates
  const [offerDate, setOfferDate] = useState(transaction?.offer_date || '');
  const [acceptanceDate, setAcceptanceDate] = useState(transaction?.acceptance_date || '');
  const [inspectionDate, setInspectionDate] = useState(transaction?.inspection_date || '');
  const [inspectionDeadline, setInspectionDeadline] = useState(transaction?.inspection_deadline || '');
  const [appraisalDate, setAppraisalDate] = useState(transaction?.appraisal_date || '');
  const [appraisalDeadline, setAppraisalDeadline] = useState(transaction?.appraisal_deadline || '');
  const [financingDeadline, setFinancingDeadline] = useState(transaction?.financing_deadline || '');
  const [titleDeadline, setTitleDeadline] = useState(transaction?.title_deadline || '');
  const [closingDate, setClosingDate] = useState(transaction?.closing_date || '');
  const [possessionDate, setPossessionDate] = useState(transaction?.possession_date || '');

  // Status
  const [status, setStatus] = useState(transaction?.status || 'active');

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

    const transactionData = {
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
      status: status,
    };

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
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Section tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveSection(section.id)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeSection === section.id
                ? 'bg-white/10 text-white shadow-sm border border-white/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Property Section */}
      {activeSection === 'property' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Property Information</h3>
          
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property Type
            </label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="house">House</option>
              <option value="apartment">Apartment</option>
              <option value="condo">Condo</option>
              <option value="land">Land</option>
              <option value="commercial">Commercial</option>
            </select>
          </div>
        </div>
      )}

      {/* Parties Section */}
      {activeSection === 'parties' && (
        <div className="space-y-6">
          {/* Buyer Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Buyer Information</h3>
            
            <Input
              label="Buyer Name *"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="John Smith"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Buyer Email"
                type="email"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                placeholder="buyer@email.com"
              />
              <Input
                label="Buyer Phone"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>

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
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold text-white">Seller Information</h3>
            
            <Input
              label="Seller Name *"
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
              placeholder="Jane Doe"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Seller Email"
                type="email"
                value={sellerEmail}
                onChange={(e) => setSellerEmail(e.target.value)}
                placeholder="seller@email.com"
              />
              <Input
                label="Seller Phone"
                value={sellerPhone}
                onChange={(e) => setSellerPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>

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
          <h3 className="text-lg font-semibold text-white">Financial Information</h3>
          
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="under_contract">Under Contract</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this transaction..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
            />
          </div>
        </div>
      )}

      {/* Dates Section */}
      {activeSection === 'dates' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Important Dates</h3>
          <p className="text-sm text-gray-500">
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

          <div className="pt-4 border-t">
            <h4 className="text-md font-medium text-gray-800 mb-3">Inspection</h4>
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

          <div className="pt-4 border-t">
            <h4 className="text-md font-medium text-gray-800 mb-3">Appraisal</h4>
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

          <div className="pt-4 border-t">
            <h4 className="text-md font-medium text-gray-800 mb-3">Financing & Title</h4>
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

          <div className="pt-4 border-t">
            <h4 className="text-md font-medium text-gray-800 mb-3">Closing</h4>
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
      <div className="flex justify-end space-x-3 pt-4 border-t">
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
