'use client';

import { useState } from 'react';
import { Check, Home, Search, KeyRound, Building2 } from 'lucide-react';

interface LeadCaptureFormProps {
  agentId: string;
  agentName: string;
}

/**
 * Format phone number as (###) ###-####
 */
const formatPhoneNumber = (value: string) => {
  const phoneNumber = value.replace(/\D/g, '');
  const truncated = phoneNumber.slice(0, 10);
  if (truncated.length === 0) return '';
  if (truncated.length <= 3) return truncated;
  if (truncated.length <= 6) return `(${truncated.slice(0, 3)}) ${truncated.slice(3)}`;
  return `(${truncated.slice(0, 3)}) ${truncated.slice(3, 6)}-${truncated.slice(6)}`;
};

const LEAD_TYPES = [
  { value: 'buyer', label: 'Buying', icon: Home },
  { value: 'seller', label: 'Selling', icon: Building2 },
  { value: 'renter', label: 'Renting', icon: KeyRound },
  { value: 'browsing', label: 'Just looking', icon: Search },
];

/**
 * LeadCaptureForm — public-facing form a prospect fills out.
 * On success it swaps to a friendly confirmation state.
 */
export default function LeadCaptureForm({ agentId, agentName }: LeadCaptureFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    leadType: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) });
  };

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
    } catch (err) {
      console.error('Error submitting lead:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Shared input styling — clean, readable on a light card.
  const inputClasses =
    'block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 transition-colors';

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-6">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank you!</h2>
        <p className="text-gray-600 max-w-sm mx-auto">
          Your details have been sent to {agentName}. You can expect to hear back
          soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
          Full name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Jane Smith"
          className={inputClasses}
          required
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="jane@example.com"
          className={inputClasses}
        />
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
          Phone
        </label>
        <input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={handlePhoneChange}
          placeholder="(555) 123-4567"
          className={inputClasses}
        />
      </div>

      {/* Lead type selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          I&apos;m interested in
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {LEAD_TYPES.map(({ value, label, icon: Icon }) => {
            const selected = formData.leadType === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    leadType: selected ? '' : value,
                  })
                }
                className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-3 text-sm font-medium transition-colors ${
                  selected
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
          Message
        </label>
        <textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Tell us a bit about what you're looking for..."
          rows={4}
          className={inputClasses}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-gray-900 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900/30 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Sending...' : 'Send'}
      </button>

      <p className="text-center text-xs text-gray-400">
        Your information is only shared with {agentName}.
      </p>
    </form>
  );
}
