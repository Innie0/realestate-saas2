'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Loader2, Mail, MessageSquare } from 'lucide-react';
import AuthLogo from '@/components/branding/AuthLogo';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { SUPPORT_EMAIL } from '@/lib/support-email';

const TOPICS = [
  { value: 'general', label: 'General inquiry' },
  { value: 'sales', label: 'Sales' },
  { value: 'support', label: 'Product support' },
  { value: 'billing', label: 'Billing' },
] as const;

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState<(typeof TOPICS)[number]['value']>('general');
  const [message, setMessage] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = 'Contact - Oikaro';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, topic, message, company }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gray-50 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-brand-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>

        <AuthLogo className="h-14 sm:h-16 w-auto" />

        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Contact us</h1>
          <p className="text-gray-700 mt-2 text-sm sm:text-base">
            Questions about Oikaro? We typically reply within one business day.
          </p>
        </div>

        <div className="rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.06)] p-6 sm:p-8">
          {submitted ? (
            <div className="text-center py-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 border border-brand-100 mb-4">
                <Check className="h-7 w-7 text-brand-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Message sent</h2>
              <p className="text-sm text-gray-700 mb-6">
                Thanks for reaching out. We&apos;ll get back to you at {email}.
              </p>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Back to home
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                required
                autoComplete="name"
              />

              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />

              <Select
                label="Topic"
                value={topic}
                onChange={(value) => setTopic(value as typeof topic)}
                options={TOPICS.map(({ value, label }) => ({ value, label }))}
              />

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Message
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help?"
                  rows={5}
                  required
                  className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none"
                />
              </div>

              {/* Honeypot — hidden from users */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="company">Company</label>
                <input
                  id="company"
                  type="text"
                  name="company"
                  tabIndex={-1}
                  autoComplete="off"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>

              {error && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" fullWidth isLoading={submitting}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Send message
              </Button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-gray-700 flex items-center justify-center gap-1.5">
          <Mail className="w-3.5 h-3.5" />
          Or email us at{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-600 hover:text-brand-700 font-medium">
            {SUPPORT_EMAIL}
          </a>
        </p>
      </div>
    </div>
  );
}
