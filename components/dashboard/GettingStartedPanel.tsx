'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles, X, Plus, Inbox, Search } from 'lucide-react';
import Surface from '@/components/ui/Surface';
import Button from '@/components/ui/Button';

const STEPS = [
  {
    href: '/dashboard/projects/new',
    label: 'Create your first listing',
    description: 'Generate AI descriptions and social posts.',
    icon: Plus,
  },
  {
    href: '/dashboard/leads',
    label: 'Set up lead capture',
    description: 'Share your form link or QR code.',
    icon: Inbox,
  },
  {
    href: '/dashboard/property-research',
    label: 'Try property research',
    description: 'Look up owners and run a CMA.',
    icon: Search,
  },
] as const;

type GettingStartedPanelProps = {
  variant: 'welcome' | 'empty';
  onDismiss: () => void;
};

export default function GettingStartedPanel({ variant, onDismiss }: GettingStartedPanelProps) {
  const title =
    variant === 'welcome'
      ? 'Welcome — your trial is active'
      : 'Get started in 3 steps';
  const subtitle =
    variant === 'welcome'
      ? 'Pick one action below to see what Realestic can do. You can explore everything during your free trial.'
      : 'Your workspace is empty. Start with a listing, leads, or property research.';

  return (
    <Surface padding="md" className="relative border-brand-200 bg-gradient-to-r from-white to-brand-50/50">
      <button
        type="button"
        onClick={onDismiss}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        aria-label="Dismiss"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-3 pr-8 mb-4">
        <div className="p-2.5 rounded-xl bg-brand-100 text-brand-700 shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <p className="text-label mb-1">{variant === 'welcome' ? 'Welcome' : 'Getting started'}</p>
          <h2 className="text-title font-semibold text-gray-900">{title}</h2>
          <p className="text-caption text-gray-600 mt-1">{subtitle}</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {STEPS.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-brand-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-brand-600" />
              <span className="text-sm font-medium text-gray-900 group-hover:text-brand-700">{label}</span>
            </div>
            <p className="text-xs text-gray-500 leading-snug">{description}</p>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 mt-auto">
              Open <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </Surface>
  );
}
