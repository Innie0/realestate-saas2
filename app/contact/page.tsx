'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Loader2, Mail, MessageSquare } from 'lucide-react';
import AuthLogo from '@/components/branding/AuthLogo';
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
    <div className="marketing-root flex min-h-screen items-center justify-center bg-mkt-background px-4 py-12 font-sans text-mkt-foreground">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-mkt-secondary transition-opacity hover:opacity-70"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>

        <AuthLogo className="h-14 w-auto sm:h-16" />

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-medium tracking-[-0.02em] text-mkt-foreground sm:text-3xl">
            Contact us
          </h1>
          <p className="mt-2 text-sm leading-[1.6] text-mkt-secondary sm:text-base">
            Questions about Oikaro? We typically reply within one business day.
          </p>
        </div>

        <div className="rounded-mkt-card border border-mkt-border bg-mkt-surface p-6 sm:p-8">
          {submitted ? (
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-mkt-border bg-mkt-background">
                <Check className="h-7 w-7 text-mkt-foreground" />
              </div>
              <h2 className="mb-2 text-lg font-medium text-mkt-foreground">Message sent</h2>
              <p className="mb-6 text-sm leading-[1.6] text-mkt-secondary">
                Thanks for reaching out. We&apos;ll get back to you at {email}.
              </p>
              <Link
                href="/"
                className="block w-full rounded-mkt-button border border-mkt-border bg-mkt-background py-2.5 text-center text-sm font-medium text-mkt-foreground transition-opacity hover:opacity-90"
              >
                Back to home
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
                <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-mkt-foreground">
                  Message
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help?"
                  rows={5}
                  required
                  className="block w-full resize-none rounded-mkt-button border border-mkt-border bg-mkt-surface px-4 py-3 text-sm text-mkt-foreground focus:outline-none focus:ring-2 focus:ring-white/10"
                />
              </div>

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
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-mkt-button bg-mkt-accent py-2.5 text-sm font-medium text-mkt-accent-foreground transition-colors hover:bg-mkt-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
                {submitting ? 'Sending...' : 'Send message'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-mkt-secondary">
          <Mail className="h-3.5 w-3.5" />
          Or email us at{' '}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="font-medium text-mkt-foreground underline-offset-2 hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
        </p>
      </div>
    </div>
  );
}
