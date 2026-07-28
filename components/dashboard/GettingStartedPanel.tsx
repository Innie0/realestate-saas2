'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles, X, Plus, Inbox, Search } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

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
      ? 'Pick one action below to see what Oikaro can do. You can explore everything during your free trial.'
      : 'Your workspace is empty. Start with a listing, leads, or property research.';

  return (
    <Card className="p-5 sm:p-6 relative">
      <button
        type="button"
        onClick={onDismiss}
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 pr-8 mb-4">
        <div className="w-10 h-10 rounded-full bg-champagne-50 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-champagne-600" />
        </div>
        <div>
          <p className="text-label mb-1">
            {variant === 'welcome' ? 'Welcome' : 'Getting started'}
          </p>
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">{title}</h2>
          <p className="text-[12.5px] text-muted-foreground mt-1 leading-relaxed">{subtitle}</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {STEPS.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col gap-2 rounded-[10px] border border-border bg-muted/30 px-4 py-3 hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
              <span className="text-[13px] font-medium text-foreground">{label}</span>
            </div>
            <p className="text-[12px] text-muted-foreground leading-snug">{description}</p>
            <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-foreground mt-auto">
              Open <ArrowRight className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </Card>
  );
}
