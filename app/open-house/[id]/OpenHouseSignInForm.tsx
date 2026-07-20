'use client';

import { useState } from 'react';

export default function OpenHouseSignInForm({ openHouseId }: { openHouseId: string }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [workingWithAgent, setWorkingWithAgent] = useState(false);
  const [interested, setInterested] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/open-houses/${openHouseId}/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          working_with_agent: workingWithAgent,
          interested,
        }),
      });
      const result = await res.json();
      if (!result.success) {
        setError(result.error || 'Something went wrong.');
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-[var(--surface)] border border-gray-200 rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">✓</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">You&apos;re signed in!</h2>
        <p className="text-sm text-gray-700">Thanks for visiting. The agent will follow up with you soon.</p>
      </div>
    );
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-brand-500 transition-colors';

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--surface)] border border-gray-200 rounded-2xl p-6 space-y-4">
      <div>
        <input
          type="text"
          placeholder="Your name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={inputClass}
        />
      </div>
      <div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <input
          type="tel"
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="space-y-3 pt-2">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${
              interested ? 'bg-brand-500 border-brand-500' : 'border-gray-300 group-hover:border-brand-400'
            }`}
            onClick={() => setInterested(!interested)}
          >
            {interested && <span className="text-white text-xs font-bold">✓</span>}
          </div>
          <span className="text-sm text-gray-600" onClick={() => setInterested(!interested)}>
            I&apos;m interested in this property
          </span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer group">
          <div
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${
              workingWithAgent ? 'bg-brand-500 border-brand-500' : 'border-gray-300 group-hover:border-brand-400'
            }`}
            onClick={() => setWorkingWithAgent(!workingWithAgent)}
          >
            {workingWithAgent && <span className="text-white text-xs font-bold">✓</span>}
          </div>
          <span className="text-sm text-gray-600" onClick={() => setWorkingWithAgent(!workingWithAgent)}>
            I&apos;m already working with an agent
          </span>
        </label>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !name.trim() || (!email.trim() && !phone.trim())}
        className="mkt-cta w-full rounded-xl py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? 'Signing in...' : 'Sign In'}
      </button>

      <p className="text-[10px] text-gray-600 text-center">
        By signing in you agree to be contacted by the hosting agent.
      </p>
    </form>
  );
}
