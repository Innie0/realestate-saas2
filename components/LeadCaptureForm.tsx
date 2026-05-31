'use client';

import { useState } from 'react';
import { Check, Home, Building2, KeyRound, Search } from 'lucide-react';

interface LeadCaptureFormProps {
  agentId: string;
  agentName: string;
}

const formatPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length === 0) return '';
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

const LEAD_TYPES = [
  { value: 'buyer',    label: 'Buying',       icon: Home },
  { value: 'seller',   label: 'Selling',      icon: Building2 },
  { value: 'renter',   label: 'Renting',      icon: KeyRound },
  { value: 'browsing', label: 'Just looking', icon: Search },
];

const TIMELINES = [
  { value: 'asap',     label: 'ASAP' },
  { value: '1-3mo',    label: '1–3 months' },
  { value: '3-6mo',    label: '3–6 months' },
  { value: '6mo+',     label: '6+ months' },
];

const BUYER_BUDGETS = [
  { value: 'under-300k',  label: 'Under $300k' },
  { value: '300-500k',    label: '$300k – $500k' },
  { value: '500-750k',    label: '$500k – $750k' },
  { value: '750k-1m',     label: '$750k – $1M' },
  { value: '1m+',         label: '$1M+' },
];

const RENTER_BUDGETS = [
  { value: 'under-1500',  label: 'Under $1,500/mo' },
  { value: '1500-2500',   label: '$1,500 – $2,500' },
  { value: '2500-4000',   label: '$2,500 – $4,000' },
  { value: '4000+',       label: '$4,000+/mo' },
];

export default function LeadCaptureForm({ agentId, agentName }: LeadCaptureFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    leadType: '',
    timeline: '',
    budget: '',
    area: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const set = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const toggle = (field: string, value: string) =>
    set(field, formData[field as keyof typeof formData] === value ? '' : value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!formData.email.trim() && !formData.phone.trim()) {
      setError('Please add an email or phone number so we can reach you.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, ...formData }),
      });
      const result = await response.json();
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses =
    'block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-colors text-sm';

  const labelClasses = 'block text-sm font-medium text-gray-300 mb-2';

  const showBudget = formData.leadType === 'buyer' || formData.leadType === 'renter';
  const budgetOptions = formData.leadType === 'renter' ? RENTER_BUDGETS : BUYER_BUDGETS;

  if (submitted) {
    return (
      <div className="text-center py-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 border border-white/20 mb-6">
          <Check className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">You&apos;re all set!</h2>
        <p className="text-gray-400 text-sm max-w-xs mx-auto">
          {agentName.split(' ')[0]} will review your details and be in touch soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Name */}
      <div>
        <label htmlFor="name" className={labelClasses}>
          Full name <span className="text-gray-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Jane Smith"
          className={inputClasses}
          required
        />
      </div>

      {/* Email + Phone side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className={labelClasses}>Email</label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="jane@example.com"
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="phone" className={labelClasses}>Phone</label>
          <input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => set('phone', formatPhoneNumber(e.target.value))}
            placeholder="(555) 123-4567"
            className={inputClasses}
          />
        </div>
      </div>
      <p className="text-xs text-gray-600 -mt-3">At least one contact method required.</p>

      {/* What are you looking to do */}
      <div>
        <label className={labelClasses}>I&apos;m looking to</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {LEAD_TYPES.map(({ value, label, icon: Icon }) => {
            const selected = formData.leadType === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  toggle('leadType', value);
                  set('budget', ''); // reset budget when type changes
                }}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-3 text-sm font-medium transition-all ${
                  selected
                    ? 'border-white bg-white text-gray-900'
                    : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div>
        <label className={labelClasses}>Timeline</label>
        <div className="flex flex-wrap gap-2">
          {TIMELINES.map(({ value, label }) => {
            const selected = formData.timeline === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggle('timeline', value)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                  selected
                    ? 'border-white bg-white text-gray-900'
                    : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Budget — only for buyers and renters */}
      {showBudget && (
        <div>
          <label className={labelClasses}>
            {formData.leadType === 'renter' ? 'Monthly budget' : 'Price range'}
          </label>
          <div className="flex flex-wrap gap-2">
            {budgetOptions.map(({ value, label }) => {
              const selected = formData.budget === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggle('budget', value)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                    selected
                      ? 'border-white bg-white text-gray-900'
                      : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Preferred area */}
      <div>
        <label htmlFor="area" className={labelClasses}>
          Preferred city / neighborhood
        </label>
        <input
          id="area"
          type="text"
          value={formData.area}
          onChange={(e) => set('area', e.target.value)}
          placeholder="e.g. Downtown Austin, Westside, etc."
          className={inputClasses}
        />
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className={labelClasses}>
          Anything else? <span className="text-gray-600">(optional)</span>
        </label>
        <textarea
          id="message"
          value={formData.message}
          onChange={(e) => set('message', e.target.value)}
          placeholder="Tell us more about what you're looking for..."
          rows={3}
          className={inputClasses}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-white px-6 py-3.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Sending...' : `Contact ${agentName.split(' ')[0]}`}
      </button>

      <p className="text-center text-xs text-gray-600">
        Your information is only shared with {agentName}.
      </p>
    </form>
  );
}
